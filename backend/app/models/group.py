from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class GroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., pattern="^(university|school|municipality|ngo|company)$")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[str] = Field(None, pattern="^(university|school|municipality|ngo|company)$")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class Group(GroupBase):
    id: Optional[str] = None
    members: List[str] = []
    admins: List[str] = []  # Admin user IDs
    total_points: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class AdminRequest(BaseModel):
    id: Optional[str] = None
    group_id: str
    user_id: str
    reason: str = Field(..., min_length=10, max_length=500)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    profession: str = Field(..., min_length=2, max_length=100)
    bio: str = Field(..., min_length=20, max_length=1000)
    status: str = Field(default="pending", pattern="^(pending|approved|rejected)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    admin_notes: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class AdminRequestCreate(BaseModel):
    group_id: str
    reason: str = Field(..., min_length=10, max_length=500)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    profession: str = Field(..., min_length=2, max_length=100)
    bio: str = Field(..., min_length=20, max_length=1000)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class AdminRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    admin_notes: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True 