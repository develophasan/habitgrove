# 🌿 HabitGrove - Sustainability Habit Tracking Platform

HabitGrove, kullanıcıların sürdürülebilir alışkanlıklarını takip etmelerini ve gruplar halinde çevresel etki yaratmalarını sağlayan bir platformdur.

## 🚀 Özellikler

- **Görev Takibi**: Günlük, haftalık, aylık ve yıllık sürdürülebilirlik görevleri
- **Grup Sistemi**: Üniversite, belediye, NGO ve şirket grupları
- **Puan Sistemi**: Görev tamamlama ile puan kazanma
- **Responsive Tasarım**: Mobil ve web uyumlu arayüz
- **JWT Authentication**: Güvenli kullanıcı kimlik doğrulama

## 🛠️ Teknoloji Stack

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL veritabanı
- **Motor** - Async MongoDB driver
- **JWT** - Token tabanlı kimlik doğrulama
- **Pydantic** - Veri doğrulama
- **Pytest** - Test framework

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **React Hook Form** - Form yönetimi
- **Axios** - HTTP client
- **Lucide React** - İkonlar

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- Python 3.8+
- MongoDB Atlas hesabı

### Backend Kurulumu

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

4. **Backend'i çalıştırın:**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Kurulumu

1. **Bağımlılıkları yükleyin:**
```bash
cd frontend
npm install
```

2. **Frontend'i çalıştırın:**
```bash
npm run dev
```

## 🌐 Erişim

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Dokümantasyonu**: http://localhost:8000/docs

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

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Giriş yapma
- `GET /auth/me` - Kullanıcı bilgileri

### Users
- `GET /users/{id}` - Kullanıcı profili
- `PATCH /users/{id}` - Kullanıcı güncelleme

### Tasks
- `GET /tasks/` - Görev listesi (filtreleme ile)
- `GET /tasks/{id}` - Görev detayı
- `POST /tasks/` - Yeni görev oluşturma
- `POST /tasks/complete` - Görev tamamlama
- `GET /tasks/user/{user_id}` - Kullanıcının tamamladığı görevler
- `GET /tasks/group/{group_id}` - Grubun tamamladığı görevler

### Groups
- `POST /groups/` - Grup oluşturma
- `GET /groups/{id}` - Grup detayı
- `POST /groups/join` - Gruba katılma

## 🧪 Test

### Backend Testleri
```bash
cd backend
pytest tests/
```

## 🌱 Seed Data

Seed script'i şunları oluşturur:
- 5 test kullanıcısı (şifre: password123)
- 3 grup (Gaziantep Üniversitesi, Şahinbey Belediyesi, Ekoloji Derneği)
- 27 görev (10 günlük, 10 haftalık, 5 aylık, 2 yıllık)
- 20 görev tamamlama kaydı

## 📱 Responsive Tasarım

Frontend tamamen responsive olarak tasarlanmıştır:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🚀 Deployment

### Backend (Render/Railway)
1. GitHub repository'yi bağlayın
2. Environment variables'ları ayarlayın
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. GitHub repository'yi bağlayın
2. Build command: `npm run build`
3. Output directory: `.next`

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Geliştirici

HabitGrove sürdürülebilirlik platformu - Çevresel etki yaratmak için tasarlandı. 