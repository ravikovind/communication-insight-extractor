from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Message
from ..schemas import MessageIn, MessageOut

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


@router.post("/", response_model=list[MessageOut])
async def create_messages(messages: list[MessageIn], db: AsyncSession = Depends(get_db)):
    for msg in messages:
        stmt = (
            insert(Message)
            .values(
                channel=msg.channel,
                author=msg.author,
                content=msg.content,
                timestamp=msg.timestamp,
            )
            .on_conflict_do_nothing(constraint="uq_message_identity")
        )
        await db.execute(stmt)
    await db.commit()

    result = await db.execute(select(Message).order_by(Message.timestamp))
    return result.scalars().all()


@router.get("/", response_model=list[MessageOut])
async def get_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).order_by(Message.timestamp))
    return result.scalars().all()
