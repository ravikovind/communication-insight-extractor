from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MessageIn(BaseModel):
    channel: str
    author: str
    content: str
    timestamp: datetime


class MessageOut(BaseModel):
    id: UUID
    channel: str
    author: str
    content: str
    timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisResultOut(BaseModel):
    id: UUID
    analysis_type: str
    result_data: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalyzeResponse(BaseModel):
    status: str
    results: list[AnalysisResultOut]
