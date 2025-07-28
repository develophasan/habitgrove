import asyncio
import os
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Sample data
users_data = [
    {
        "name": "Ahmet Yılmaz",
        "email": "ahmet@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq3re",  # password123
        "points": 150,
        "created_at": datetime.utcnow() - timedelta(days=30)
    },
    {
        "name": "Ayşe Demir",
        "email": "ayse@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq3re",  # password123
        "points": 280,
        "created_at": datetime.utcnow() - timedelta(days=25)
    },
    {
        "name": "Mehmet Kaya",
        "email": "mehmet@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq3re",  # password123
        "points": 95,
        "created_at": datetime.utcnow() - timedelta(days=20)
    },
    {
        "name": "Fatma Özkan",
        "email": "fatma@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq3re",  # password123
        "points": 320,
        "created_at": datetime.utcnow() - timedelta(days=15)
    },
    {
        "name": "Ali Çelik",
        "email": "ali@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq3re",  # password123
        "points": 180,
        "created_at": datetime.utcnow() - timedelta(days=10)
    }
]

groups_data = [
    {
        "name": "Gaziantep Üniversitesi",
        "type": "university",
        "members": [],
        "total_points": 0,
        "created_at": datetime.utcnow() - timedelta(days=30)
    },
    {
        "name": "Şahinbey Belediyesi",
        "type": "municipality",
        "members": [],
        "total_points": 0,
        "created_at": datetime.utcnow() - timedelta(days=25)
    },
    {
        "name": "Ekoloji Derneği",
        "type": "ngo",
        "members": [],
        "total_points": 0,
        "created_at": datetime.utcnow() - timedelta(days=20)
    }
]

tasks_data = [
    # Daily tasks
    {
        "title": "Su tasarrufu yap",
        "description": "Günlük su kullanımını %20 azalt. Duş süresini kısalt, muslukları kapat.",
        "type": "daily",
        "category": "water",
        "difficulty": "easy",
        "points": 10,
        "isActive": True
    },
    {
        "title": "Plastik şişe kullanma",
        "description": "Tek kullanımlık plastik şişe yerine yeniden kullanılabilir su şişesi kullan.",
        "type": "daily",
        "category": "recycling",
        "difficulty": "easy",
        "points": 15,
        "isActive": True
    },
    {
        "title": "Toplu taşıma kullan",
        "description": "Araba yerine toplu taşıma, bisiklet veya yürüyüş tercih et.",
        "type": "daily",
        "category": "transport",
        "difficulty": "medium",
        "points": 20,
        "isActive": True
    },
    {
        "title": "Enerji tasarrufu",
        "description": "Kullanılmayan cihazları kapat, LED ampul kullan.",
        "type": "daily",
        "category": "energy",
        "difficulty": "easy",
        "points": 12,
        "isActive": True
    },
    {
        "title": "Yerel ürün al",
        "description": "Yerel çiftçilerden organik ürün satın al.",
        "type": "daily",
        "category": "consumption",
        "difficulty": "medium",
        "points": 18,
        "isActive": True
    },
    {
        "title": "Kağıt geri dönüşümü",
        "description": "Kullanılan kağıtları geri dönüşüm kutusuna at.",
        "type": "daily",
        "category": "recycling",
        "difficulty": "easy",
        "points": 8,
        "isActive": True
    },
    {
        "title": "Çamaşır soğuk suda yıka",
        "description": "Çamaşırları soğuk suda yıkayarak enerji tasarrufu sağla.",
        "type": "daily",
        "category": "energy",
        "difficulty": "easy",
        "points": 10,
        "isActive": True
    },
    {
        "title": "Sebze bahçesi kur",
        "description": "Balkonda veya bahçede küçük bir sebze bahçesi oluştur.",
        "type": "daily",
        "category": "consumption",
        "difficulty": "hard",
        "points": 25,
        "isActive": True
    },
    {
        "title": "Su kaçaklarını kontrol et",
        "description": "Evdeki su kaçaklarını kontrol et ve düzelt.",
        "type": "daily",
        "category": "water",
        "difficulty": "medium",
        "points": 15,
        "isActive": True
    },
    {
        "title": "Karbon ayak izini hesapla",
        "description": "Günlük aktivitelerinin karbon ayak izini hesapla ve azalt.",
        "type": "daily",
        "category": "consumption",
        "difficulty": "medium",
        "points": 20,
        "isActive": True
    },
    
    # Weekly tasks
    {
        "title": "Haftalık temizlik",
        "description": "Evde kapsamlı bir temizlik yap ve geri dönüştürülebilir malzemeleri ayır.",
        "type": "weekly",
        "category": "recycling",
        "difficulty": "medium",
        "points": 50,
        "isActive": True
    },
    {
        "title": "Enerji denetimi",
        "description": "Evdeki enerji kullanımını analiz et ve tasarruf önerileri uygula.",
        "type": "weekly",
        "category": "energy",
        "difficulty": "hard",
        "points": 75,
        "isActive": True
    },
    {
        "title": "Su tasarrufu projesi",
        "description": "Su tasarrufu için yeni bir proje başlat (örn: yağmur suyu toplama).",
        "type": "weekly",
        "category": "water",
        "difficulty": "hard",
        "points": 80,
        "isActive": True
    },
    {
        "title": "Toplu alışveriş",
        "description": "Haftalık alışverişi tek seferde yap ve ambalaj atığını azalt.",
        "type": "weekly",
        "category": "consumption",
        "difficulty": "easy",
        "points": 30,
        "isActive": True
    },
    {
        "title": "Bisiklet turu",
        "description": "Haftada en az bir kez bisikletle uzun bir tur yap.",
        "type": "weekly",
        "category": "transport",
        "difficulty": "medium",
        "points": 45,
        "isActive": True
    },
    {
        "title": "Geri dönüşüm eğitimi",
        "description": "Aile ve arkadaşlarına geri dönüşüm hakkında bilgi ver.",
        "type": "weekly",
        "category": "recycling",
        "difficulty": "medium",
        "points": 40,
        "isActive": True
    },
    {
        "title": "Enerji verimli cihazlar",
        "description": "Eski cihazları enerji verimli olanlarla değiştir.",
        "type": "weekly",
        "category": "energy",
        "difficulty": "hard",
        "points": 100,
        "isActive": True
    },
    {
        "title": "Su filtreleme sistemi",
        "description": "Ev için su filtreleme sistemi kur ve şişe su kullanımını azalt.",
        "type": "weekly",
        "category": "water",
        "difficulty": "hard",
        "points": 90,
        "isActive": True
    },
    {
        "title": "Yerel pazar ziyareti",
        "description": "Yerel pazarlardan alışveriş yap ve paketlenmiş ürünlerden kaçın.",
        "type": "weekly",
        "category": "consumption",
        "difficulty": "medium",
        "points": 35,
        "isActive": True
    },
    {
        "title": "Toplu taşıma planı",
        "description": "Haftalık ulaşım planını optimize et ve araba kullanımını azalt.",
        "type": "weekly",
        "category": "transport",
        "difficulty": "medium",
        "points": 40,
        "isActive": True
    },
    
    # Monthly tasks
    {
        "title": "Güneş enerjisi kurulumu",
        "description": "Ev için güneş enerjisi sistemi kur veya araştır.",
        "type": "monthly",
        "category": "energy",
        "difficulty": "hard",
        "points": 300,
        "isActive": True
    },
    {
        "title": "Su tasarrufu sistemi",
        "description": "Ev için kapsamlı su tasarrufu sistemi kur.",
        "type": "monthly",
        "category": "water",
        "difficulty": "hard",
        "points": 250,
        "isActive": True
    },
    {
        "title": "Organik bahçe",
        "description": "Büyük bir organik bahçe kur ve kendi sebzelerini yetiştir.",
        "type": "monthly",
        "category": "consumption",
        "difficulty": "hard",
        "points": 200,
        "isActive": True
    },
    {
        "title": "Elektrikli araç",
        "description": "Elektrikli araç satın al veya hibrit araç kullan.",
        "type": "monthly",
        "category": "transport",
        "difficulty": "hard",
        "points": 400,
        "isActive": True
    },
    {
        "title": "Geri dönüşüm merkezi",
        "description": "Mahalle için geri dönüşüm merkezi kur veya mevcut olanı destekle.",
        "type": "monthly",
        "category": "recycling",
        "difficulty": "hard",
        "points": 350,
        "isActive": True
    },
    
    # Yearly tasks
    {
        "title": "Sıfır atık yaşam",
        "description": "Bir yıl boyunca sıfır atık prensibiyle yaşa.",
        "type": "yearly",
        "category": "recycling",
        "difficulty": "hard",
        "points": 1000,
        "isActive": True
    },
    {
        "title": "Karbon nötr yaşam",
        "description": "Karbon ayak izini sıfırla ve karbon nötr bir yaşam sür.",
        "type": "yearly",
        "category": "consumption",
        "difficulty": "hard",
        "points": 1500,
        "isActive": True
    }
]


async def seed_database():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client.habitgrove
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.groups.delete_many({})
    await db.tasks.delete_many({})
    await db.task_completions.delete_many({})
    
    print("🗑️  Cleared existing data")
    
    # Insert users
    user_ids = []
    for user_data in users_data:
        result = await db.users.insert_one(user_data)
        user_ids.append(result.inserted_id)
    
    print(f"👥 Inserted {len(users_data)} users")
    
    # Insert groups
    group_ids = []
    for group_data in groups_data:
        result = await db.groups.insert_one(group_data)
        group_ids.append(result.inserted_id)
    
    print(f"🏢 Inserted {len(groups_data)} groups")
    
    # Insert tasks
    task_ids = []
    for task_data in tasks_data:
        result = await db.tasks.insert_one(task_data)
        task_ids.append(result.inserted_id)
    
    print(f"📋 Inserted {len(tasks_data)} tasks")
    
    # Assign users to groups
    await db.users.update_one(
        {"_id": user_ids[0]}, {"$set": {"group_id": group_ids[0]}}
    )
    await db.users.update_one(
        {"_id": user_ids[1]}, {"$set": {"group_id": group_ids[0]}}
    )
    await db.users.update_one(
        {"_id": user_ids[2]}, {"$set": {"group_id": group_ids[1]}}
    )
    await db.users.update_one(
        {"_id": user_ids[3]}, {"$set": {"group_id": group_ids[1]}}
    )
    await db.users.update_one(
        {"_id": user_ids[4]}, {"$set": {"group_id": group_ids[2]}}
    )
    
    # Update group members
    await db.groups.update_one(
        {"_id": group_ids[0]}, {"$set": {"members": [user_ids[0], user_ids[1]]}}
    )
    await db.groups.update_one(
        {"_id": group_ids[1]}, {"$set": {"members": [user_ids[2], user_ids[3]]}}
    )
    await db.groups.update_one(
        {"_id": group_ids[2]}, {"$set": {"members": [user_ids[4]]}}
    )
    
    print("👥 Assigned users to groups")
    
    # Create some task completions
    completions = []
    for i in range(20):
        user_id = user_ids[i % len(user_ids)]
        task_id = task_ids[i % len(task_ids)]
        group_id = None
        
        # Find user's group
        user = await db.users.find_one({"_id": user_id})
        if user and "group_id" in user:
            group_id = user["group_id"]
        
        completion = {
            "task_id": task_id,
            "user_id": user_id,
            "group_id": group_id,
            "completed_at": datetime.utcnow() - timedelta(days=i),
            "points_earned": 10 + (i * 5)
        }
        completions.append(completion)
    
    if completions:
        await db.task_completions.insert_many(completions)
        print(f"✅ Inserted {len(completions)} task completions")
    
    # Update group total points
    for group_id in group_ids:
        pipeline = [
            {"$match": {"group_id": group_id}},
            {"$group": {"_id": None, "total": {"$sum": "$points_earned"}}}
        ]
        result = await db.task_completions.aggregate(pipeline).to_list(1)
        if result:
            total_points = result[0]["total"]
            await db.groups.update_one(
                {"_id": group_id}, {"$set": {"total_points": total_points}}
            )
    
    print("📊 Updated group total points")
    
    client.close()
    print("🎉 Database seeding completed!")


if __name__ == "__main__":
    asyncio.run(seed_database()) 