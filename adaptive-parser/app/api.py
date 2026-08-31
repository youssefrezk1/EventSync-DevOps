from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.factory import build_default_engine
from app.log_sanitizer import LogSanitizer


BASE_DIR = Path(__file__).resolve().parent.parent
REGISTRY_PATH = BASE_DIR / "data" / "parser_registry.json"

app = FastAPI(
    title="EventSync Adaptive Parser",
    version="0.1.0",
)

# The production engine is intentionally NOT created at import time.
#
# This keeps:
#   - module imports safe
#   - /health independent of provider credentials
#   - offline/unit tests independent of Groq/Mistral
#
# The engine is initialized lazily when parsing/metrics actually need it,
# or explicitly replaced by tests.
_engine = None
engine_lock = Lock()
log_sanitizer = LogSanitizer()


class ParseRequest(BaseModel):
    message: str = Field(min_length=1)


def build_production_engine():
    return build_default_engine(
        registry_path=REGISTRY_PATH,
    )


def get_engine():
    global _engine

    if _engine is None:
        _engine = build_production_engine()

    return _engine


def set_engine(engine):
    """
    Replace the active engine.

    Primarily used for deterministic offline tests, but also keeps the
    API boundary independent from a specific engine construction policy.
    """
    global _engine
    _engine = engine


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "eventsync-adaptive-parser",
    }


@app.get("/metrics")
def metrics():
    try:
        with engine_lock:
            active_engine = get_engine()
            return active_engine.get_metrics()

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Adaptive parser engine is not configured.",
        ) from exc


@app.post("/v1/parse")
def parse_event(request: ParseRequest):
    try:
        with engine_lock:
            active_engine = get_engine()

            sanitized_message = log_sanitizer.sanitize(
                request.message
            )

            result = active_engine.process(
                sanitized_message
            )

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Adaptive parser engine is not configured.",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Adaptive parsing failed.",
        ) from exc

    return result
