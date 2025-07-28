from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from pydantic import BaseModel
from ..models.group import Group, GroupCreate, GroupUpdate
from ..models.user import User
from ..auth import get_current_active_user
from ..database import get_database

router = APIRouter(prefix="/groups", tags=["groups"])


class JoinGroupRequest(BaseModel):
    group_id: str


@router.get("/", response_model=List[Group])
async def get_groups(current_user = Depends(get_current_active_user)):
    db = await get_database()
    cursor = db.habitgrove.groups.find({})
    groups = await cursor.to_list(length=100)
    
    # Convert ObjectId to string for each group and its members
    for group in groups:
        group["_id"] = str(group["_id"])
        group["id"] = group["_id"]  # Add id field
        # Convert member ObjectIds to strings
        if "members" in group and group["members"]:
            group["members"] = [str(member) if isinstance(member, ObjectId) else member for member in group["members"]]
        # Convert admin ObjectIds to strings
        if "admins" in group and group["admins"]:
            group["admins"] = [str(admin) if isinstance(admin, ObjectId) else admin for admin in group["admins"]]
    
    return [Group(**group) for group in groups]


@router.post("/", response_model=Group)
async def create_group(group_data: GroupCreate, current_user = Depends(get_current_active_user)):
    db = await get_database()
    
    group_dict = group_data.dict()
    group_dict["members"] = [current_user.id]
    group_dict["admins"] = [current_user.id]  # Creator becomes admin
    group_dict["total_points"] = 0
    
    result = await db.habitgrove.groups.insert_one(group_dict)
    group_dict["_id"] = str(result.inserted_id)
    group_dict["id"] = group_dict["_id"]  # Add id field
    
    # Update user's group_id
    await db.habitgrove.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"group_id": result.inserted_id}}
    )
    
    return Group(**group_dict)


@router.get("/{group_id}", response_model=Group)
async def get_group(group_id: str, current_user = Depends(get_current_active_user)):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    db = await get_database()
    group = await db.habitgrove.groups.find_one({"_id": ObjectId(group_id)})
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    # Convert ObjectId to string
    group["_id"] = str(group["_id"])
    group["id"] = group["_id"]  # Add id field
    # Convert member ObjectIds to strings
    if "members" in group and group["members"]:
        group["members"] = [str(member) if isinstance(member, ObjectId) else member for member in group["members"]]
    # Convert admin ObjectIds to strings
    if "admins" in group and group["admins"]:
        group["admins"] = [str(admin) if isinstance(admin, ObjectId) else admin for admin in group["admins"]]
    
    return Group(**group)


@router.get("/{group_id}/admins", response_model=List[dict])
async def get_group_admins(group_id: str, current_user = Depends(get_current_active_user)):
    """Get detailed information about group admins"""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    db = await get_database()
    group = await db.habitgrove.groups.find_one({"_id": ObjectId(group_id)})
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    # Get admin user details
    admin_details = []
    for admin_id in group.get("admins", []):
        user = await db.habitgrove.users.find_one({"_id": ObjectId(admin_id)})
        if user:
            # Get admin request details for additional info
            admin_request = await db.habitgrove.admin_requests.find_one({
                "user_id": ObjectId(admin_id),
                "group_id": ObjectId(group_id)
            })
            
            admin_info = {
                "id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "points": user.get("points", 0),
                "full_name": admin_request.get("full_name", user.get("name", "")) if admin_request else user.get("name", ""),
                "profession": admin_request.get("profession", "") if admin_request else "",
                "bio": admin_request.get("bio", "") if admin_request else ""
            }
            admin_details.append(admin_info)
    
    return admin_details


@router.post("/join")
async def join_group(request: JoinGroupRequest, current_user = Depends(get_current_active_user)):
    if not ObjectId.is_valid(request.group_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID")
    
    db = await get_database()
    
    # Check if group exists
    group = await db.habitgrove.groups.find_one({"_id": ObjectId(request.group_id)})
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    # Check if user is already a member
    if current_user.id in group["members"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already a member of this group")
    
    # Add user to group
    await db.habitgrove.groups.update_one(
        {"_id": ObjectId(request.group_id)},
        {"$push": {"members": current_user.id}}
    )
    
    # Update user's group_id
    await db.habitgrove.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"group_id": ObjectId(request.group_id)}}
    )
    
    return {"message": "Successfully joined group"} 