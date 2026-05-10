from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.predict import router as predict_router
from routes.vk import router as vk_router
from services.ml_service import ensure_model_loaded
import os



load_dotenv()
print("VK TOKEN LOADED:", bool(os.getenv("VK_TOKEN")))

app = FastAPI(title="TraceGuard VK API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_model_loaded()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(predict_router)
app.include_router(vk_router)
