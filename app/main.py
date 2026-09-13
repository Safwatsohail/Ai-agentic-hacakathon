from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from app.api.routes import router

load_dotenv()

app = FastAPI(title="Personalized Discord Issue Response Agent", version="0.1.0")
app.include_router(router)


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")
