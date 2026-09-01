# 🎧 AudioGo — Smart Location-Based Audio Tourism System

<div align="center">

<p align="center">
  <a href="./README.md"><b>English</b></a> |
  <a href="./README.vi.md"><b>Tiếng Việt</b></a> |
  <a href="./README.zh-CN.md"><b>简体中文</b></a>
</p>

**Automated location-based audio guide platform** — Tourists automatically hear rich audio narrations when approaching points of interest (POIs) without manual interaction.

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

## 📋 Table of Contents

- [Repository Structure](#-repository-structure)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [Mobile App (Tourist)](#-mobile-app-tourist)
  - [Web CMS](#-web-cms)
  - [Backend Services](#️-backend-services)
- [Role-Based Access Control](#-role-based-access-control)
- [Owner Subscription Plans](#-owner-subscription-plans)
- [Detailed Tech Stack](#️-detailed-tech-stack)
- [Infrastructure & Deployment](#-infrastructure--deployment)
- [Getting Started](#️-getting-started)
- [Branching Strategy](#-branching-strategy)
- [Contributing](CONTRIBUTING.md)
- [License](#-license)

---

## 📁 Repository Structure

```
AudioGo_Client.sln
│
├── mobile/          ← 📱 Mobile App (.NET MAUI — Android / iOS)
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
│   │   ├── AuthController.cs          # CMS login / JWT authentication
│   │   ├── LandingController.cs       # Public landing page content & settings
│   │   ├── Cms/                       # 23 CMS endpoints (Admin, Owner, Editor)
│   │   ├── Mobile/                    # 9 Mobile endpoints (Tourist auth, POI, Tour…)
│   │   └── Payment/                   # Webhooks: SePay, MoMo
│   ├── Models/          # 22 domain entities
│   ├── Data/            # EF Core DbContext, migrations
│   ├── Repositories/    # Repository design pattern
│   ├── Services/        # 27 business-logic services
│   ├── Hubs/            # SignalR DeviceHub (real-time device location tracking)
│   └── Program.cs       # DI container + middleware pipeline
│
├── shared/          ← 📦 Shared DTOs & Contracts (api ↔ mobile)
│   └── DTOs/            # AuthDto, PoiDetailDto, TourDto, NotificationDto…
│
├── web/             ← 🌐 Web CMS & Landing Page (React 19 + Vite + Tailwind CSS)
│   └── src/
│       ├── pages/       # 34 CMS & landing pages
│       ├── components/  # Modern UI components
│       ├── api/         # Axios API client, subscriptionApi, notificationApi…
│       └── hooks/       # useAuth, useNotifications, useSubscription…
│
└── database/        ← 🗄️ SQL Server schema & seed scripts
```

---

## 🏗️ System Architecture

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
│  SyncService: Initial full-sync + Delta-sync every 5 mins       │
│  SQLite local cache (offline-first architecture)                │
│  SignalRService: Real-time WebSocket location push → DeviceHub  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS REST + SignalR WebSocket
┌────────────────────▼────────────────────────────────────────────┐
│                 🖥️  API SERVER — ASP.NET Core 10                 │
│                                                                  │
│  JWT Auth │ CMS endpoints │ Mobile endpoints │ Webhooks         │
│  SendGrid Email │ Azure Blob Storage │ Azure Cognitive TTS      │
│  ContentPipeline: Auto-translate (5 langs) + Auto-TTS on save   │
│                                                                  │
│  SQL Server: Poi, Tour, Account, SubscriptionPlan,              │
│  OwnerSubscription, PaymentTransaction, Notification,           │
│  Banner, Article, ListenHistory, LocationLog, …                 │
│                                                                  │
│  SignalR DeviceHub: Real-time device location tracking          │
│  DataRetentionService: Auto-purge telemetry (configurable TTL)  │
└────────────────────┬────────────────────────────────────────────┘
                     │ JWT Bearer + REST
┌────────────────────▼────────────────────────────────────────────┐
│           🌐 WEB CMS — React 19 + Vite + TanStack Query         │
│                                                                  │
│  Admin / Owner / Editor role-based dashboards                   │
│  Tailwind CSS + Recharts + Leaflet Map visualizer               │
│  Real-time notification bell & multi-language editor            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Key Features

### 📱 Mobile App (Tourist)

| Feature | Description |
|---|---|
| **Splash & Session** | 5-phase animated splash screen; validates JWT and seamlessly routes to WelcomePage or AppShell |
| **QR Code Login** | Scan kiosk QR code to generate instant Tourist JWT; supports live camera and gallery photo picking |
| **Online Payment** | SePay VietQR integration — auto-polls payment status every 5s with instant navigation on success |
| **Geofencing Engine** | Real-time Haversine distance calculations; 5-min cooldown per POI; priority queue for overlapping zones |
| **Smart Audio Playback** | Azure Cognitive TTS streaming or pre-recorded audio; cross-platform MediaElement with auto-ducking |
| **Curated Tour Mode** | Step-by-step tour audio guide with `TourSessionManager` progress tracking and Google Maps routing |
| **Rich POI Detail** | Fullscreen swipeable image gallery, inline audio player, and localized rich text descriptions |
| **Search & Discovery** | Instant POI search by name and category with live delta-sync updates |
| **Interactive Map** | Google Maps integration with custom branded pins, live user location, and category filtering |
| **Offline-First Architecture** | Full-sync on first launch into local SQLite; delta-sync every 5 mins; automatic retry on reconnection |
| **Live Device Telemetry** | SignalR WebSocket telemetry pushing real-time GPS coordinates to CMS DeviceHub |
| **Multilingual i18n** | Vietnamese · English · Chinese · Korean · Japanese with dynamic server fallback |
| **Dark / Light Theme** | Smooth animated theme switching with persistent local storage |

---

### 🌐 Web CMS

#### Dashboard & Authentication
* **JWT Authentication:** Secure role-based token authentication with persistent sessions.
* **Password Recovery:** SendGrid email integration with time-limited password reset tokens.
* **Executive Dashboard:** Live KPI cards (POIs, Tours, Listen count, Active devices), Recharts daily analytics, and Leaflet geographical heatmaps.
* **Profile Management:** Avatar upload, credential update, and real-time subscription tier badge indicator.

#### POI Management (Point of Interest)
* **POI Directory:** Filter, sort, paginate, and search with instant tier/priority status indicators.
* **Geocoding & Media:** Automated geocoding map picker, multi-image upload to Azure Blob, and multilingual audio narration binding.
* **Approval Queues:** Separate review workflows for New POIs, POI Updates, and POI Deletions.
* **Content Pipeline:** One-click automated translation and Azure Cognitive TTS generation across 5 languages.

#### Tours & Analytics
* **Tour Builder:** Drag-and-drop sequencing of POIs into curated walking audio tours.
* **Real-time Device Tracking:** Live map monitoring of tourist devices via SignalR WebSocket.
* **Audience Analytics:** Top popular POIs, listening duration metrics, and date-range filtering.

#### Subscription & Monetization
* **Admin Subscription Console:** Assign, revoke, and manage Owner subscription tiers with quick crown actions.
* **Transaction Dashboard:** Live payment history with multi-gateway filtering (SePay VietQR, MoMo).
* **Owner Self-Checkout:** Integrated dynamic QR code payment flow with countdown timer and automated tier provisioning.

---

### 🖥️ Backend Services

* **Azure Cognitive Services:** High-fidelity Neural Text-to-Speech (TTS) synthesis and Azure Blob Storage integration.
* **Message Broker:** RabbitMQ 3.13 integration with dead-letter exchange (DLX) for asynchronous media conversion.
* **SignalR Real-Time Hub:** High-throughput `DeviceHub` pushing device telemetry and broadcast alerts.
* **Data Retention Worker:** Background background service automatically archiving and purging telemetry logs per retention policy.

---

## 👥 Role-Based Access Control

```
[System Roles]
├── SuperAdmin / Admin : Full system access (CMS, Landing Settings, Subscriptions, Broadcasts)
├── Editor             : Content management (POI approval queues, Tours, Articles, Banners)
├── Owner (Shopkeeper) : Business management (Own POI, Subscription self-checkout, Store analytics)
└── Tourist (Mobile)   : Location audio guide, QR unlock, Map exploration, Tour mode
```

---

## 💎 Owner Subscription Plans

| Tier | Price | POI Quota | Audio Features | Analytics |
|---|---|---|---|---|
| **Free** | 0 VND | 1 POI | Pre-recorded Audio | Basic views |
| **Standard** | 199,000 VND / mo | 3 POIs | Auto TTS (2 languages) | Detailed listen metrics |
| **Premium** | 499,000 VND / mo | 10 POIs | Auto TTS (5 languages) + High Priority | Real-time Device Tracking + Heatmaps |

---

## 🛠️ Detailed Tech Stack

| Layer | Technologies |
|---|---|
| **Mobile App** | .NET MAUI 10, C#, XAML, MVVM CommunityToolkit, SQLite (sqlite-net-pcl), Google Maps API |
| **Web CMS** | React 19, Vite, Tailwind CSS, TanStack Query, Framer Motion, Recharts, Leaflet |
| **Backend API** | ASP.NET Core 10, C#, Entity Framework Core, SignalR WebSocket |
| **Database** | Microsoft SQL Server, Azure SQL Database |
| **Cloud & External** | Azure Cognitive TTS, Azure Blob Storage, SendGrid, RabbitMQ, SePay VietQR |

---

## 🚀 Getting Started

### Prerequisites
* [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
* [Node.js 20+ & npm](https://nodejs.org/)
* [Microsoft SQL Server 2022 / LocalDB / Azure SQL](https://www.microsoft.com/sql-server/)
* [Docker Desktop](https://www.docker.com/) (for RabbitMQ)

### 1. Clone Repository
```bash
git clone https://github.com/quynhtien1977/AudioGo.git
cd AudioGo
```

### 2. Run Backend API
```bash
cd api
dotnet restore
dotnet ef database update
dotnet run
```
API runs by default at `https://localhost:7147` (Swagger: `https://localhost:7147/swagger`).

### 3. Run Web CMS
```bash
cd web
npm install
npm run dev
```
Web app runs at `http://localhost:5173`.

### 4. Run Mobile App
Open `AudioGo_Client.sln` in Visual Studio 2022 / 2026, set `mobile` as startup project, choose an Android Emulator or physical device, and press `F5`.

---

## 🌿 Branching Strategy

```
main        ← Production-ready. Direct push is strictly prohibited.
develop     ← Integration branch. Base branch for all PRs.
feature/*   ← New features (branched from develop).
fix/*       ← Bug fixes (branched from develop).
hotfix/*    ← Urgent production patches (branched from main).
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting Pull Requests.

---

## 🔒 Security

For security vulnerability disclosures, please review our [Security Policy](SECURITY.md) or email us directly at [quynhtien123123@gmail.com](mailto:quynhtien123123@gmail.com).

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).
