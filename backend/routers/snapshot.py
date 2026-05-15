from fastapi import APIRouter, HTTPException

from models.requests import SnapshotRequest
from models.responses import SnapshotResponse
from services.snapshot import get_snapshot

router = APIRouter(tags=["dashboard"])


@router.post("/snapshot", response_model=SnapshotResponse)
def snapshot(req: SnapshotRequest):
    try:
        return get_snapshot(
            target_weights=req.target_weights,
            drift_threshold=req.drift_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
