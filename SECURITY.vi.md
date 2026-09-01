# 🔒 Security Policy — AudioGo

<p align="center">
  <a href="./SECURITY.md">English</a> |
  <a href="./SECURITY.vi.md"><b>Tiếng Việt</b></a> |
  <a href="./SECURITY.zh-CN.md">简体中文</a>
</p>

## Các phiên bản được hỗ trợ

Chúng tôi chỉ vá lỗi bảo mật cho các phiên bản đang được tích cực duy trì:

| Phiên bản | Được hỗ trợ |
|---|---|
| Latest (`main`) | ✅ Đầy đủ |
| Các bản release cũ | ⚠️ Chỉ lỗi nghiêm trọng (Critical) |
| Phiên bản beta / pre-release | ❌ Không hỗ trợ |

---

## 🚨 Báo cáo lỗ hổng bảo mật

**Vui lòng KHÔNG tạo public Issue để báo cáo lỗ hổng bảo mật.**  
Điều này có thể khiến lỗ hổng bị khai thác trước khi chúng tôi kịp vá.

### Cách báo cáo đúng cách

**Ưu tiên 1 — GitHub Private Vulnerability Reporting:**  
Dùng tính năng [Report a vulnerability](../../security/advisories/new) trực tiếp trên GitHub (yêu cầu đăng nhập).

**Ưu tiên 2 — Email:**  
Gửi báo cáo chi tiết đến: 📧 **[quynhtien123123@gmail.com](mailto:quynhtien123123@gmail.com)**

### Thông tin cần cung cấp

Vui lòng bao gồm:

- **Mô tả** lỗ hổng và tác động tiềm năng
- **Các bước tái hiện** (proof of concept nếu có)
- **Phạm vi bị ảnh hưởng** (API, Mobile, Web CMS, Database...)
- **Đề xuất giải pháp** (nếu bạn đã có)
- Thông tin liên hệ của bạn (để chúng tôi phản hồi)

---

## ⏱️ Quy trình xử lý

| Bước | Thời gian |
|---|---|
| Xác nhận nhận báo cáo | Trong vòng **48 giờ** |
| Đánh giá mức độ nghiêm trọng | Trong vòng **5 ngày làm việc** |
| Thông báo kế hoạch vá | Trong vòng **14 ngày** |
| Phát hành bản vá | Tùy độ nghiêm trọng (xem bảng dưới) |

### Mức độ ưu tiên vá lỗi

| Mức độ | CVSS Score | Mục tiêu vá |
|---|---|---|
| 🔴 **Critical** | 9.0 – 10.0 | ≤ 24 giờ |
| 🟠 **High** | 7.0 – 8.9 | ≤ 7 ngày |
| 🟡 **Medium** | 4.0 – 6.9 | ≤ 30 ngày |
| 🟢 **Low** | 0.1 – 3.9 | Release tiếp theo |

---

## 🏆 Responsible Disclosure

Chúng tôi trân trọng những người báo cáo lỗ hổng bảo mật có trách nhiệm. Nếu báo cáo của bạn được xác nhận:

- Bạn sẽ được ghi nhận trong **Security Advisory** (nếu bạn muốn)
- Chúng tôi sẽ phối hợp với bạn về thời điểm công bố sau khi bản vá được phát hành
- **Hall of Fame:** Tên của bạn sẽ được liệt kê trong phần cảm ơn của release notes

---

## 🛡️ Phạm vi (Scope)

### Trong phạm vi (In-scope)

- **API Backend** (`api/`) — SQL injection, auth bypass, IDOR, RCE, data exposure
- **Web CMS** (`web/`) — XSS, CSRF, auth vulnerabilities, sensitive data in client
- **Mobile App** (`mobile/`) — Insecure data storage, traffic interception, deeplink abuse
- **Infrastructure** — Misconfigured Azure services, exposed endpoints, secrets in code

### Ngoài phạm vi (Out-of-scope)

- Tấn công DoS / DDoS
- Brute force mật khẩu (đã có rate limiting)
- Lỗi trong third-party libraries (báo trực tiếp cho vendor)
- Issues đã được biết và đang được xử lý
- Tấn công yêu cầu quyền truy cập vật lý vào thiết bị

---

## 📋 Các biện pháp bảo mật hiện tại

| Thành phần | Biện pháp |
|---|---|
| **Authentication** | JWT Bearer với thời hạn ngắn; BCrypt password hashing |
| **Authorization** | Role-based (Admin / Owner / Editor / Tourist); claim-based checks |
| **Data in Transit** | HTTPS bắt buộc; TLS 1.2+ |
| **Secrets** | Không commit vào git; lưu trong Azure Key Vault / GitHub Secrets |
| **Payment** | Webhook signature verification (SePay HMAC); không lưu thẻ ngân hàng |
| **QR Tokens** | JWT có thời hạn; one-time use per session |
| **Database** | Parameterized queries (EF Core); không raw SQL từ user input |
| **CORS** | Whitelist origin cụ thể; không dùng `*` trên production |
| **Blob Storage** | Private containers; SAS token có thời hạn |

---

## 🔗 Tài liệu tham khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Azure Security Best Practices](https://learn.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [.NET Security Guidelines](https://learn.microsoft.com/dotnet/standard/security/)
