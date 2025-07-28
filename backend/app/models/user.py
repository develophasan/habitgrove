from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    favorite_tasks: Optional[List[str]] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class User(UserBase):
    id: Optional[str] = None
    points: int = 0
    group_id: Optional[str] = None
    favorite_tasks: List[str] = []
    is_admin: bool = False  # System admin flag
    created_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True 