from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from typing import Optional, Dict, Any


class TaskCompletionBase(BaseModel):
    task_id: str
    user_id: str
    group_id: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class TaskCompletionCreate(TaskCompletionBase):
    pass


class TaskCompletion(TaskCompletionBase):
    id: str = Field(alias="_id")
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    points_earned: int
    task: Optional[Dict[str, Any]] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True 