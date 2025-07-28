from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from ..models.user import User, UserUpdate
from ..models.group import Group, AdminRequest, AdminRequestCreate, AdminRequestUpdate
from ..models.task import Task, TaskCreate, BulkTaskUpload
from ..models.task_completion import TaskCompletion
from ..auth import get_current_active_user
from ..database import get_database

router = APIRouter(prefix="/admin", tags=["admin"])


async def get_current_admin(current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# User Management
@router.get("/users", response_model=List[User])
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None
):
    db = await get_database()
    
    filter_query = {}
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.habitgrove.users.find(filter_query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    for user in users:
        user["_id"] = str(user["_id"])
        user["id"] = user["_id"]
        if "group_id" in user and user["group_id"] is not None:
            user["group_id"] = str(user["group_id"])
    
    return [User(**user) for user in users]


@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    db = await get_database()
    user = await db.habitgrove.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user["_id"] = str(user["_id"])
    user["id"] = user["_id"]
    if "group_id" in user and user["group_id"] is not None:
        user["group_id"] = str(user["group_id"])
    
    return User(**user)


@router.patch("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    db = await get_database()
    
    update_data = user_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data to update")
    
    result = await db.habitgrove.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Return updated user
    user = await db.habitgrove.users.find_one({"_id": ObjectId(user_id)})
    user["_id"] = str(user["_id"])
    user["id"] = user["_id"]
    if "group_id" in user and user["group_id"] is not None:
        user["group_id"] = str(user["group_id"])
    
    return User(**user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
    
    db = await get_database()
    result = await db.habitgrove.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"message": "User deleted successfully"}


# Task Management
@router.get("/tasks", response_model=List[Task])
async def get_all_tasks(
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    type_filter: Optional[str] = None,
    category_filter: Optional[str] = None
):
    db = await get_database()
    
    filter_query = {}
    if type_filter:
        filter_query["type"] = type_filter
    if category_filter:
        filter_query["category"] = category_filter
    
    cursor = db.habitgrove.tasks.find(filter_query).skip(skip).limit(limit)
    tasks = await cursor.to_list(length=limit)
    
    for task in tasks:
        task["_id"] = str(task["_id"])
        task["id"] = task["_id"]
        
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


@router.post("/tasks", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    current_admin: User = Depends(get_current_admin)
):
    db = await get_database()
    
    task_dict = task_data.dict()
    task_dict["created_at"] = datetime.utcnow()
    
    result = await db.habitgrove.tasks.insert_one(task_dict)
    task_dict["_id"] = str(result.inserted_id)
    task_dict["id"] = task_dict["_id"]
    
    return Task(**task_dict)


@router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_update: dict,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID")
    
    db = await get_database()
    
    result = await db.habitgrove.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": task_update}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    task = await db.habitgrove.tasks.find_one({"_id": ObjectId(task_id)})
    task["_id"] = str(task["_id"])
    task["id"] = task["_id"]
    
    return Task(**task)


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task ID")
    
    db = await get_database()
    result = await db.habitgrove.tasks.delete_one({"_id": ObjectId(task_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    return {"message": "Task deleted successfully"}


@router.post("/tasks/bulk", response_model=List[Task])
async def create_bulk_tasks(
    bulk_data: BulkTaskUpload,
    current_admin: User = Depends(get_current_admin)
):
    db = await get_database()
    
    created_tasks = []
    
    for task_data in bulk_data.tasks:
        task_dict = task_data.dict()
        task_dict["created_at"] = datetime.utcnow()
        
        result = await db.habitgrove.tasks.insert_one(task_dict)
        task_dict["_id"] = str(result.inserted_id)
        task_dict["id"] = task_dict["_id"]
        
        created_tasks.append(Task(**task_dict))
    
    return created_tasks


@router.post("/tasks/migrate-categories")
async def migrate_task_categories(
    current_admin: User = Depends(get_current_admin)
):
    """Migrate old task categories to new format"""
    db = await get_database()
    
    # Category mapping from old to new
    category_mapping = {
        'recycling': 'environment',
        'water': 'environment', 
        'energy': 'environment',
        'transport': 'environment',
        'consumption': 'other'
    }
    
    # Type mapping from old to new
    type_mapping = {
        'yearly': 'one_time'
    }
    
    updated_count = 0
    
    # Update categories
    for old_category, new_category in category_mapping.items():
        result = await db.habitgrove.tasks.update_many(
            {"category": old_category},
            {"$set": {"category": new_category}}
        )
        updated_count += result.modified_count
    
    # Update types
    for old_type, new_type in type_mapping.items():
        result = await db.habitgrove.tasks.update_many(
            {"type": old_type},
            {"$set": {"type": new_type}}
        )
        updated_count += result.modified_count
    
    return {
        "message": f"Migration completed. {updated_count} tasks updated.",
        "updated_count": updated_count
    }


# Group Management
@router.get("/groups", response_model=List[Group])
async def get_all_groups(
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = await get_database()
    cursor = db.habitgrove.groups.find({}).skip(skip).limit(limit)
    groups = await cursor.to_list(length=limit)
    
    for group in groups:
        group["_id"] = str(group["_id"])
        group["id"] = group["_id"]
        if "members" in group and group["members"]:
            group["members"] = [str(member) if isinstance(member, ObjectId) else member for member in group["members"]]
        if "admins" in group and group["admins"]:
            group["admins"] = [str(admin) if isinstance(admin, ObjectId) else admin for admin in group["admins"]]
    
    return [Group(**group) for group in groups]


@router.patch("/groups/{group_id}/admins")
async def update_group_admins(
    group_id: str,
    admin_ids: List[str],
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    db = await get_database()
    
    # Validate that all admin IDs are valid users
    for admin_id in admin_ids:
        if not ObjectId.is_valid(admin_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid admin ID: {admin_id}")
        
        user = await db.habitgrove.users.find_one({"_id": ObjectId(admin_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User not found: {admin_id}")
    
    result = await db.habitgrove.groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"admins": [ObjectId(admin_id) for admin_id in admin_ids]}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    return {"message": "Group admins updated successfully"}


# Admin Requests Management
@router.get("/admin-requests", response_model=List[AdminRequest])
async def get_admin_requests(
    current_admin: User = Depends(get_current_admin),
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = await get_database()
    
    filter_query = {}
    if status_filter:
        filter_query["status"] = status_filter
    
    cursor = db.habitgrove.admin_requests.find(filter_query).skip(skip).limit(limit)
    requests = await cursor.to_list(length=limit)
    
    for req in requests:
        req["_id"] = str(req["_id"])
        req["id"] = req["_id"]
        if "group_id" in req and req["group_id"] is not None:
            req["group_id"] = str(req["group_id"])
        if "user_id" in req and req["user_id"] is not None:
            req["user_id"] = str(req["user_id"])
        if "reviewed_by" in req and req["reviewed_by"] is not None:
            req["reviewed_by"] = str(req["reviewed_by"])
    
    print(f"DEBUG: Processed requests: {requests}")
    
    return [AdminRequest(**req) for req in requests]


@router.patch("/admin-requests/{request_id}")
async def review_admin_request(
    request_id: str,
    review_data: AdminRequestUpdate,
    current_admin: User = Depends(get_current_admin)
):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")
    
    db = await get_database()
    
    update_data = review_data.dict()
    update_data["reviewed_at"] = datetime.utcnow()
    update_data["reviewed_by"] = current_admin.id
    
    result = await db.habitgrove.admin_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin request not found")
    
    # If approved, add user to group admins
    if review_data.status == "approved":
        request = await db.habitgrove.admin_requests.find_one({"_id": ObjectId(request_id)})
        if request:
            await db.habitgrove.groups.update_one(
                {"_id": ObjectId(request["group_id"])},
                {"$addToSet": {"admins": ObjectId(request["user_id"])}}
            )
    
    return {"message": f"Admin request {review_data.status}"}


# Statistics and Analytics
@router.get("/statistics")
async def get_admin_statistics(
    current_admin: User = Depends(get_current_admin),
    period: str = Query("all", pattern="^(all|daily|weekly|monthly|yearly)$")
):
    db = await get_database()
    
    # Calculate date range based on period
    now = datetime.utcnow()
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    elif period == "yearly":
        start_date = now - timedelta(days=365)
    else:
        start_date = None
    
    # Build filter query
    filter_query = {}
    if start_date:
        filter_query["completed_at"] = {"$gte": start_date}
    
    # Get statistics
    total_users = await db.habitgrove.users.count_documents({})
    total_tasks = await db.habitgrove.tasks.count_documents({})
    total_groups = await db.habitgrove.groups.count_documents({})
    total_completions = await db.habitgrove.task_completions.count_documents(filter_query)
    
    # Get top users by points
    top_users_cursor = db.habitgrove.users.find({}).sort("points", -1).limit(10)
    top_users = await top_users_cursor.to_list(length=10)
    
    for user in top_users:
        user["_id"] = str(user["_id"])
        user["id"] = user["_id"]
        # Convert group_id from ObjectId to string if it exists
        if "group_id" in user and user["group_id"] is not None:
            user["group_id"] = str(user["group_id"])
    
    # Get top groups by total points
    top_groups_cursor = db.habitgrove.groups.find({}).sort("total_points", -1).limit(10)
    top_groups = await top_groups_cursor.to_list(length=10)
    
    for group in top_groups:
        group["_id"] = str(group["_id"])
        group["id"] = group["_id"]
        # Convert members and admins from ObjectId to string
        if "members" in group:
            group["members"] = [str(member) for member in group["members"]]
        if "admins" in group:
            group["admins"] = [str(admin) for admin in group["admins"]]
    
    return {
        "period": period,
        "total_users": total_users,
        "total_tasks": total_tasks,
        "total_groups": total_groups,
        "total_completions": total_completions,
        "top_users": [User(**user) for user in top_users],
        "top_groups": [Group(**group) for group in top_groups]
    } 