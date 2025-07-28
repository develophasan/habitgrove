from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId
from ..models.task import Task, TaskCreate, TaskUpdate, BulkTaskUpload
from ..models.task_completion import TaskCompletion, TaskCompletionCreate
from ..models.user import User
from ..auth import get_current_active_user
from ..database import get_database
from datetime import datetime, timedelta

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[Task])
async def get_tasks(
    type: Optional[str] = Query(None, pattern="^(daily|weekly|monthly|one_time)$"),
    category: Optional[str] = Query(None, pattern="^(health|education|work|social|environment|other|group)$"),
    difficulty: Optional[str] = Query(None, pattern="^(easy|medium|hard)$"),
    current_user = Depends(get_current_active_user)
):
    try:
        db = await get_database()
        
        # Build filter
        filter_query = {"isActive": True}
        if type:
            filter_query["type"] = type
        if category:
            filter_query["category"] = category
        if difficulty:
            filter_query["difficulty"] = difficulty
        
        cursor = db.habitgrove.tasks.find(filter_query)
        tasks = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for each task and ensure id field is set
        for task in tasks:
            task["_id"] = str(task["_id"])
            task["id"] = task["_id"]  # Ensure id field is also set
            
            # Convert old categories to new format
            category_mapping = {
                'recycling': 'environment',
                'water': 'environment', 
                'energy': 'environment',
                'transport': 'environment',
                'consumption': 'other'
            }
            
            # Convert old types to new format
            type_mapping = {
                'yearly': 'one_time'
            }
            
            if task.get("category") in category_mapping:
                task["category"] = category_mapping[task["category"]]
            
            if task.get("type") in type_mapping:
                task["type"] = type_mapping[task["type"]]
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        print(f"Error in get_tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/group/{group_id}", response_model=List[Task])
async def get_group_tasks(
    group_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get tasks specific to a group (group tasks)"""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    try:
        db = await get_database()
        
        # Check if user is member of the group
        group = await db.habitgrove.groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        if current_user.id not in [str(member) for member in group.get("members", [])]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")
        
        # Get group tasks
        filter_query = {
            "isActive": True,
            "is_group_task": True,
            "group_id": group_id
        }
        
        cursor = db.habitgrove.tasks.find(filter_query)
        tasks = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for each task
        for task in tasks:
            task["_id"] = str(task["_id"])
            task["id"] = task["_id"]
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        print(f"Error in get_group_tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/group/{group_id}", response_model=Task)
async def create_group_task(
    group_id: str,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a task specific to a group (only group admins can create)"""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    try:
        db = await get_database()
        
        # Check if group exists
        group = await db.habitgrove.groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        # Check if user is admin of the group
        if current_user.id not in [str(admin) for admin in group.get("admins", [])]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can create group tasks")
        
        # Create group task
        task_dict = task_data.dict()
        task_dict["is_group_task"] = True
        task_dict["group_id"] = group_id
        task_dict["created_at"] = datetime.utcnow()
        
        result = await db.habitgrove.tasks.insert_one(task_dict)
        task_dict["_id"] = str(result.inserted_id)
        task_dict["id"] = task_dict["_id"]
        
        return Task(**task_dict)
    except Exception as e:
        print(f"Error in create_group_task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/group/{group_id}/bulk", response_model=List[Task])
async def create_bulk_group_tasks(
    group_id: str,
    bulk_data: BulkTaskUpload,
    current_user: User = Depends(get_current_active_user)
):
    """Create multiple group tasks from JSON (only group admins can create)"""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    try:
        db = await get_database()
        
        # Check if group exists
        group = await db.habitgrove.groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        # Check if user is admin of the group
        if current_user.id not in [str(admin) for admin in group.get("admins", [])]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can create group tasks")
        
        # Create group tasks
        created_tasks = []
        for task_data in bulk_data.tasks:
            task_dict = task_data.dict()
            task_dict["is_group_task"] = True
            task_dict["group_id"] = group_id
            task_dict["created_at"] = datetime.utcnow()
            
            result = await db.habitgrove.tasks.insert_one(task_dict)
            task_dict["_id"] = str(result.inserted_id)
            task_dict["id"] = task_dict["_id"]
            created_tasks.append(Task(**task_dict))
        
        return created_tasks
    except Exception as e:
        print(f"Error in create_bulk_group_tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user = Depends(get_current_active_user)):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID")
    
    try:
        db = await get_database()
        task = await db.habitgrove.tasks.find_one({"_id": ObjectId(task_id)})
        
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        # Convert ObjectId to string and ensure id field is set
        task["_id"] = str(task["_id"])
        task["id"] = task["_id"]  # Ensure id field is also set
        
        # Convert old categories to new format
        category_mapping = {
            'recycling': 'environment',
            'water': 'environment', 
            'energy': 'environment',
            'transport': 'environment',
            'consumption': 'other'
        }
        
        # Convert old types to new format
        type_mapping = {
            'yearly': 'one_time'
        }
        
        if task.get("category") in category_mapping:
            task["category"] = category_mapping[task["category"]]
        
        if task.get("type") in type_mapping:
            task["type"] = type_mapping[task["type"]]
        
        return Task(**task)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/", response_model=Task)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_active_user)):
    # TODO: Add admin check here
    try:
        db = await get_database()
        
        task_dict = task_data.dict()
        result = await db.habitgrove.tasks.insert_one(task_dict)
        task_dict["_id"] = str(result.inserted_id)
        task_dict["id"] = task_dict["_id"]  # Ensure id field is also set
        
        return Task(**task_dict)
    except Exception as e:
        print(f"Error in create_task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/complete", response_model=TaskCompletion)
async def complete_task(
    completion_data: TaskCompletionCreate, 
    current_user = Depends(get_current_active_user)
):
    try:
        db = await get_database()
        
        # Validate task exists
        task = await db.habitgrove.tasks.find_one({"_id": ObjectId(completion_data.task_id)})
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        # Validate user exists
        user = await db.habitgrove.users.find_one({"_id": ObjectId(completion_data.user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Check if task is already completed by this user based on task type
        now = datetime.now()
        
        # Calculate the time window based on task type
        if task["type"] == "daily":
            # Daily tasks: can be completed once per day
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time.replace(day=start_time.day + 1)
        elif task["type"] == "weekly":
            # Weekly tasks: can be completed once per week (Monday to Sunday)
            days_since_monday = now.weekday()
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
            end_time = start_time + timedelta(days=7)
        elif task["type"] == "monthly":
            # Monthly tasks: can be completed once per month
            start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_time = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                end_time = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        elif task["type"] == "yearly":
            # Yearly tasks: can be completed once per year
            start_time = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_time = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Default to daily
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time.replace(day=start_time.day + 1)
        
        existing_completion = await db.habitgrove.task_completions.find_one({
            "task_id": ObjectId(completion_data.task_id),
            "user_id": ObjectId(completion_data.user_id),
            "completed_at": {"$gte": start_time, "$lt": end_time}
        })
        
        if existing_completion:
            if task["type"] == "daily":
                error_msg = "Bu görev bugün zaten tamamlandı"
            elif task["type"] == "weekly":
                error_msg = "Bu görev bu hafta zaten tamamlandı"
            elif task["type"] == "monthly":
                error_msg = "Bu görev bu ay zaten tamamlandı"
            elif task["type"] == "yearly":
                error_msg = "Bu görev bu yıl zaten tamamlandı"
            else:
                error_msg = "Bu görev zaten tamamlandı"
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=error_msg
            )
        
        # Create completion record
        completion_dict = completion_data.dict()
        completion_dict["completed_at"] = datetime.utcnow()
        completion_dict["points_earned"] = task["points"]  # Add points_earned field
        
        # Convert string IDs to ObjectId for database
        completion_dict["task_id"] = ObjectId(completion_data.task_id)
        completion_dict["user_id"] = ObjectId(completion_data.user_id)
        if completion_data.group_id:
            completion_dict["group_id"] = ObjectId(completion_data.group_id)
        
        result = await db.habitgrove.task_completions.insert_one(completion_dict)
        
        # Update user points
        points_to_add = task["points"]
        await db.habitgrove.users.update_one(
            {"_id": ObjectId(completion_data.user_id)},
            {"$inc": {"points": points_to_add}}
        )
        
        # Update group points if group_id is provided
        if completion_data.group_id:
            await db.habitgrove.groups.update_one(
                {"_id": ObjectId(completion_data.group_id)},
                {"$inc": {"total_points": points_to_add}}
            )
        
        # Convert ObjectId back to string for response
        completion_dict["_id"] = str(result.inserted_id)
        completion_dict["id"] = completion_dict["_id"]
        completion_dict["task_id"] = str(completion_dict["task_id"])
        completion_dict["user_id"] = str(completion_dict["user_id"])
        if completion_data.group_id:
            completion_dict["group_id"] = str(completion_dict["group_id"])
        
        return TaskCompletion(**completion_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in complete_task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[TaskCompletion])
async def get_user_completions(
    user_id: str, 
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    try:
        db = await get_database()
        
        print(f"Fetching completions for user: {user_id}")
        
        # Get user's task completions
        cursor = db.habitgrove.task_completions.find({"user_id": ObjectId(user_id)})
        completions = await cursor.to_list(length=100)
        
        print(f"Found {len(completions)} completions")
        
        # Convert ObjectIds to strings and add task details
        for completion in completions:
            completion["_id"] = str(completion["_id"])
            completion["id"] = completion["_id"]
            completion["task_id"] = str(completion["task_id"])
            completion["user_id"] = str(completion["user_id"])
            if completion.get("group_id"):
                completion["group_id"] = str(completion["group_id"])
            
            # Get task details
            task = await db.habitgrove.tasks.find_one({"_id": ObjectId(completion["task_id"])})
            if task:
                task["_id"] = str(task["_id"])
                task["id"] = task["_id"]
                completion["task"] = task
                
                # Add points_earned if it doesn't exist
                if "points_earned" not in completion:
                    completion["points_earned"] = task["points"]
            else:
                # If task not found, set default points
                if "points_earned" not in completion:
                    completion["points_earned"] = 10
        
        return [TaskCompletion(**completion) for completion in completions]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_completions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/group/{group_id}/completions", response_model=List[TaskCompletion])
async def get_group_completions(
    group_id: str, 
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    try:
        db = await get_database()
        
        print(f"Fetching completions for group: {group_id}")
        
        # Get group's task completions
        cursor = db.habitgrove.task_completions.find({"group_id": ObjectId(group_id)})
        completions = await cursor.to_list(length=100)
        
        print(f"Found {len(completions)} completions for group {group_id}")
        
        # Convert ObjectIds to strings
        for completion in completions:
            completion["_id"] = str(completion["_id"])
            completion["id"] = completion["_id"]
            completion["task_id"] = str(completion["task_id"])
            completion["user_id"] = str(completion["user_id"])
            completion["group_id"] = str(completion["group_id"])
            
            # Ensure completed_at field exists and is properly formatted
            if "completed_at" not in completion:
                completion["completed_at"] = completion.get("created_at", datetime.utcnow())
            elif isinstance(completion["completed_at"], str):
                completion["completed_at"] = datetime.fromisoformat(completion["completed_at"].replace('Z', '+00:00'))
        
        return [TaskCompletion(**completion) for completion in completions]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_group_completions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 