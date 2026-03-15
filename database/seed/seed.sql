-- ============================================================
-- AudioGo — Seed Data (Quận 4, TP. Hồ Chí Minh)
-- Chạy sau khi đã apply EF migration
-- ============================================================

-- ── 1. Account Admin ─────────────────────────────────────────
-- Password: Admin@123 (BCrypt hash — đổi khi production)
INSERT INTO Account (AccountId, Username, PasswordHash, Role, CreatedAt)
VALUES (
    'acc-admin-001',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaJObYd1tHKH5Fd1G7kSmTFuy',
    'Admin',
    GETDATE()
);

-- ── 2. Categories ────────────────────────────────────────────
INSERT INTO Category (CategoryId, Name, CreatedAt) VALUES
    ('cat-001', N'Di tích lịch sử', GETDATE()),
    ('cat-002', N'Ẩm thực đường phố', GETDATE());

-- ── 3. POI — Quận 4, TP.HCM ─────────────────────────────────
INSERT INTO Poi (PoiId, AccountId, Latitude, Longitude, ActivationRadius, Priority, Status, LogoUrl, CreatedAt)
VALUES
    ('poi-001', 'acc-admin-001', 10.7619, 106.7009, 30, 1, 'active', '/uploads/images/poi-001.jpg', GETDATE()),
    ('poi-002', 'acc-admin-001', 10.7583, 106.7042, 25, 2, 'active', '/uploads/images/poi-002.jpg', GETDATE()),
    ('poi-003', 'acc-admin-001', 10.7648, 106.6981, 20, 1, 'active', '/uploads/images/poi-003.jpg', GETDATE()),
    ('poi-004', 'acc-admin-001', 10.7601, 106.7028, 35, 3, 'active', '/uploads/images/poi-004.jpg', GETDATE()),
    ('poi-005', 'acc-admin-001', 10.7572, 106.6995, 20, 2, 'active', '/uploads/images/poi-005.jpg', GETDATE());

-- ── 4. POI Content (Tiếng Việt) ───────────────────────────────
INSERT INTO PoiContent (ContentId, PoiId, LanguageCode, Title, Description, AudioUrl, IsMaster, CreatedAt)
VALUES
    ('cnt-vi-001', 'poi-001', 'vi',
     N'Chùa Phước Hải (Ngọc Hoàng)',
     N'Chùa Phước Hải, còn gọi là chùa Ngọc Hoàng, được xây dựng vào đầu thế kỷ 20 theo phong cách kiến trúc Trung Hoa. Đây là nơi thờ tự linh thiêng nổi tiếng của người Hoa tại TP.HCM.',
     '/uploads/audio/poi-001-vi.mp3', 1, GETDATE()),

    ('cnt-vi-002', 'poi-002', 'vi',
     N'Bến Vân Đồn',
     N'Bến Vân Đồn là một trong những tuyến đường nổi tiếng của Quận 4, chạy dọc theo kênh Tẻ. Nơi đây nổi tiếng với các hàng quán ẩm thực đường phố đặc trưng Sài Gòn.',
     '/uploads/audio/poi-002-vi.mp3', 1, GETDATE()),

    ('cnt-vi-003', 'poi-003', 'vi',
     N'Xóm Chiếu',
     N'Xóm Chiếu là khu phố lịch sử nằm ở phường Xóm Chiếu, Quận 4, nổi tiếng với nghề dệt chiếu truyền thống từ thời Pháp thuộc. Ngày nay vẫn còn nhiều hộ gia đình lưu giữ nghề thủ công này.',
     '/uploads/audio/poi-003-vi.mp3', 1, GETDATE()),

    ('cnt-vi-004', 'poi-004', 'vi',
     N'Chợ Xóm Chiếu',
     N'Chợ Xóm Chiếu là khu chợ truyền thống sầm uất của Quận 4. Chợ họp từ sáng sớm đến chiều tối, bày bán đa dạng các loại thực phẩm tươi sống và đặc sản địa phương.',
     '/uploads/audio/poi-004-vi.mp3', 1, GETDATE()),

    ('cnt-vi-005', 'poi-005', 'vi',
     N'Nhà thờ Khánh Hội',
     N'Nhà thờ Khánh Hội được xây dựng từ thời Pháp và là một trong những công trình kiến trúc tôn giáo tiêu biểu của Quận 4. Nhà thờ mang kiến trúc Gothic với tháp chuông đặc trưng.',
     '/uploads/audio/poi-005-vi.mp3', 1, GETDATE());

-- ── 5. POI Content (English) ─────────────────────────────────
INSERT INTO PoiContent (ContentId, PoiId, LanguageCode, Title, Description, AudioUrl, IsMaster, CreatedAt)
VALUES
    ('cnt-en-001', 'poi-001', 'en',
     'Phuoc Hai Temple (Jade Emperor Pagoda)',
     'Phuoc Hai Temple, also known as the Jade Emperor Pagoda, was built in the early 20th century in Chinese architectural style. It is one of the most sacred places of worship for the Chinese community in Ho Chi Minh City.',
     '/uploads/audio/poi-001-en.mp3', 0, GETDATE()),

    ('cnt-en-002', 'poi-002', 'en',
     'Van Don Embankment',
     'Van Don Embankment is one of the famous streets of District 4, running along the Te Canal. The area is well known for its vibrant street food culture, offering authentic Saigon flavors.',
     '/uploads/audio/poi-002-en.mp3', 0, GETDATE()),

    ('cnt-en-003', 'poi-003', 'en',
     'Xom Chieu Quarter',
     'Xom Chieu is a historic neighborhood in District 4, famous for its traditional mat-weaving craft dating back to the French colonial era. Many households still preserve this traditional handicraft.',
     '/uploads/audio/poi-003-en.mp3', 0, GETDATE());

-- ── 6. Category — POI assignments ────────────────────────────
INSERT INTO CategoryPoi (CategoryId, PoiId) VALUES
    ('cat-001', 'poi-001'),
    ('cat-001', 'poi-003'),
    ('cat-001', 'poi-005'),
    ('cat-002', 'poi-002'),
    ('cat-002', 'poi-004');

-- ── 7. Tour mẫu ──────────────────────────────────────────────
INSERT INTO Tour (TourId, Name, Description, CreatedAt)
VALUES (
    'tour-001',
    N'Khám phá Quận 4',
    N'Hành trình khám phá những điểm di tích lịch sử và ẩm thực nổi bật của Quận 4, TP. Hồ Chí Minh.',
    GETDATE()
);

INSERT INTO TourPoi (TourId, PoiId, StepOrder) VALUES
    ('tour-001', 'poi-001', 1),
    ('tour-001', 'poi-003', 2),
    ('tour-001', 'poi-002', 3),
    ('tour-001', 'poi-004', 4),
    ('tour-001', 'poi-005', 5);
