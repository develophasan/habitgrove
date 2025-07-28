from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from bson import ObjectId
from ..models.user import User, UserCreate
from ..auth import get_password_hash, verify_password, create_access_token, get_current_active_user
from ..database import get_database
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.habitgrove.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["points"] = 0
    user_dict["favorite_tasks"] = []  # Initialize empty favorite tasks list
    
    result = await db.habitgrove.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    user_dict["id"] = user_dict["_id"]  # Ensure id field is also set
    
    # Convert group_id ObjectId to string if it exists
    if "group_id" in user_dict and user_dict["group_id"] is not None:
        user_dict["group_id"] = str(user_dict["group_id"])
    
    return User(**user_dict)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_database()
    
    # Find user by email
    user = await db.habitgrove.users.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    # Verify password
    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    # Convert ObjectId to string and ensure both id and _id are set
    user["_id"] = str(user["_id"])
    user["id"] = user["_id"]  # Ensure id field is also set
    
    # Convert group_id ObjectId to string if it exists
    if "group_id" in user and user["group_id"] is not None:
        user["group_id"] = str(user["group_id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(**user)
    }


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user 