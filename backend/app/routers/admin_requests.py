from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId
from ..models.group import AdminRequest, AdminRequestCreate
from ..auth import get_current_active_user
from ..database import get_database

router = APIRouter(prefix="/admin-requests", tags=["admin-requests"])


@router.post("/", response_model=AdminRequest)
async def create_admin_request(
    request_data: AdminRequestCreate,
    current_user = Depends(get_current_active_user)
):
    print(f"DEBUG: Received request data: {request_data}")
    print(f"DEBUG: Current user: {current_user}")
    
    db = await get_database()
    
    # Check if group exists
    if not ObjectId.is_valid(request_data.group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    group = await db.habitgrove.groups.find_one({"_id": ObjectId(request_data.group_id)})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    print(f"DEBUG: Found group: {group}")
    
    # Check if user is a member of the group
    if current_user.id not in [str(member) for member in group.get("members", [])]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of the group to request admin status")
    
    # Check if user is already an admin
    if current_user.id in [str(admin) for admin in group.get("admins", [])]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already an admin of this group")
    
    # Check if user already has a pending request for this group
    existing_request = await db.habitgrove.admin_requests.find_one({
        "group_id": ObjectId(request_data.group_id),
        "user_id": ObjectId(current_user.id),
        "status": "pending"
    })
    
    if existing_request:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have a pending admin request for this group")
    
    # Create admin request
    request_dict = request_data.dict()
    request_dict["user_id"] = current_user.id
    request_dict["created_at"] = datetime.utcnow()
    
    print(f"DEBUG: Request dict to insert: {request_dict}")
    
    result = await db.habitgrove.admin_requests.insert_one(request_dict)
    request_dict["_id"] = str(result.inserted_id)
    request_dict["id"] = request_dict["_id"]
    request_dict["group_id"] = str(request_dict["group_id"])
    request_dict["user_id"] = str(request_dict["user_id"])
    
    print(f"DEBUG: Final request dict: {request_dict}")
    
    return AdminRequest(**request_dict)


@router.get("/my-requests", response_model=List[AdminRequest])
async def get_my_admin_requests(current_user = Depends(get_current_active_user)):
    db = await get_database()
    
    cursor = db.habitgrove.admin_requests.find({"user_id": ObjectId(current_user.id)})
    requests = await cursor.to_list(length=100)
    
    for req in requests:
        req["_id"] = str(req["_id"])
        req["id"] = req["_id"]
        if "group_id" in req and req["group_id"] is not None:
            req["group_id"] = str(req["group_id"])
        if "user_id" in req and req["user_id"] is not None:
            req["user_id"] = str(req["user_id"])
        if "reviewed_by" in req and req["reviewed_by"] is not None:
            req["reviewed_by"] = str(req["reviewed_by"])
    
    return [AdminRequest(**req) for req in requests]


@router.get("/{request_id}", response_model=AdminRequest)
async def get_admin_request(
    request_id: str,
    current_user = Depends(get_current_active_user)
):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request ID")
    
    db = await get_database()
    request = await db.habitgrove.admin_requests.find_one({"_id": ObjectId(request_id)})
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin request not found")
    
    # Check if user owns this request or is an admin
    if str(request["user_id"]) != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    request["_id"] = str(request["_id"])
    request["id"] = request["_id"]
    if "group_id" in request and request["group_id"] is not None:
        request["group_id"] = str(request["group_id"])
    if "user_id" in request and request["user_id"] is not None:
        request["user_id"] = str(request["user_id"])
    if "reviewed_by" in request and request["reviewed_by"] is not None:
        request["reviewed_by"] = str(request["reviewed_by"])
    
    return AdminRequest(**request) 