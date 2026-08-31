# 🎧 AudioGo — Hệ thống Thuyết minh Du lịch Thông minh

<div align="center">

**Nền tảng hướng dẫn âm thanh tự động theo vị trí** — Du khách tự động nghe thuyết minh khi tiến đến gần điểm tham quan (POI) mà không cần thao tác thủ công.

[![Website](https://img.shields.io/badge/🌐%20Website-audiogo.tranminhmed.vn-0070f3?style=for-the-badge)](https://audiogo.tranminhmed.vn)
[![Vercel Deploy](https://img.shields.io/badge/CMS-Deployed%20on%20Vercel-black?style=for-the-badge&logo=vercel)](https://audiogo-cms.vercel.app)

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![MAUI](https://img.shields.io/badge/.NET%20MAUI-Android-blueviolet?logo=android&logoColor=white)](https://learn.microsoft.com/dotnet/maui)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-10-blue?logo=dotnet)](https://learn.microsoft.com/aspnet/core)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Azure](https://img.shields.io/badge/Azure-SQL%20%7C%20Blob%20%7C%20TTS-0078D4?logo=microsoftazure)](https://azure.microsoft.com)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)

</div>

---

## 📋 Mục lục

- [Cấu trúc Repository](#-cấu-trúc-repository)
- [Kiến trúc tổng quan](#-kiến-trúc-tổng-quan)
- [Tính năng](#-tính-năng-đã-hoàn-thành)
  - [Mobile App](#-mobile-app-tourist)
  - [Web CMS](#-web-cms)
  - [Backend Services](#️-backend-services)
- [Hệ thống Role](#-hệ-thống-role)
- [Gói Subscription](#-gói-subscription-owner)
- [Tech Stack](#️-tech-stack-chi-tiết)
- [Hạ tầng & Deployment](#-hạ-tầng--deployment)
- [Chạy dự án](#️-chạy-dự-án)
- [Branching Strategy](#-branching-strategy)
- [Contributing](CONTRIBUTING.md)
- [License](#-license)

---

## 📁 Cấu trúc Repository

```
AudioGo_Client.sln
│
├── mobile/          ← 📱 App di động (.NET MAUI — Android / iOS)
│   ├── Views/           # XAML Pages: Splash, Welcome, QR Scan, Main, Map, POI, Tour, Search, Settings, Payment…
│   ├── ViewModels/      # MVVM — Main, Map, POI, Tour, Search, Settings, Payment VMs
│   ├── Services/        # ApiService, SyncService, GeofenceService, AudioService,
│   │                    #   LocationService, SignalRService, TourSessionManager
│   ├── Data/            # AppDatabase (SQLite async via sqlite-net-pcl)
│   ├── Models/          # Local SQLite entities (PoiEntity, etc.)
│   ├── Helpers/         # GeoHelper, LanguageHelper, AppStrings (i18n)
│   ├── Converters/      # XAML Value Converters
│   ├── Platforms/       # Android / iOS platform-specific code
│   └── Resources/       # Fonts, Images, Styles, Splash screen
│
├── api/             ← 🖥️ REST API Backend (ASP.NET Core 10)
│   ├── Controllers/
│   │   ├── AuthController.cs          # CMS login / JWT
│   │   ├── LandingController.cs       # Public landing page data
│   │   ├── Cms/                       # 23 CMS endpoints (Admin, Owner, Editor)
│   │   ├── Mobile/                    # 9 Mobile endpoints (Tourist auth, POI, Tour…)
│   │   └── Payment/                   # Webhook: SePay, MoMo
│   ├── Models/          # 22 domain entities
│   ├── Data/            # EF Core DbContext, migrations
│   ├── Repositories/    # Repository pattern
│   ├── Services/        # 27 business-logic services
│   ├── Hubs/            # SignalR DeviceHub (real-time location)
│   └── Program.cs       # DI container + middleware pipeline
│
├── shared/          ← 📦 DTOs & Contracts dùng chung (api ↔ mobile)
│   └── DTOs/            # AuthDto, PoiDetailDto, TourDto, NotificationDto…
│
├── web/             ← 🌐 CMS Web App (React 19 + Vite)
│   └── src/
│       ├── pages/       # 34 trang CMS
│       ├── components/  # Shadcn/ui + custom components
│       ├── api/         # Axios API client, subscriptionApi, notificationApi…
│       └── hooks/       # useAuth, useNotifications, useSubscription…
│
└── database/        ← 🗄️ SQL Server schema & seed data
```

---

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│              📱 MOBILE APP — .NET MAUI (Android / iOS)          │
│                                                                  │
│  SplashPage → WelcomePage → QR Scan / Online Payment → AppShell │
│                                                                  │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ GPS +      │  │ GeofenceService  │  │ AudioService        │  │
│  │ GoogleMaps │→ │ (Haversine +     │→ │ • Azure TTS stream  │  │
│  │ + QR Scan  │  │  cooldown 5min,  │  │ • Local audio file  │  │
│  └────────────┘  │  priority queue) │  │ • MediaElement      │  │
│                  └──────────────────┘  └─────────────────────┘  │
│  SyncService: Full-sync lần đầu + Delta-sync mỗi 5 phút        │
│  SQLite local cache (offline-first)                             │
│  SignalRService: WebSocket location push → DeviceHub            │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS REST + SignalR WebSocket
┌────────────────────▼────────────────────────────────────────────┐
│                 🖥️  API SERVER — ASP.NET Core 10                 │
│                                                                  │
│  JWT Auth │ CMS endpoints │ Mobile endpoints │ Webhooks         │
│  SendGrid Email │ Azure Blob Storage │ Azure TTS                │
│  ContentPipeline: Auto-translate (5 lang) + Auto-TTS on save    │
│                                                                  │
│  SQL Server: Poi, Tour, Account, SubscriptionPlan,              │
│  OwnerSubscription, PaymentTransaction, Notification,           │
│  Banner, Article, ListenHistory, LocationLog, …                 │
│                                                                  │
│  SignalR DeviceHub: real-time device location tracking          │
│  DataRetentionService: auto-purge logs (configurable TTL)       │
└────────────────────┬────────────────────────────────────────────┘
                     │ JWT Bearer + REST
┌────────────────────▼────────────────────────────────────────────┐
│           🌐 WEB CMS — React 19 + Vite + TanStack Query         │
│                                                                  │
│  Admin / Owner / Editor role-based dashboards                   │
│  Shadcn/ui + Tailwind CSS + Recharts + Leaflet                  │
│  Real-time notification bell (polling 30s)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Tính năng đã hoàn thành

### 📱 Mobile App (Tourist)

| Tính năng | Chi tiết |
|---|---|
| **Splash & Session** | Animated splash (5 phase); tự động check JWT hợp lệ → route WelcomePage hoặc vào thẳng AppShell |
| **QR Login** | Scan QR kiosk → JWT Tourist; hỗ trợ camera live scan và chọn ảnh thư viện |
| **Online Payment** | SePay VietQR — khởi tạo giao dịch, poll 5s, auto-navigate vào app khi thành công |
| **Geofencing** | Haversine distance realtime; cooldown 5 phút per POI; priority queue khi nhiều POI overlap |
| **Auto Audio** | Azure TTS stream hoặc file audio thu sẵn; MediaElement cross-platform; interrupt khi chuyển POI |
| **Tour Mode** | Nghe tour step-by-step; TourSessionManager theo dõi tiến độ; điều hướng Google Maps |
| **POI Detail** | Gallery fullscreen swipe, audio player inline, nội dung đa ngôn ngữ |
| **Search** | Tìm POI theo tên/mô tả; live update khi SyncService nhận delta |
| **Map** | Google Maps với custom pin; hiển thị vị trí thực; list POI filter |
| **Offline-first** | Full-sync lần đầu → SQLite; Delta-sync mỗi 5 phút; retry khi wifi trở lại |
| **SignalR** | Push GPS location lên DeviceHub real-time khi đang dùng app |
| **Đa ngôn ngữ** | VI · EN · ZH · KO · JA — AppStrings JSON; nhận từ server, fallback local |
| **Dark / Light Theme** | Chuyển cảnh có animation; lưu preference |
| **Settings** | Đổi ngôn ngữ, nguồn tải (WiFi-only/cellular), thông tin phiên bản |
| **Articles (Tin tức)** | Danh sách + chi tiết bài viết; ảnh lazy load |
| **System Alert** | Popup cảnh báo hệ thống 1 lần per alert khi khởi động (từ Admin broadcast) |

---

### 🌐 Web CMS

#### Dashboard & Auth
| Trang | Mô tả |
|---|---|
| **Login** | JWT auth; remember session |
| **Forgot / Reset Password** | Gửi link qua SendGrid; token có hạn |
| **Dashboard** | KPI cards (POI, Tour, lượt nghe, thiết bị); biểu đồ lượt nghe/ngày (Recharts); heatmap địa lý (Leaflet) |
| **Profile** | Đổi thông tin, ảnh đại diện, đổi mật khẩu; hiển thị màu badge gói subscription |

#### POI Management
| Trang | Mô tả |
|---|---|
| **POI List (POIPage)** | Danh sách POI: filter, sort, phân trang; badge plan/priority; tìm kiếm |
| **Add POI** | Form tạo mới: geocoding tự động, upload ảnh & audio per ngôn ngữ |
| **POI Detail / Update** | Chỉnh sửa đầy đủ: nội dung đa ngôn ngữ, gallery, audio, bán kính, priority |
| **POI Gallery** | Quản lý ảnh per POI |
| **POI Audio** | Upload / preview audio per ngôn ngữ |
| **POI New Queue** | Editor duyệt POI mới trước khi publish |
| **POI Update Queue** | Editor duyệt cập nhật POI |
| **POI Deletion Queue** | Duyệt/từ chối yêu cầu xóa POI |
| **POI Management Hub** | Tổng hợp 3 queue trên cho Owner/Admin |
| **Content Pipeline** | Trigger auto-translate (Google Translate) + auto-TTS (Azure Cognitive) per POI |

#### Tour Management
| Trang | Mô tả |
|---|---|
| **Tours List** | CRUD tours; xem số POI trong tour |
| **Create / Edit Tour** | Tên, mô tả, ảnh cover, danh sách POI drag & drop order |
| **Tour Detail** | Preview đầy đủ nội dung tour |

#### Analytics
| Trang | Mô tả |
|---|---|
| **Analytics** | Lượt nghe theo POI/ngày; top POI phổ biến; filter theo khoảng thời gian |
| **Device Tracking** | Bản đồ vị trí thiết bị realtime; xem lịch sử di chuyển |
| **Device Activity** | Log tương tác chi tiết theo thiết bị |

#### Subscription & Billing
| Trang | Mô tả |
|---|---|
| **Admin Subscription Dashboard** | Xem toàn bộ subscriptions; assign/revoke plan cho Owner; Crown icon quick action |
| **Admin Transaction Dashboard** | Lịch sử thanh toán; filter theo trạng thái |
| **Subscription Checkout** | Owner tự mua/gia hạn; VietQR display; poll thanh toán; countdown |

#### Notification & Broadcast
| Trang | Mô tả |
|---|---|
| **Broadcast Page** | Gửi thông báo tới: Admin / Owner / Editor / Cảnh báo hệ thống (App Alert) |
| **Bell Icon (Topbar)** | Badge đếm chưa đọc (poll 30s); dropdown danh sách; mark as read |
| **System Alert → Mobile** | Broadcast target "Public" → popup 1 lần trên app khi mở |

#### Content & Marketing
| Trang | Mô tả |
|---|---|
| **Articles** | CRUD bài viết; ảnh cover; publish/unpublish; xem trước |
| **Banners** | Landing Page / Mobile Home / Both; StartDate–EndDate schedule; sort order; i18n title/subtitle |
| **Categories** | CRUD danh mục POI với icon |
| **Landing Settings** | Chỉnh hero, sections, banners của trang Landing Page |

#### Administration (Admin only)
| Trang | Mô tả |
|---|---|
| **Accounts** | CRUD Admin/Owner/Editor; lock/unlock; assign gói subscription; xem subscription hiện tại |
| **Access Codes** | Tạo & quản lý mã QR Tourist; cấu hình thời hạn |
| **App Settings** | Tham số hệ thống (cooldown, max devices, …) |
| **App Release** | Quản lý phiên bản mobile; force-update flag; changelog |

---

### 🖥️ Backend Services

| Service | Chức năng |
|---|---|
| **ContentPipelineService** | Auto-translate 5 ngôn ngữ (Google Translate) + auto-TTS (Azure TTS) khi lưu POI content |
| **SubscriptionService** | Activate/expire/renew subscription; enforce POI limit; assign plan logic |
| **PaymentWebhookService** | Xử lý SePay/MoMo webhook; verify; activate subscription sau thanh toán thành công |
| **NotificationService** | Gửi/đọc thông báo per role; broadcast; public alert endpoint cho mobile |
| **BannerService** | CRUD banner; filter theo ngày & platform target |
| **BlobStorageService** | Upload/xóa audio và ảnh lên Azure Blob Storage |
| **SendGridEmailService** | Email reset password & thông báo hệ thống |
| **TtsService** | Azure Cognitive Services TTS → MP3 |
| **TranslationService** | Google Translate API (VI→EN/ZH/KO/JA) |
| **AnalyticsService** | Tổng hợp ListenHistory + LocationLog → KPI, charts |
| **DataRetentionService** | Background job xóa log cũ theo TTL |
| **PaymentCleanupService** | Hủy transaction quá hạn (15 phút) |
| **PoiLimitEnforcementService** | Block POI mới khi vượt giới hạn gói |
| **PoiRequestService** | Workflow: pending → editor review → approved/rejected |
| **AccessCodeService** | Tạo, validate, thu hồi mã QR Tourist |
| **LandingService** | Nội dung Landing Page động |
| **AppReleaseService** | Force-update check; changelog |
| **DevicePresenceService** | Online/offline tracking qua SignalR |

---

## 👥 Hệ thống Role

| Role | Quyền hạn |
|---|---|
| **Admin** | Toàn quyền: tài khoản, gói cước, thống kê hệ thống, broadcast tất cả |
| **Owner** | POI/Tour của mình; mua subscription; analytics |
| **Editor** | Duyệt POI request của Owner được giao; tạo article, banner |
| **Tourist** | QR scan hoặc thanh toán → JWT tạm → dùng mobile app |

---

## 💳 Gói Subscription (Owner)

| Gói | Max POI | Auto Priority |
|---|---|---|
| **Basic** | 3 POI | LOW (1) |
| **Professional** | 10 POI | MEDIUM (2) |
| **Enterprise** | Không giới hạn | HIGH (3) |

Thanh toán: **SePay** (VietQR real-time webhook) hoặc Admin assign thủ công.

---

## 🌐 Landing Page (Public)

- Hero section, tính năng, banners sự kiện, CTA đăng ký
- Nội dung quản lý hoàn toàn qua CMS (Landing Settings)
- Form tư vấn gói (ConsultationRequest → email)

---

## 🛠️ Tech Stack chi tiết

### Backend (api/)

| Lớp | Công nghệ |
|---|---|
| **Framework** | ASP.NET Core 10 — Minimal API + MVC Controllers |
| **ORM** | Entity Framework Core 9 (Code-First, Migrations) |
| **Database** | SQL Server (Azure SQL Database — production) |
| **Auth** | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| **Realtime** | ASP.NET Core SignalR — `DeviceHub` push location |
| **Message Queue** | **RabbitMQ 3.13** (`RabbitMQ.Client 6.8`) — async task offloading; chạy via Docker Compose |
| **Azure TTS** | **Microsoft.CognitiveServices.Speech 1.42** — Neural voices: vi-VN, en-US, ja-JP, ko-KR, zh-CN, fr-FR, th-TH |
| **Azure Blob** | **Azure.Storage.Blobs 12.24** — lưu audio MP3 và ảnh POI/gallery |
| **Translation** | **Azure AI Translator** (REST v3) — fallback khi không có LLM key |
| **LLM Translation** | **Cerebras API** (Qwen-3-235B-A22B) — primary translator; hỗ trợ custom `LLM_BASE_URL` |
| **Email** | **SendGrid v3 REST API** — account creation, password reset |
| **QR Code** | **QRCoder 1.8** — sinh QR PNG cho Access Code Tourist |
| **Password Hash** | BCrypt.Net-Next 4.0 |
| **Env Config** | DotNetEnv 3.1 — load `.env` file khi dev local |
| **OpenAPI** | `Microsoft.AspNetCore.OpenApi` — `/openapi/v1.json` |

### Mobile (mobile/)

| Lớp | Công nghệ |
|---|---|
| **Framework** | .NET MAUI 10 — Android (API 24+) |
| **MVVM** | CommunityToolkit.Mvvm 8.2 (`ObservableProperty`, `RelayCommand`) |
| **Database** | SQLite (`sqlite-net-pcl 1.9`) — offline cache |
| **QR Scanner** | BarcodeScanner.Mobile.Maui 9.0 + ZXing.Net 0.16 |
| **Audio** | Plugin.Maui.Audio 4.0 — phát file MP3 local |
| **Maps** | Microsoft.Maui.Controls.Maps + Google Maps SDK |
| **SignalR Client** | Microsoft.AspNetCore.SignalR.Client 8.0 |
| **HTTP** | `IHttpClientFactory` + `Microsoft.Extensions.Http` |
| **UI Extras** | CommunityToolkit.Maui 9.0 — Popup, Snackbar |
| **Serialization** | System.Text.Json + Newtonsoft.Json 13.0 |

### Web CMS (web/)

| Lớp | Công nghệ |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router DOM 7 |
| **Data Fetching** | TanStack Query (React Query) 5 |
| **HTTP Client** | Axios 1.x |
| **UI Components** | Shadcn/ui + Radix UI primitives |
| **Styling** | Tailwind CSS 3 + tw-animate-css |
| **Animation** | Framer Motion 12 |
| **Charts** | Recharts 3 |
| **Maps / Heatmap** | Leaflet + react-leaflet + leaflet.heat |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **SignalR Client** | @microsoft/signalr 8.0 |
| **QR Render** | qrcode.react 4.x |
| **Analytics** | **@vercel/analytics** + **@vercel/speed-insights** — page views & Web Vitals |
| **Icons** | Lucide React |
| **Fonts** | Geist Variable (`@fontsource-variable/geist`) |
| **Toast** | react-hot-toast |
| **Build Tool** | Vite 8 + rollup-plugin-visualizer (bundle analysis) |

---

## 🚀 Hạ tầng & Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                 📦 PRODUCTION INFRASTRUCTURE                     │
│                                                                  │
│  🌐 Web CMS  ──────→  Vercel (auto-deploy on push to main)      │
│                        URL: audiogo-cms.vercel.app              │
│                        Analytics: Vercel Analytics + Speed      │
│                        Insights (Web Vitals tracking)           │
│                                                                  │
│  🖥️  API Server ────→  Docker Container                         │
│                        Image: audiogo-api:latest                │
│                        Compose: api + rabbitmq services         │
│                        (Railway / Render / self-hosted VPS)     │
│                                                                  │
│  🐰 RabbitMQ ──────→  Docker Container (rabbitmq:3.13-mgmt)    │
│                        Port 5672 (AMQP) + 15672 (Management UI) │
│                        Persistent volume: rabbitmq_data         │
│                                                                  │
│  🗄️  Database ──────→  Azure SQL Database                       │
│                        Server: audiogo-db-server.database.windows│
│                        Tier: serverless / provisioned           │
│                                                                  │
│  📁 File Storage ──→  Azure Blob Storage                        │
│                        Container: audiogo-audio (MP3 files)     │
│                        Container: audiogo-images (gallery, cover)│
│                                                                  │
│  📱 Mobile App ────→  GitHub Actions CD                         │
│                        Trigger: git tag v*.*.* push             │
│                        Sign: Android Keystore (GitHub Secret)   │
│                        Output: Signed APK → GitHub Release      │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipelines (GitHub Actions)

| Workflow | Trigger | Mô tả |
|---|---|---|
| **CI — Backend** (`ci.yml`) | push/PR to `main`, `develop` | Build API Release + chạy unit tests với Coverlet code coverage |
| **CD — Android APK** (`release-apk.yml`) | push tag `v*.*.*` | Build + sign APK (Windows runner, MAUI workload) → upload artifact + tạo GitHub Release tự động |

### Biến môi trường cần cấu hình (Production)

| Key | Mô tả |
|---|---|
| `AZURE_SQL_CONNECTION` | Azure SQL Server connection string |
| `Azure:Speech:Key` + `Region` | Azure Cognitive Services — TTS |
| `Azure:Storage:ConnectionString` | Azure Blob Storage |
| `Azure:Translator:Key` + `Region` | Azure AI Translator |
| `LLM_API_KEY` + `LLM_MODEL` | Cerebras API (Qwen-3 translation) |
| `LLM_BASE_URL` | Custom LLM endpoint (optional override) |
| `EmailSettings:SendGridApiKey` | SendGrid email delivery |
| `Jwt__Key` + `Jwt__Issuer` | JWT signing secret |
| `RabbitMQ__Url` | AMQP connection (e.g. `amqp://guest:guest@rabbitmq:5672`) |
| `SePay__SecretKey` | SePay webhook verification |
| `PUBLIC_WEBHOOK_URL` | Public-facing API URL (for payment callbacks) |
| `CORS_ORIGIN_0/1` | Allowed CORS origins (Vercel URL, local) |

---

## ⚙️ Yêu cầu môi trường

| Công cụ | Phiên bản |
|---|---|
| .NET SDK | 10.0+ |
| Node.js | 18+ |
| Docker + Docker Compose | 24+ |
| SQL Server | 2019+ / LocalDB / Azure SQL |
| Android SDK | API 24+ (Android 7.0+) |
| iOS | 15.0+ (cần máy Mac để build) |

---

## 🛠️ Chạy dự án

### API Server
```bash
cd api
# Cấu hình appsettings.Development.json
dotnet ef database update
dotnet run
# API: https://localhost:5000
# OpenAPI: https://localhost:5000/openapi/v1.json
```

### Web CMS
```bash
cd web
npm install
# .env: VITE_API_URL=https://localhost:5000
npm run dev
# http://localhost:5173
```

### Mobile (Android Emulator)
```bash
cd mobile
# Config/EndpointConfig.cs: BaseUrl = http://10.0.2.2:5000
dotnet build -t:Run -f net10.0-android
```

---

## 📌 Branching Strategy

```
main        ← Production releases
develop     ← Integration branch
feature/*   ← Feature branches (từ develop)
hotfix/*    ← Hotfix (từ main)
```



---

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy trình chi tiết.

**Quick start:**
```bash
git checkout develop && git pull
git checkout -b feature/ten-tinh-nang
# ... code ...
git push origin feature/ten-tinh-nang
# → tạo Pull Request vào develop
```

**Báo lỗi:** [Tạo Bug Report](../../issues/new?template=bug_report.md)  
**Đề xuất tính năng:** [Tạo Feature Request](../../issues/new?template=feature_request.md)

---

## 📄 License

[MIT](LICENSE) © 2026 AudioGo Project Team

---

<div align="center">

Made with ❤️ in Vietnam 🇻🇳

[Website](https://audiogo.tranminhmed.vn) · [CMS](https://audiogo-cms.vercel.app) · [Issues](../../issues)

</div>
