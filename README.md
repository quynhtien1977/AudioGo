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
AudioGo.sln          ← Solution chứa cả 3 projects
│
├── Client/          ← 📱 App di động (.NET MAUI — Android + iOS)
│   ├── Models/          # PoiEntity (SQLite local entity)
│   ├── ViewModels/      # BaseViewModel (MVVM / INotifyPropertyChanged)
│   ├── Views/           # XAML Pages
│   ├── Services/        # GeofenceService + Interfaces/IGeofenceService
│   ├── Helpers/         # GeoHelper (Haversine distance)
│   ├── Converters/      # XAML Value Converters
│   ├── Data/            # AppDatabase (SQLite async CRUD)
│   ├── Platforms/       # Android · iOS · MacCatalyst · Windows
│   └── Resources/       # Fonts · Images · Styles · Splash
│
├── Server/          ← 🖥️ REST API Backend (ASP.NET Core)
│   ├── Controllers/     # PoiController (GET/POST/PUT/DELETE)
│   └── Program.cs
│
└── Shared/          ← 📦 Models & Contracts dùng chung
    └── POI.cs           # POI model (Id, Name, Lat/Lon, Radius, Audio…)
```

---

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────┐
│              Du khách (Mobile App)               │
│           .NET MAUI — Client/                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ GPS / Maps  │→ │ GeofenceSvc  │→ │ Audio   │ │
│  │             │  │ (cooldown    │  │ Engine  │ │
│  └─────────────┘  │  5 min)      │  │ TTS/File│ │
│                   └──────────────┘  └─────────┘ │
│           [SQLite — Offline Mode]                │
└─────────────────────┬───────────────────────────┘
                      │ HTTP (Phase 2 — Online sync)
┌─────────────────────▼───────────────────────────┐
│          🖥️  Server — ASP.NET Core               │
│     REST API /api/poi — SQL Server (Phase 2)     │
└─────────────────────┬───────────────────────────┘
                      │ Shared Models
┌─────────────────────▼───────────────────────────┐
│          📦 Shared — Class Library               │
│          POI · DTOs dùng chung                   │
└─────────────────────────────────────────────────┘
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

| Công cụ | Phiên bản |
|---|---|
| .NET SDK | 10.0+ |
| Visual Studio / VS Code | VS 2022 17.x+ / VS Code với C# Dev Kit |
| Android SDK | API 21+ |
| iOS | 15.0+ (cần máy Mac để build) |

---

## 🛠️ Chạy dự án

### Server
```bash
cd Server
dotnet run
# API chạy tại: https://localhost:5001/api/poi
```

### Client (MAUI — Android Emulator)
```bash
cd Client
dotnet build -t:Run -f net10.0-android
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
