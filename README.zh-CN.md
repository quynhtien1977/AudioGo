# 🎧 AudioGo — 智能位置感知语音导览系统

<div align="center">

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README.vi.md">Tiếng Việt</a> |
  <a href="./README.zh-CN.md"><b>简体中文</b></a>
</p>

**基于地理围栏的自动化语音导览平台** — 游客靠近景点（POI）时自动触发多语言语音讲解，无需任何手动操作。

[![Website](https://img.shields.io/badge/🌐%20官方网站-audiogo.tranminhmed.vn-0070f3?style=for-the-badge)](https://audiogo.tranminhmed.vn)
[![Vercel Deploy](https://img.shields.io/badge/CMS-部署于%20Vercel-black?style=for-the-badge&logo=vercel)](https://audiogo-cms.vercel.app)

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![MAUI](https://img.shields.io/badge/.NET%20MAUI-Android-blueviolet?logo=android&logoColor=white)](https://learn.microsoft.com/dotnet/maui)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-10-blue?logo=dotnet)](https://learn.microsoft.com/aspnet/core)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Azure](https://img.shields.io/badge/Azure-SQL%20%7C%20Blob%20%7C%20TTS-0078D4?logo=microsoftazure)](https://azure.microsoft.com)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)

</div>

---

## 📋 目录

- [代码库目录结构](#-代码库目录结构)
- [系统总体架构](#-系统总体架构)
- [核心功能特性](#-核心功能特性)
  - [移动端 App (游客端)](#-移动端-app-游客端)
  - [Web 管理后台 (CMS)](#-web-管理后台-cms)
  - [后端微服务与云集成](#️-后端微服务与云集成)
- [基于角色的权限控制 (RBAC)](#-基于角色的权限控制-rbac)
- [商家订阅方案](#-商家订阅方案)
- [技术栈清单](#️-技术栈清单)
- [本地开发与部署](#-本地开发与部署)
- [Git 分支规范](#-git-分支规范)
- [参与贡献](CONTRIBUTING.zh-CN.md)
- [开源协议](#-开源协议)

---

## 📁 代码库目录结构

```
AudioGo_Client.sln
│
├── mobile/          ← 📱 移动端应用 (.NET MAUI — Android / iOS)
│   ├── Views/           # XAML 界面: 启动页、欢迎页、扫码、地图、POI详情、路线导览、设置…
│   ├── ViewModels/      # MVVM 视图模型 — 主页、地图、POI、路线、搜索、设置、支付
│   ├── Services/        # ApiService、SyncService、GeofenceService、AudioService、
│   │                    #   LocationService、SignalRService、TourSessionManager
│   ├── Data/            # AppDatabase (基于 sqlite-net-pcl 的本地异步数据库)
│   ├── Models/          # SQLite 本地数据模型
│   ├── Helpers/         # GeoHelper (地理计算)、LanguageHelper、AppStrings (多语言)
│   ├── Converters/      # XAML 数据转换器
│   ├── Platforms/       # Android / iOS 原生平台代码
│   └── Resources/       # 字体、图像、样式资源
│
├── api/             ← 🖥️ 后端 REST API 服务 (ASP.NET Core 10)
│   ├── Controllers/
│   │   ├── AuthController.cs          # CMS 认证与 JWT 令牌分发
│   │   ├── LandingController.cs       # 官网公开展示内容与配置接口
│   │   ├── Cms/                       # 23 个 CMS 接口 (管理员、商家、编辑)
│   │   ├── Mobile/                    # 9 个移动端接口 (游客认证、POI、路线…)
│   │   └── Payment/                   # 支付回调: SePay VietQR, MoMo
│   ├── Models/          # 22 个实体模型
│   ├── Data/            # EF Core 数据上下文与数据库迁移
│   ├── Repositories/    # 仓储模式实现
│   ├── Services/        # 27 个核心业务逻辑服务
│   ├── Hubs/            # SignalR DeviceHub (实时设备位置追踪)
│   └── Program.cs       # 依赖注入与中间件管道
│
├── shared/          ← 📦 跨端共享契约 (API ↔ Mobile)
│   └── DTOs/            # 共享数据传输对象 (AuthDto, PoiDetailDto, TourDto…)
│
├── web/             ← 🌐 Web CMS 管理后台与官网 (React 19 + Vite + Tailwind CSS)
│   └── src/
│       ├── pages/       # 34 个管理页面与官网组件
│       ├── components/  # 现代 UI 组件库
│       ├── api/         # Axios API 客户端封装
│       └── hooks/       # useAuth、useNotifications、useSubscription 等自定义 Hook
│
└── database/        ← 🗄️ SQL Server 数据库脚本与种子数据
```

---

## 🏗️ 系统总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│              📱 移动端应用 — .NET MAUI (Android / iOS)          │
│                                                                  │
│  启动动画 → 欢迎界面 → 二维码快速登录 / 在线支付 → 主界面导航  │
│                                                                  │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ GPS 定位 + │  │ 地理围栏服务     │  │ 智能音频引擎        │  │
│  │ 谷歌地图 + │→ │ (Haversine算法 + │→ │ • 微软 Azure TTS 流 │  │
│  │ 扫码识别   │  │  5分钟防重触发 + │  │ • 本地离线音频播放  │  │
│  └────────────┘  │  重叠区域优先级) │  │ • 跨平台原生组件    │  │
│                  └──────────────────┘  └─────────────────────┘  │
│  同步服务: 首次全量同步 + 每5分钟增量差分同步                   │
│  SQLite 本地缓存 (离线优先架构设计)                              │
│  SignalR 服务: 实时 WebSocket 定位上报 → DeviceHub               │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS REST + SignalR WebSocket
┌────────────────────▼────────────────────────────────────────────┐
│                 🖥️  后端服务 — ASP.NET Core 10                   │
│                                                                  │
│  JWT 权限控制 │ CMS 接口集 │ 移动端接口集 │ 支付安全回调        │
│  SendGrid 邮件 │ Azure Blob 云存储 │ Azure 认知服务 TTS 语音合成 │
│  内容生产线: 自动翻译 (5种语言) + 自动化多语言 TTS 生成          │
│                                                                  │
│  SQL Server: POI景点、路线、账户、订阅计划、支付流水、消息日志… │
│                                                                  │
│  SignalR DeviceHub: 游客移动轨迹实时推流                        │
│  数据保留服务: 自动清理与归档过期遥测日志                       │
└────────────────────┬────────────────────────────────────────────┘
                     │ JWT Bearer + REST
┌────────────────────▼────────────────────────────────────────────┐
│           🌐 WEB CMS 管理系统 — React 19 + Vite                 │
│                                                                  │
│  管理员 / 商家店主 / 审核编辑 多角色控制台                      │
│  Tailwind CSS + Recharts 图表 + Leaflet 地理热力图              │
│  实时通知气泡与多语言内容编辑器                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ 核心功能特性

### 📱 移动端 App (游客端)

| 功能特性 | 功能描述 |
|---|---|
| **启动与鉴权** | 5 阶段流畅启动动画；智能校验 JWT 有效性，无缝分流至欢迎页或主应用 |
| **二维码登录** | 扫码展台/桌面码即刻生成临时游客 JWT；支持摄像头实时扫描与相册图片选取 |
| **在线支付** | 集成 SePay VietQR 在线扫码支付，5秒轮询确认，支付成功即刻自动解锁 |
| **地理围栏引擎** | 毫秒级 Haversine 距离算法；POI 专属 5 分钟冷却计时；多重覆盖智能优先级队列 |
| **智能语音播放** | 微软 Azure 神经网络 TTS 实时串流与高保真录音；智能淡入淡出与景点切换打断 |
| **游览路线模式** | 循序渐进的路线导览体系；`TourSessionManager` 状态追踪与地图路线指引 |
| **POI 详情展示** | 全屏滑动相册、嵌入式音频播放器、多语言富文本介绍 |
| **智能搜索** | 按名称、分类、标签即时检索；与增量同步机制无缝结合 |
| **互动式地图** | 谷歌地图深度集成，品牌定制图钉、实时定位追踪与分类过滤 |
| **离线优先 (Offline-First)** | 首次启动全量缓存至 SQLite；每 5 分钟差分增量同步；网络恢复自动重试 |
| **实时设备遥测** | SignalR WebSocket 持续上报游客轨迹至管理后台，赋能大数据分析 |
| **多语言本地化** | 中文 (ZH) · 英文 (EN) · 越南文 (VI) · 韩文 (KO) · 日文 (JA) |
| **深色 / 浅色模式** | 丝滑过渡的主题切换动画，本地自动持久化保存 |

---

### 🌐 Web 管理后台 (CMS)

* **控制台概览:** 实时 KPI 指标看板（POI 总数、路线数、收听总次数、在线设备数）、Recharts 趋势分析图与 Leaflet 地理热力图分布。
* **POI 景点全生命周期管理:** 地图选点自动逆地理编码、Azure Blob 媒体文件管理、多语言音频绑定。
* **审核流工作台:** 独立的新建审核、更新审核、删除审核工作流，保障内容合规。
* **内容生产自动化流水线:** 一键调用 Google/Azure API 自动将文本翻译为 5 国语言并生成自然多语言语音文件。
* **路线规划编排:** 可视化拖拽编排景点先后顺序，轻松打造经典游览路线。
* **实时设备追踪大屏:** 实时地图可视化呈现景区所有移动设备的分布与行动轨迹。
* **商业化订阅系统:** 商家自主选购套餐、动态聚合二维码支付、后台快速调权与流水审核。

---

## 👥 基于角色的权限控制 (RBAC)

```
[系统角色体系]
├── 超级管理员 / 管理员 (Admin) : 系统全功能权限 (CMS、官网配置、订阅调权、全区广播)
├── 审核编辑 (Editor)           : 内容运维权限 (POI 审核流、路线规划、新闻文章、横幅广告)
├── 商家店主 (Owner)            : 门店运营权限 (认领维护 POI、在线购买订阅、门店客流分析)
└── 游客用户 (Tourist)          : 移动端体验权限 (位置导览、扫码解锁、地图浏览、路线跟随)
```

---

## 💎 商家订阅方案

| 套餐级别 | 价格 | 景点配额 (POI) | 语音特性 | 数据分析能力 |
|---|---|---|---|---|
| **免费体验版 (Free)** | 0 VND | 1 个 POI | 本地录制音频上传 | 基础浏览量统计 |
| **标准商用版 (Standard)** | 199,000 VND / 月 | 3 个 POI | 自动化 TTS (支持 2 种语言) | 详细收听转化统计 |
| **尊享专业版 (Premium)** | 499,000 VND / 月 | 10 个 POI | 自动化 TTS (5 种语言) + 优先推荐 | 实时设备轨迹与客流热力图 |

---

## 🛠️ 技术栈清单

| 层次 | 技术选型 |
|---|---|
| **移动端 (Mobile)** | .NET MAUI 10, C#, XAML, MVVM CommunityToolkit, SQLite, Google Maps API |
| **Web 前端 (CMS)** | React 19, Vite, Tailwind CSS, TanStack Query, Framer Motion, Recharts, Leaflet |
| **后端服务 (Backend)** | ASP.NET Core 10, C#, Entity Framework Core, SignalR WebSocket |
| **数据库 (Database)** | Microsoft SQL Server, Azure SQL Database |
| **云服务与基础设施** | Azure Cognitive TTS, Azure Blob Storage, SendGrid, RabbitMQ, SePay |

---

## 🚀 本地开发与部署

### 环境要求
* [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
* [Node.js 20+ & npm](https://nodejs.org/)
* [Microsoft SQL Server 2022 / LocalDB / Azure SQL](https://www.microsoft.com/sql-server/)
* [Docker Desktop](https://www.docker.com/) (用于 RabbitMQ)

### 1. 克隆代码仓库
```bash
git clone https://github.com/quynhtien1977/AudioGo.git
cd AudioGo
```

### 2. 启动后端 API
```bash
cd api
dotnet restore
dotnet ef database update
dotnet run
```
API 默认监听 `https://localhost:7147` (Swagger 接口文档: `https://localhost:7147/swagger`)。

### 3. 启动 Web CMS
```bash
cd web
npm install
npm run dev
```
Web 前端运行于 `http://localhost:5173`。

### 4. 运行移动端 App
使用 Visual Studio 2022 / 2026 打开 `AudioGo_Client.sln`，将 `mobile` 设置为启动项目，选择 Android 模拟器或实体机并按 `F5` 启动调试。

---

## 🌿 Git 分支规范

```
main        ← 生产稳定分支。严禁直接提交。
develop     ← 集成开发分支。所有 Feature PR 的目标分支。
feature/*   ← 新功能开发分支 (基于 develop 切出)。
fix/*       ← 缺陷修复分支 (基于 develop 切出)。
hotfix/*    ← 紧急生产补丁分支 (基于 main 切出)。
```

---

## 🤝 参与贡献

欢迎广大开发者参与贡献！在提交 Pull Request 前，请务必阅读我们的 [贡献指南 (Contributing Guide)](CONTRIBUTING.zh-CN.md) 与 [行为准则 (Code of Conduct)](CODE_OF_CONDUCT.zh-CN.md)。

---

## 🔒 安全漏洞反馈

若发现潜在的安全漏洞，请参阅我们的 [安全策略 (Security Policy)](SECURITY.zh-CN.md) 或直接发送邮件至 [quynhtien123123@gmail.com](mailto:quynhtien123123@gmail.com)。

---

## 📄 开源协议

本项目基于 [MIT 开源许可证](LICENSE) 发布。
