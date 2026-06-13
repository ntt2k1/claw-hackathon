import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.router import get_current_user_id
from memory.service import save_vibe_profile
from agent.executor import run_recommendation_pipeline
from config import SQLITE_PATH

router = APIRouter(prefix="/api")

class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    scores: dict[str, int]

class RecommendationsRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    location: str
    trip_type: str  # "inday" | "multiday"
    duration: int   # hours if inday, days if multiday

@router.post("/quiz/complete")
async def quiz_complete(
    req: QuizCompleteRequest,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    profile = {
        "primary_vibe": req.primary_vibe,
        "secondary_vibe": req.secondary_vibe,
        "scores": req.scores,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_vibe_profile(user_id, profile)
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("UPDATE users SET has_vibe = 1 WHERE id = ?", (user_id,))
        await db.commit()
    return {"status": "ok", "profile": profile}

@router.post("/recommendations")
async def get_recommendations(
    req: RecommendationsRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        result = await run_recommendation_pipeline(
            primary_vibe=req.primary_vibe,
            secondary_vibe=req.secondary_vibe,
            location=req.location,
            trip_type=req.trip_type,
            duration=req.duration,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
