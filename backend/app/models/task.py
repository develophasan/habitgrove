from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    type: str = Field(..., pattern="^(daily|weekly|monthly|one_time)$")
    category: str = Field(..., pattern="^(health|education|work|social|environment|other|group)$")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    points: int = Field(..., ge=1, le=2000)
    isActive: bool = True
    is_group_task: bool = False
    group_id: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    type: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|one_time)$")
    category: Optional[str] = Field(None, pattern="^(health|education|work|social|environment|other|group)$")
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    points: Optional[int] = Field(None, ge=1, le=2000)
    isActive: Optional[bool] = None
    is_group_task: Optional[bool] = None
    group_id: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class Task(TaskBase):
    id: str = Field(alias="_id")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class BulkTaskUpload(BaseModel):
    tasks: list[TaskCreate] = Field(..., min_items=1, max_items=100)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True 