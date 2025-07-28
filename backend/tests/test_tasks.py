import pytest
from httpx import AsyncClient
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection, get_database
from bson import ObjectId


@pytest.fixture
async def client():
    await connect_to_mongo()
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    await close_mongo_connection()


@pytest.fixture
async def auth_token(client):
    # Register and login to get token
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    await client.post("/auth/register", json=user_data)
    
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    response = await client.post("/auth/login", data=login_data)
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_get_tasks(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = await client.get("/tasks/", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_tasks_with_filters(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test with type filter
    response = await client.get("/tasks/?type=daily", headers=headers)
    assert response.status_code == 200
    
    # Test with category filter
    response = await client.get("/tasks/?category=recycling", headers=headers)
    assert response.status_code == 200
    
    # Test with difficulty filter
    response = await client.get("/tasks/?difficulty=easy", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_task_by_id(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # First get all tasks to get an ID
    response = await client.get("/tasks/", headers=headers)
    tasks = response.json()
    
    if tasks:
        task_id = tasks[0]["_id"]
        response = await client.get(f"/tasks/{task_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["_id"] == task_id


@pytest.mark.asyncio
async def test_get_invalid_task_id(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = await client.get("/tasks/invalid_id", headers=headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_task(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    task_data = {
        "title": "Test Task",
        "description": "This is a test task for sustainability",
        "type": "daily",
        "category": "recycling",
        "difficulty": "easy",
        "points": 10,
        "isActive": True
    }
    
    response = await client.post("/tasks/", json=task_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["type"] == task_data["type"]
    assert data["category"] == task_data["category"]


@pytest.mark.asyncio
async def test_complete_task(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get user info
    user_response = await client.get("/auth/me", headers=headers)
    user = user_response.json()
    
    # Get a task
    tasks_response = await client.get("/tasks/", headers=headers)
    tasks = tasks_response.json()
    
    if tasks:
        task = tasks[0]
        
        completion_data = {
            "task_id": task["_id"],
            "user_id": user["_id"],
            "group_id": user.get("group_id")
        }
        
        response = await client.post("/tasks/complete", json=completion_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["task_id"] == task["_id"]
        assert data["user_id"] == user["_id"]
        assert data["points_earned"] == task["points"]


@pytest.mark.asyncio
async def test_get_user_completions(client, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get user info
    user_response = await client.get("/auth/me", headers=headers)
    user = user_response.json()
    
    response = await client.get(f"/tasks/user/{user['_id']}", headers=headers)
    assert response.status_code == 200 