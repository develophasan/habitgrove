# HabitGrove Backend

HabitGrove sürdürülebilirlik alışkanlık takip platformunun FastAPI backend'i.

## 🚀 Kurulum

### Gereksinimler
- Python 3.8+
- MongoDB Atlas hesabı

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Environment variables ayarlayın:**
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/habitgrove?retryWrites=true&w=majority
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

3. **Veritabanını doldurun:**
```bash
python seed.py
```

4. **Uygulamayı çalıştırın:**
```bash
uvicorn app.main:app --reload
```

Uygulama `http://localhost:8000` adresinde çalışacak.

## 📚 API Dokümantasyonu

API dokümantasyonuna `http://localhost:8000/docs` adresinden erişebilirsiniz.

## 🧪 Testler

Testleri çalıştırmak için:
```bash
pytest tests/
```

## 📁 Proje Yapısı

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI uygulaması
│   ├── config.py            # Konfigürasyon
│   ├── database.py          # MongoDB bağlantısı
│   ├── auth.py              # JWT authentication
│   ├── models/              # Pydantic modeller
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── group.py
│   │   ├── task.py
│   │   └── task_completion.py
│   └── routers/             # API endpoint'leri
│       ├── __init__.py
│       ├── auth.py
│       ├── users.py
│       ├── tasks.py
│       └── groups.py
├── tests/                   # Test dosyaları
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_tasks.py
├── requirements.txt         # Python bağımlılıkları
├── env.example             # Environment variables örneği
├── seed.py                 # Veritabanı seed script'i
└── README.md
```

## 🔐 Authentication

API JWT token tabanlı authentication kullanır. Token'ı almak için:

1. `/auth/register` endpoint'i ile kayıt olun
2. `/auth/login` endpoint'i ile giriş yapın
3. Dönen token'ı `Authorization: Bearer <token>` header'ında kullanın

## 📊 Veritabanı Modelleri

### Users
- Kullanıcı bilgileri ve puanları
- Grup üyeliği

### Groups
- Üniversite, belediye, NGO, şirket grupları
- Toplam puanlar ve üyeler

### Tasks
- Günlük, haftalık, aylık, yıllık görevler
- Kategoriler: recycling, water, energy, transport, consumption
- Zorluk seviyeleri: easy, medium, hard

### Task Completions
- Kullanıcıların tamamladığı görevler
- Puan kazanma kayıtları

## 🌱 Seed Data

Seed script'i şunları oluşturur:
- 5 test kullanıcısı (şifre: password123)
- 3 grup (Gaziantep Üniversitesi, Şahinbey Belediyesi, Ekoloji Derneği)
- 27 görev (10 günlük, 10 haftalık, 5 aylık, 2 yıllık)
- 20 görev tamamlama kaydı 