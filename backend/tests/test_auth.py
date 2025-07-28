import pytest
from httpx import AsyncClient
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection


@pytest.fixture
async def client():
    await connect_to_mongo()
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    await close_mongo_connection()


@pytest.mark.asyncio
async def test_register_user(client):
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    response = await client.post("/auth/register", json=user_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == user_data["name"]
    assert data["email"] == user_data["email"]
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    # Register first user
    await client.post("/auth/register", json=user_data)
    
    # Try to register with same email
    response = await client.post("/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_user(client):
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    # Register user
    await client.post("/auth/register", json=user_data)
    
    # Login
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == user_data["email"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    login_data = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 401 