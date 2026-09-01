# 🤝 参与贡献 AudioGo

<p align="center">
  <a href="./CONTRIBUTING.md">English</a> |
  <a href="./CONTRIBUTING.vi.md">Tiếng Việt</a> |
  <a href="./CONTRIBUTING.zh-CN.md"><b>简体中文</b></a>
</p>

非常感谢您对 AudioGo 开源项目的关注与支持！为了保证代码质量与协作效率，请在提交代码前仔细阅读以下贡献指引。

---

## 🚦 开始之前

1. **Fork** 本仓库到您的个人 GitHub 账号。
2. **Clone** 您的 Fork 分支到本地开发环境：
   ```bash
   git clone https://github.com/YOUR_USERNAME/AudioGo.git
   cd AudioGo
   ```
3. 阅读 [README.zh-CN.md](README.zh-CN.md) 了解系统总体架构与模块划分。
4. 查阅现有的 [Issues](../../issues) 和 [Pull Requests](../../pulls)，避免重复开发。

---

## 🌿 Git 分支规范

```
main        ← 生产稳定分支。严禁直接 Push 提交。
develop     ← 集成开发分支。所有 Feature 分支的基线分支。
feature/*   ← 新功能开发分支 (基于 develop 切出)。
fix/*       ← 缺陷修复分支 (基于 develop 切出)。
hotfix/*    ← 紧急生产补丁分支 (基于 main 切出，合并回 main 与 develop)。
```

**分支命名示例：** `feature/add-tour-rating`, `fix/geofence-cooldown`, `hotfix/payment-crash`

---

## 📝 贡献工作流

### 1. 创建特性分支
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. 编码与规范
- 严格遵循各子项目的编码规范（C# / .NET MAUI / React JSX）。
- 为复杂的业务逻辑添加清晰的代码注释。
- **严禁** 提交 `.env` 配置文件、敏感凭据以及构建产物（`bin/`, `obj/`, `dist/`）。

### 3. 提交 Commit 信息
使用 [Conventional Commits (约定式提交)](https://www.conventionalcommits.org/zh-hans/) 规范：

```
feat: 新增游客路线评分功能
fix: 修复从收银台页面返回时的闪退问题
docs: 补充英文接口文档说明
refactor: 将 TourSessionManager 抽离为独立服务
chore: 升级 CommunityToolkit.Maui 到 9.x
```

### 4. 推送并创建 Pull Request
```bash
git push origin feature/your-feature-name
```

→ 提交 PR 并指定目标分支为 **`develop`**（切勿直接提交至 `main`）。

---

## ✅ PR 提交自检清单

- [ ] 本地编译顺利通过 (`dotnet build` / `npm run build`)
- [ ] 无 ESLint / 代码风格告警
- [ ] 单元测试全部通过 (`dotnet test`)
- [ ] 未提交任何 `.env` 文件、密钥证书或隐私配置
- [ ] PR 描述清晰阐述了 **修改背景** 与 **技术实现方案**
- [ ] 涉及 UI/UX 改造时已附带效果截图或演示动图

---

## 🏗️ 本地开发环境配置

详细环境搭建步骤请参阅 [README.zh-CN.md — 本地开发与部署](README.zh-CN.md#-本地开发与部署)。

快速启动命令：
```bash
# 后端 API 服务
cd api && dotnet run

# Web CMS 管理后台
cd web && npm install && npm run dev

# RabbitMQ 消息队列 (需要 Docker)
docker compose up rabbitmq -d
```

---

## 🐛 缺陷反馈 (Bug Report)

如发现系统缺陷，欢迎提交 [Issue](../../issues/new?template=bug_report.md)，并提供以下信息：
- 运行环境（操作系统、设备型号、应用版本）
- 清晰的复现步骤
- 预期行为 vs. 实际异常表现
- 相关的错误日志与截图

---

## 💡 行为准则

参与本项目即代表您同意遵守我们的 [行为准则 (Code of Conduct)](CODE_OF_CONDUCT.zh-CN.md)。
