# 🤝 Contributing to AudioGo

Cảm ơn bạn đã quan tâm đến dự án AudioGo! Dưới đây là hướng dẫn để đóng góp hiệu quả.

---

## 🚦 Trước khi bắt đầu

1. **Fork** repo về tài khoản của bạn
2. **Clone** fork về máy local
3. Đọc [README.md](README.md) để hiểu kiến trúc tổng quan
4. Kiểm tra [Issues](../../issues) và [Pull Requests](../../pulls) đang mở để tránh trùng lặp

---

## 🌿 Branching Strategy

```
main        ← Production-ready. KHÔNG push trực tiếp
develop     ← Integration branch. Base cho mọi feature branch
feature/*   ← Tính năng mới  (từ develop)
fix/*       ← Bug fix         (từ develop)
hotfix/*    ← Khẩn cấp        (từ main, merge về cả main và develop)
```

**Đặt tên branch:** `feature/add-tour-rating`, `fix/geofence-cooldown`, `hotfix/payment-crash`

---

## 📝 Quy trình đóng góp

### 1. Tạo branch mới
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang-cua-ban
```

### 2. Viết code
- Tuân theo convention của từng project (C# / JSX)
- Thêm comment cho logic phức tạp
- Không commit file `.env`, secrets, hay build artifacts

### 3. Commit
Dùng [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: thêm tính năng đánh giá tour
fix: sửa crash khi quay lại từ màn hình thanh toán
docs: cập nhật README
refactor: tách TourSessionManager ra service riêng
chore: nâng cấp CommunityToolkit.Maui lên 9.x
```

### 4. Push & tạo Pull Request
```bash
git push origin feature/ten-tinh-nang-cua-ban
```

→ Tạo PR vào branch **`develop`** (không phải `main`)

---

## ✅ Checklist trước khi tạo PR

- [ ] Code build thành công (`dotnet build` / `npm run build`)
- [ ] Không có lỗi lint ESLint (web)
- [ ] Unit tests pass: `dotnet test`
- [ ] Không commit file `.env`, keystore, hay credentials
- [ ] PR mô tả rõ **vấn đề** và **giải pháp**
- [ ] Screenshot/video nếu thay đổi UI

---

## 🏗️ Thiết lập môi trường dev

Xem chi tiết tại [README.md — Chạy dự án](README.md#️-chạy-dự-án).

Tóm tắt nhanh:
```bash
# API
cd api && dotnet run

# Web CMS  
cd web && npm install && npm run dev

# RabbitMQ (cần Docker)
docker compose up rabbitmq -d
```

---

## 🐛 Báo lỗi (Bug Report)

Vui lòng tạo [Issue](../../issues/new?template=bug_report.md) với:
- Môi trường (OS, thiết bị, phiên bản app)
- Các bước tái hiện
- Kết quả mong đợi vs thực tế
- Log / Screenshot nếu có

---

## 💡 Đề xuất tính năng

Tạo [Issue](../../issues/new?template=feature_request.md) với:
- Mô tả tính năng
- Lý do / use case cụ thể
- Mockup hoặc ví dụ tham khảo (nếu có)

---

## 📄 License

Khi đóng góp, bạn đồng ý rằng code của mình được phát hành theo [MIT License](LICENSE).
