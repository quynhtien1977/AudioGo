# 🤝 Contributing to AudioGo

<p align="center">
  <a href="./CONTRIBUTING.md"><b>English</b></a> |
  <a href="./CONTRIBUTING.vi.md"><b>Tiếng Việt</b></a> |
  <a href="./CONTRIBUTING.zh-CN.md"><b>简体中文</b></a>
</p>

Thank you for your interest in contributing to AudioGo! Here are the guidelines for an efficient and collaborative workflow.

---

## 🚦 Before You Begin

1. **Fork** this repository to your GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AudioGo.git
   cd AudioGo
   ```
3. Read the [README.md](README.md) to understand the overall architecture.
4. Check existing [Issues](../../issues) and [Pull Requests](../../pulls) to avoid duplicate work.

---

## 🌿 Branching Strategy

```
main        ← Production-ready. DIRECT PUSH IS STRICTLY PROHIBITED.
develop     ← Integration branch. Base branch for all feature branches.
feature/*   ← New features (branched from develop).
fix/*       ← Bug fixes (branched from develop).
hotfix/*    ← Critical production fixes (branched from main, merged to both main & develop).
```

**Branch naming convention:** `feature/add-tour-rating`, `fix/geofence-cooldown`, `hotfix/payment-crash`

---

## 📝 Contribution Workflow

### 1. Create a New Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Write Code & Tests
- Adhere to the established coding standards (C# / .NET MAUI / React JSX).
- Add inline XML/JSDoc comments for complex business logic.
- Never commit `.env` files, production secrets, or build artifacts (`bin/`, `obj/`, `dist/`).

### 3. Commit Changes
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add tourist tour rating feature
fix: resolve crash when navigating back from checkout screen
docs: update English API documentation
refactor: extract TourSessionManager into standalone service
chore: upgrade CommunityToolkit.Maui to 9.x
```

### 4. Push & Open a Pull Request
```bash
git push origin feature/your-feature-name
```

→ Open a PR targeting the **`develop`** branch (not `main`).

---

## ✅ Pre-PR Checklist

- [ ] Code builds without errors (`dotnet build` / `npm run build`)
- [ ] No ESLint / TypeScript linting errors
- [ ] Unit tests pass: `dotnet test`
- [ ] No `.env`, keystore, certificates, or credentials committed
- [ ] PR description clearly explains the **problem** and the **solution**
- [ ] Screenshots or demo GIFs attached for UI/UX modifications

---

## 🏗️ Development Environment Setup

Please refer to the [README.md — Getting Started](README.md#-getting-started) section for detailed setup instructions.

Quick start:
```bash
# Backend API
cd api && dotnet run

# Web CMS
cd web && npm install && npm run dev

# RabbitMQ (requires Docker)
docker compose up rabbitmq -d
```

---

## 🐛 Reporting Bugs

Please open an [Issue](../../issues/new?template=bug_report.md) including:
- Environment (OS, device, app version)
- Clear step-by-step reproduction steps
- Expected vs. actual behavior
- Relevant error logs and screenshots

---

## 💡 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.
