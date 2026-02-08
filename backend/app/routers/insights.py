from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Message, AnalysisResult
from ..schemas import AnalysisResultOut, AnalyzeResponse
from ..services.llm import extract_topics, extract_sentiment
from ..services.analysis import compute_response_times

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).order_by(Message.timestamp))
    messages = result.scalars().all()

    if not messages:
        raise HTTPException(status_code=400, detail="No messages found. Upload messages first.")

    msg_dicts = [
        {
            "channel": m.channel,
            "author": m.author,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in messages
    ]

    topics = await extract_topics(msg_dicts)
    sentiment = await extract_sentiment(msg_dicts)
    response_times = compute_response_times(msg_dicts)

    results = []
    for analysis_type, data in [
        ("topics", topics),
        ("sentiment", sentiment),
        ("response_time", response_times),
    ]:
        record = AnalysisResult(analysis_type=analysis_type, result_data=data)
        db.add(record)
        results.append(record)

    await db.commit()
    for r in results:
        await db.refresh(r)

    return AnalyzeResponse(status="completed", results=results)


@router.get("/", response_model=list[AnalysisResultOut])
async def get_insights(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AnalysisResult).order_by(AnalysisResult.created_at.desc()))
    return result.scalars().all()
