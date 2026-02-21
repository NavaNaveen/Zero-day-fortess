import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import battle, health
from api.websockets import drain_broadcast_queue
from core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start WebSocket broadcast drain loop
    task = asyncio.create_task(drain_broadcast_queue())
    yield
    task.cancel()


app = FastAPI(
    title="Zero Day Fortress API",
    description="Autonomous Red Team vs Blue Team AI Cyber Defense",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(battle.router)


@app.get("/")
async def root():
    return {"message": "🛡️ Zero Day Fortress API", "docs": "/docs"}
