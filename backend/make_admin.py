from pymongo import MongoClient
from bson import ObjectId
import os

# Connect to MongoDB using the same connection string as the app
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")

try:
    client = MongoClient(MONGODB_URL)
    db = client.habitgrove
    
    # Test connection
    client.admin.command('ping')
    print("Connected to MongoDB successfully!")
    
    # Update user to make them admin
    user_id = '688691923ae6eb0f3f04192a'
    result = db.users.update_one(
        {'_id': ObjectId(user_id)}, 
        {'$set': {'is_admin': True}}
    )
    
    print(f'Updated: {result.modified_count} document(s)')
    
    # Verify the update
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if user:
        print(f"User: {user['name']}")
        print(f"Email: {user['email']}")
        print(f"is_admin: {user.get('is_admin', False)}")
    else:
        print("User not found")
    
    client.close()
    print("Database connection closed.")
    
except Exception as e:
    print(f"Error: {e}")
    print("Make sure MongoDB is running and accessible.") 