# VLAECCI - Hair Care Brand Mini SaaS

Dermatoloq təsdiqli saç baxım məhsulları üçün modern mini SaaS veb saytı. Saç dökülməsi, zəif saç və yavaş böyümə problemi yaşayan qadınlar üçün.

## Xüsusiyyətlər

- **Landing Page** – Hero, nəticələr, üstünlüklər, şəxsi məsləhətlər, Instagram bölməsi
- **Məhsul Sistemi** – Kateqoriyalar, məhsul səhifələri, admin CRUD
- **Saç Diagnostika Quiz** – Suallara cavab verin, məhsul tövsiyələri alın
- **Konsultasiya** – Müraciət formu, əlaqə məlumatları
- **Admin Panel** – Giriş, məhsullar, konsultasiyalar, quiz cavabları, endirim kodları
- **WhatsApp** – Əlaqə düyməsi
- **Endirim kodları** – Admin yaradır, müştərilər tətbiq edə bilər

## Texnologiyalar

- **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend:** NestJS
- **Database:** PostgreSQL (TypeORM)
- **Auth:** JWT (jose) + cookies

## Quraşdırma

### Tələblər

- Node.js 18+
- npm və ya yarn

### Addımlar

1. **Dependency-ləri yükləyin:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Environment faylını yaradın:**
   ```bash
   cp .env.example .env
   ```
   `.env` faylında `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL` və `API_URL_INTERNAL` dəyərlərini yoxlayın.

3. **Veritabanını hazırlayın:**
   ```bash
   npm run db:seed
   ```

4. **Backend-i işə salın:**
   ```bash
   npm run backend:dev
   ```

5. **Frontend-i işə salın:**
   ```bash
   npm run dev
   ```

6. Brauzerdə açın: [](http://localhost:3000)

### Admin girişi (seed sonrası)

- **URL:** `/admin`
- **Email:** admin@vlaecci.com
- **Parol:** admin123

> ⚠️ İlk dəfə deploy edərkən mütləq parolu dəyişin.

### Səhifələr

| URL | Təsvir |
|-----|--------|
| `/` | Ana səhifə (landing) |
| `/mehsullar` | Məhsul siyahısı |
| `/mehsullar/[slug]` | Məhsul səhifəsi |
| `/quiz` | Saç diagnostika quiz |
| `/konsultasiya` | Konsultasiya formu |
| `/admin` | Admin panel (giriş tələb olunur) |

## Layihə strukturu

```
vlaecci/
├── src/
│   ├── app/
│   │   ├── admin/       # Admin panel
│   │   ├── mehsullar/   # Products & detail
│   │   ├── quiz/        # Hair diagnosis quiz
│   │   ├── konsultasiya/
│   │   └── page.tsx     # Landing
│   ├── components/
│   └── lib/             # api helper, auth, middleware
├── backend/
│   └── src/             # NestJS controllers, auth, admin, products, TypeORM entities
└── package.json
```

## Environment dəyişənləri

| Dəyişən | Təsvir |
|---------|--------|
| `POSTGRES_DB` | PostgreSQL database adı |
| `POSTGRES_HOST` | PostgreSQL host |
| `POSTGRES_PORT` | PostgreSQL port |
| `POSTGRES_USER` | PostgreSQL istifadəçi adı |
| `POSTGRES_PASSWORD` | PostgreSQL şifrəsi |
| `JWT_SECRET` | Admin session üçün gizli açar |
| `NEXT_PUBLIC_API_URL` | Frontend-dən Nest API ünvanı (`http://localhost:4000`) |
| `API_URL_INTERNAL` | Server-side fetch üçün Nest API ünvanı |
| `FRONTEND_URL` | NestJS CORS üçün frontend ünvanı |
| `BACKEND_PUBLIC_URL` | Upload edilmiş şəkillər üçün backend public base URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp əlaqə nömrəsi (+994...) |
| `NEXT_PUBLIC_INSTAGRAM_USERNAME` | Instagram istifadəçi adı |

## Production

1. PostgreSQL bağlantısını verin:
   ```
   POSTGRES_DB="vlaecci"
   POSTGRES_HOST="localhost"
   POSTGRES_PORT="5432"
   POSTGRES_USER="postgres"
   POSTGRES_PASSWORD="your-password"
   ```

2. Cədvəlləri yaratmaq üçün `TYPEORM_SYNC="true"` ilə backend-i işə salın və sonra seed edin:
   ```bash
   npm run backend:dev
   npm run db:seed
   ```

3. Build:
   ```bash
   npm run backend:build
   npm run build
   npm run backend:start
   npm start
   ```

4. Parolu dəyişin və `JWT_SECRET`-i güclü təsadüfi sətrlə əvəz edin.

## Dil

Əsas dil: **Azərbaycan dili**. İngiliscə dəstək üçün `locale` və çeviri faylları əlavə edilə bilər.

---

© VLAECCI – Dermatoloq təsdiqli saç baxımı
