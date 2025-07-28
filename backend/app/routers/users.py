from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from ..models.user import User, UserUpdate
from ..auth import get_current_active_user
from ..database import get_database

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user = Depends(get_current_active_user)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    try:
        db = await get_database()
        user = await db.habitgrove.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Convert ObjectId to string and ensure both id and _id are set
        user["_id"] = str(user["_id"])
        user["id"] = user["_id"]
        
        return User(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.patch("/{user_id}", response_model=User)
async def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    try:
        db = await get_database()
        
        # Build update dict with only provided fields
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.group_id is not None:
            update_data["group_id"] = ObjectId(user_update.group_id) if user_update.group_id else None
        if user_update.favorite_tasks is not None:
            update_data["favorite_tasks"] = user_update.favorite_tasks
        
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
        
        result = await db.habitgrove.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Get updated user
        user = await db.habitgrove.users.find_one({"_id": ObjectId(user_id)})
        user["_id"] = str(user["_id"])
        user["id"] = user["_id"]
        
        return User(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/{user_id}/favorite-tasks/{task_id}")
async def add_favorite_task(
    user_id: str, 
    task_id: str, 
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user or task ID")
    
    try:
        db = await get_database()
        
        # Check if task exists
        task = await db.habitgrove.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        # Add task to user's favorites
        result = await db.habitgrove.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"favorite_tasks": task_id}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return {"message": "Task added to favorites"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/{user_id}/favorite-tasks/{task_id}")
async def remove_favorite_task(
    user_id: str, 
    task_id: str, 
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user or task ID")
    
    try:
        db = await get_database()
        
        # Remove task from user's favorites
        result = await db.habitgrove.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"favorite_tasks": task_id}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return {"message": "Task removed from favorites"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 