from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Message
from ..schemas import MessageIn, MessageOut

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


@router.post("/", response_model=list[MessageOut])
async def create_messages(messages: list[MessageIn], db: AsyncSession = Depends(get_db)):
    db_messages = []
    for msg in messages:
        db_msg = Message(
            channel=msg.channel,
            author=msg.author,
            content=msg.content,
            timestamp=msg.timestamp,
        )
        db.add(db_msg)
        db_messages.append(db_msg)
    await db.commit()
    for msg in db_messages:
        await db.refresh(msg)
    return db_messages


@router.get("/", response_model=list[MessageOut])
async def get_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).order_by(Message.timestamp))
    return result.scalars().all()
