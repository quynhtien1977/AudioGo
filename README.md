# 🎧 AudioGo — Hệ thống Thuyết minh Du lịch Đa ngôn ngữ

> **Proof of Concept (PoC)** — Phố Ẩm Thực Vĩnh Khánh, TP.HCM  
> Tự động phát thuyết minh khi du khách di chuyển đến gần điểm tham quan (POI).

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com)
[![MAUI](https://img.shields.io/badge/Platform-.NET%20MAUI-blueviolet?logo=dotnet)](https://learn.microsoft.com/dotnet/maui)
[![ASP.NET Core](https://img.shields.io/badge/API-ASP.NET%20Core-blue?logo=dotnet)](https://learn.microsoft.com/aspnet/core)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📁 Cấu trúc Repository

```
AudioGo_Client.sln   ← Solution chứa cả 4 projects
│
├── mobile/          ← 📱 App di động (.NET MAUI — Android + iOS)
│   ├── Models/          # PoiEntity (SQLite local entity)
│   ├── ViewModels/      # BaseViewModel (MVVM / INotifyPropertyChanged)
│   ├── Views/           # XAML Pages (MapPage, PoiDetailPage, etc.)
│   ├── Services/        # GeofenceService, AudioService, LocationService, ApiService
│   ├── Helpers/         # GeoHelper (Haversine distance)
│   ├── Converters/      # XAML Value Converters
│   ├── Data/            # AppDatabase (SQLite async CRUD)
│   ├── Platforms/       # Android · iOS · MacCatalyst · Windows
│   └── Resources/       # Fonts · Images · Styles · Splash
│
├── api/             ← 🖥️ REST API Backend (ASP.NET Core)
│   ├── Controllers/     # AuthController, PoiController, CMS endpoints
│   ├── Models/          # Domain entities (Poi, Category, Tour, Account)
│   ├── Data/            # DbContext, migrations
│   ├── Repositories/    # Repository pattern (POI, Location, History)
│   ├── Services/        # Business logic
│   └── Program.cs       # Dependency injection + middleware
│
├── shared/          ← 📦 DTOs & Contracts dùng chung
│   ├── DTOs/            # AuthDto, PoiDetailDto, AnalyticsDto, etc.
│   └── Models/
│
├── web/             ← 🌐 CMS React (Vite + TanStack Query)
│   ├── src/
│   │   ├── api/         # API client hooks
│   │   ├── pages/       # LoginPage, DashboardPage, PoisPage, ToursPage
│   │   ├── components/  # shadcn/ui + custom UI
│   │   └── hooks/       # useAuth, useApi
│   └── package.json
│
├── database/        ← 🗄️ Schema & seed data
│   ├── schema/          # SQL Server tables definition
│   └── seed/            # POI data, categories, tours
│
└── docs/            ← 📚 Tài liệu
    └── architecture/    # architecture-review.md
```

---

## 🏗️ Kiến trúc tổng quan

```
┌──────────────────────────────────────────────────────────────────┐
│                  📱 MOBILE APP — .NET MAUI                        │
│                   (mobile/)                                      │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ GPS + Google │  │ GeofenceService │  │  AudioService        │ │
│  │ Maps         │→ │ (cooldown 5min) │→ │  • Azure TTS         │ │
│  │ + QR Scanner │  │ Priority Queue  │  │  • File playback     │ │
│  └──────────────┘  └─────────────────┘  └──────────────────────┘ │
│           [SQLite Offline Cache — sqlite-net-pcl]                │
└─────────────────────┬──────────────────────────────────────────┘
                      │ HTTPS REST
                      │ BaseAddress: http://10.0.2.2:5000 (dev)
                      │             https://api.audiogo.vn (prod)
┌─────────────────────▼──────────────────────────────────────────┐
│                   🖥️  API SERVER                                 │
│              ASP.NET Core 10 (api/)                             │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │ AuthController      │  │ PoiController, Analytics         │  │
│  │ CMS CRUD endpoints  │  │ + Haversine + Heatmap queries    │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│        ↓ EF Core 9                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SQL Server (AudioGo_Dev, AudioGo_Prod)                 │   │
│  │  • Poi, PoiContent, PoiGallery                           │   │
│  │  • Category, Tour, Account                              │   │
│  │  • ListenHistory, LocationLog (analytics)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│        ↓ Static Files / Azure Blob Storage                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  wwwroot/uploads/ →  Azure Blob (audiogo-audio, -images)│   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────────┘
                     │ JWT Bearer
┌────────────────────▼─────────────────────────────────────────┐
│              🌐 WEB CMS — React 19 (web/)                     │
│         Vite + TanStack Query + Shadcn/ui + Tailwind         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Pages: Login → Dashboard → POIs → Tours → Analytics      │ │
│  │ Maps: Leaflet heatmap (location & listen data)           │ │
│  │ Charts: Recharts (visitor trends, popular POIs)          │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Chức năng cốt lõi (PoC)

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| 📍 Geofencing | Phát hiện khi du khách vào vùng POI (bán kính tuỳ chỉnh) | 🔨 In progress |
| 🔇 Anti-spam | Debounce cooldown 5 phút per POI | ✅ Done |
| 🔢 Priority queue | POI ưu tiên cao được trigger trước khi overlap | ✅ Done |
| 🗣️ TTS narration | Phát thuyết minh qua Text-to-Speech | 🔜 Todo |
| 🎵 Audio file | Phát file audio thu sẵn | 🔜 Todo |
| 📴 Offline mode | Dữ liệu POI lưu SQLite local | 🔨 In progress |
| 🌐 Online sync | Đồng bộ từ Server qua REST API | 🔜 Phase 2 |
| 🗺️ Map view | Hiển thị vị trí + toàn bộ POI | 🔜 Todo |
| 📷 QR Code | Fallback thủ công cho GPS yếu | 🔜 Todo |
| 🌏 Đa ngôn ngữ | VI · EN · ZH · KO · JA | 🔜 Todo |

---

## ⚙️ Yêu cầu môi trường

| Công cụ | Phiên bản | Mục đích |
|---|---|---|
| .NET SDK | 10.0+ | Backend (api/) + Mobile (mobile/) |
| Visual Studio / VS Code | VS 2022 17.x+ | IDE |
| SQL Server | 2019+ hoặc LocalDB | Database |
| Node.js | 18+ | Web CMS (web/) |
| Android SDK | API 21+ | Android build |
| iOS | 15.0+ | iOS build (cần máy Mac) |

---

## 🛠️ Chạy dự án

### API Server
```bash
cd api
dotnet run
# API chạy tại: https://localhost:5000/api/...
# OpenAPI docs: https://localhost:5000/openapi/v1.json
```

### Mobile App (MAUI — Android Emulator)
```bash
cd mobile
dotnet build -t:Run -f net10.0-android
```

### Web CMS (React)
```bash
cd web
npm install
npm run dev
# CMS chạy tại: http://localhost:5173
```

---

## 📌 Branching strategy

```
main          ← Production-ready releases
develop       ← Integration branch (daily work)
feature/*     ← Feature branches (từ develop)
hotfix/*      ← Hotfix branches (từ main)
```

---

## 👥 Actors

- **Du khách** — tương tác qua **App Mobile**
- **Quản lý quán** — thao tác qua **nền tảng Web CMS** *(Phase 2)*
- **Admin** — quản trị hệ thống qua **nền tảng Web** *(Phase 2)*

---

## 📄 License

MIT © AudioGo Project Team
