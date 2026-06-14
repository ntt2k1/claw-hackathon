import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.router import get_current_user_id
from memory.service import save_vibe_profile, get_vibe_profile, save_place_rating, get_place_ratings
from agent.executor import run_recommendation_pipeline
from config import SQLITE_PATH

router = APIRouter(prefix="/api")

class QuizCompleteRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    scores: dict[str, int]
    persona: str | None = None

class RecommendationsRequest(BaseModel):
    primary_vibe: str
    secondary_vibe: str | None = None
    location: str
    trip_type: str  # "inday" | "multiday"
    duration: int   # hours if inday, days if multiday

class PlaceRatingRequest(BaseModel):
    placeId: str
    placeName: str
    category: str
    rating: str  # "like" | "dislike"

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
        "persona": req.persona,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_vibe_profile(user_id, profile)
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute("UPDATE users SET has_vibe = 1 WHERE id = ?", (user_id,))
        await db.commit()
    return {"status": "ok", "profile": profile}

@router.get("/vibe")
async def get_vibe(user_id: str = Depends(get_current_user_id)):
    profile = await get_vibe_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="No vibe profile found")
    return profile

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

@router.post("/vibe/rate")
async def rate_place(
    req: PlaceRatingRequest,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    rating = {
        "placeId": req.placeId,
        "placeName": req.placeName,
        "category": req.category,
        "rating": req.rating,
        "ratedAt": datetime.now(timezone.utc).isoformat(),
    }
    await save_place_rating(user_id, rating)
    return {"status": "ok"}

@router.get("/vibe/ratings")
async def list_ratings(user_id: str = Depends(get_current_user_id)):
    ratings = await get_place_ratings(user_id)
    return {"ratings": ratings}
