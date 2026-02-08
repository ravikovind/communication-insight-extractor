from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .models import Message, AnalysisResult  # noqa: F401 — ensure models are registered
from .routers import messages, insights


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Communication Insight Extractor",
    description="Extract insights from Slack-like messages using LLM analysis",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router)
app.include_router(insights.router)


@app.get("/")
async def root():
    return {"message": "Buddy, are you lost?"}


@app.get("/health")
async def health():
    return {"status": "ok"}
