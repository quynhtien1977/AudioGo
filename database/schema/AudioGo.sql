-- ============================================================
-- AudioGo — Complete Database Script (All-in-One)
-- Tạo DB nếu chưa có → Schema → Constraints → Indexes → Triggers → Procedures
--
-- Cách chạy (chọn 1):
--   1. sqlcmd -S . -E -i database/schema/AudioGo.sql
--   2. Mở trong SSMS và bấm Execute (F5)
-- ============================================================

-- ── 1. Tạo Database nếu chưa có ──────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AudioGo')
BEGIN
    CREATE DATABASE AudioGo;
    PRINT 'Database AudioGo created.';
END
ELSE
    PRINT 'Database AudioGo already exists.';
GO

USE AudioGo;
GO

-- ── 2. Schema — chỉ tạo bảng nếu chưa có ─────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Account')
BEGIN
    CREATE TABLE [Account] (
        [AccountId]    nvarchar(255) NOT NULL PRIMARY KEY,
        [Username]     nvarchar(255) NOT NULL,
        [PasswordHash] nvarchar(255) NOT NULL,
        [Role]         nvarchar(50)  NOT NULL DEFAULT 'Manager',
        [CreatedAt]    datetime      NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt]    datetime      NULL
    );
    PRINT 'Table Account created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Poi')
BEGIN
    CREATE TABLE [Poi] (
        [PoiId]            nvarchar(255) NOT NULL PRIMARY KEY,
        [AccountId]        nvarchar(255) NOT NULL,
        [Latitude]         float         NOT NULL,
        [Longitude]        float         NOT NULL,
        [ActivationRadius] int           NOT NULL DEFAULT 30,
        [Priority]         int           NOT NULL DEFAULT 0,
        [Status]           nvarchar(50)  NOT NULL DEFAULT 'Inactive',
        [LogoUrl]          nvarchar(500) NULL,
        [CreatedAt]        datetime      NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt]        datetime      NULL,
        CONSTRAINT FK_Poi_Account FOREIGN KEY ([AccountId]) REFERENCES [Account] ([AccountId])
    );
    CREATE INDEX IX_Poi_AccountId ON [Poi] ([AccountId]);
    CREATE INDEX IX_Poi_Status    ON [Poi] ([Status]);
    PRINT 'Table Poi created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PoiContent')
BEGIN
    CREATE TABLE [PoiContent] (
        [ContentId]      nvarchar(255) NOT NULL PRIMARY KEY,
        [PoiId]          nvarchar(255) NOT NULL,
        [LanguageCode]   nvarchar(10)  NOT NULL,
        [Title]          nvarchar(500) NOT NULL,
        [Description]    nvarchar(max) NOT NULL,
        [AudioUrl]       nvarchar(1000) NULL,
        [LocalAudioPath] nvarchar(1000) NULL,
        [IsMaster]       bit           NOT NULL DEFAULT 0,
        [CreatedAt]      datetime      NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt]      datetime      NULL,
        CONSTRAINT FK_PoiContent_Poi FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId]) ON DELETE CASCADE,
        -- Không cho phép 2 bản ghi cùng PoiId + LanguageCode
        CONSTRAINT UQ_PoiContent_Poi_Lang UNIQUE ([PoiId], [LanguageCode])
    );
    CREATE INDEX IX_PoiContent_PoiId        ON [PoiContent] ([PoiId]);
    CREATE INDEX IX_PoiContent_LanguageCode ON [PoiContent] ([LanguageCode]);
    PRINT 'Table PoiContent created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PoiGallery')
BEGIN
    CREATE TABLE [PoiGallery] (
        [ImageId]   nvarchar(255) NOT NULL PRIMARY KEY,
        [PoiId]     nvarchar(255) NOT NULL,
        [ImageUrl]  nvarchar(1000) NOT NULL,
        [SortOrder] int           NOT NULL DEFAULT 0,
        [CreatedAt] datetime      NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt] datetime      NULL,
        CONSTRAINT FK_PoiGallery_Poi FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId]) ON DELETE CASCADE
    );
    CREATE INDEX IX_PoiGallery_PoiId ON [PoiGallery] ([PoiId]);
    PRINT 'Table PoiGallery created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Category')
BEGIN
    CREATE TABLE [Category] (
        [CategoryId] nvarchar(255) NOT NULL PRIMARY KEY,
        [Name]       nvarchar(500) NOT NULL,
        [CreatedAt]  datetime      NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt]  datetime      NULL
    );
    PRINT 'Table Category created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CategoryPoi')
BEGIN
    CREATE TABLE [CategoryPoi] (
        [CategoryId] nvarchar(255) NOT NULL,
        [PoiId]      nvarchar(255) NOT NULL,
        PRIMARY KEY ([CategoryId], [PoiId]),
        CONSTRAINT FK_CategoryPoi_Category FOREIGN KEY ([CategoryId]) REFERENCES [Category] ([CategoryId]) ON DELETE CASCADE,
        CONSTRAINT FK_CategoryPoi_Poi      FOREIGN KEY ([PoiId])      REFERENCES [Poi]      ([PoiId])      ON DELETE CASCADE
    );
    PRINT 'Table CategoryPoi created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tour')
BEGIN
    CREATE TABLE [Tour] (
        [TourId]       nvarchar(255)  NOT NULL PRIMARY KEY,
        [Name]         nvarchar(500)  NOT NULL,
        [Description]  nvarchar(max)  NULL,
        [ThumbnailUrl] nvarchar(1000) NULL,
        [CreatedAt]    datetime       NOT NULL DEFAULT (GETDATE()),
        [UpdatedAt]    datetime       NULL
    );
    PRINT 'Table Tour created.';
END
ELSE
BEGIN
    -- Thêm cột ThumbnailUrl nếu chưa có (idempotent khi chạy lại)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tour') AND name = 'ThumbnailUrl')
    BEGIN
        ALTER TABLE [Tour] ADD [ThumbnailUrl] nvarchar(1000) NULL;
        PRINT 'Column ThumbnailUrl added to Tour.';
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TourPoi')
BEGIN
    CREATE TABLE [TourPoi] (
        [TourId]    nvarchar(255) NOT NULL,
        [PoiId]     nvarchar(255) NOT NULL,
        [StepOrder] int           NOT NULL DEFAULT 0,
        PRIMARY KEY ([TourId], [PoiId]),
        CONSTRAINT FK_TourPoi_Tour FOREIGN KEY ([TourId]) REFERENCES [Tour] ([TourId]) ON DELETE CASCADE,
        CONSTRAINT FK_TourPoi_Poi  FOREIGN KEY ([PoiId])  REFERENCES [Poi]  ([PoiId])  ON DELETE CASCADE
    );
    PRINT 'Table TourPoi created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ListenHistory')
BEGIN
    CREATE TABLE [ListenHistory] (
        [HistoryId]      nvarchar(255) NOT NULL PRIMARY KEY,
        [DeviceId]       nvarchar(255) NOT NULL,
        [PoiId]          nvarchar(255) NOT NULL,
        [Timestamp]      datetime      NOT NULL DEFAULT (GETDATE()),
        [ListenDuration] int           NOT NULL DEFAULT 0,
        CONSTRAINT FK_ListenHistory_Poi FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
    );
    CREATE INDEX IX_ListenHistory_DeviceId           ON [ListenHistory] ([DeviceId]);
    CREATE INDEX IX_ListenHistory_PoiId              ON [ListenHistory] ([PoiId]);
    CREATE INDEX IX_ListenHistory_Timestamp          ON [ListenHistory] ([Timestamp]);
    CREATE INDEX IX_ListenHistory_DeviceId_Timestamp ON [ListenHistory] ([DeviceId], [Timestamp]);
    PRINT 'Table ListenHistory created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LocationLog')
BEGIN
    CREATE TABLE [LocationLog] (
        [LocationId] nvarchar(255) NOT NULL PRIMARY KEY,
        [DeviceId]   nvarchar(255) NOT NULL,
        [Latitude]   float         NOT NULL,
        [Longitude]  float         NOT NULL,
        [Timestamp]  datetime      NOT NULL DEFAULT (GETDATE())
    );
    CREATE INDEX IX_LocationLog_DeviceId           ON [LocationLog] ([DeviceId]);
    CREATE INDEX IX_LocationLog_Timestamp          ON [LocationLog] ([Timestamp]);
    CREATE INDEX IX_LocationLog_DeviceId_Timestamp ON [LocationLog] ([DeviceId], [Timestamp]);
    PRINT 'Table LocationLog created.';
END
GO

-- ── 3. Constraints bổ sung (idempotent) ──────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE name = 'UQ_Account_Username'
)
BEGIN
    ALTER TABLE [Account]
    ADD CONSTRAINT UQ_Account_Username UNIQUE ([Username]);
    PRINT 'Constraint UQ_Account_Username added.';
END
GO

-- ── 4. Triggers UpdatedAt (tự động cập nhật khi UPDATE) ──────

-- Account
IF OBJECT_ID('TR_Account_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_Account_UpdateTimestamp;
GO
CREATE TRIGGER TR_Account_UpdateTimestamp ON [Account] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [Account] SET UpdatedAt = GETDATE()
    WHERE AccountId IN (SELECT AccountId FROM inserted);
END
GO

-- Poi
IF OBJECT_ID('TR_Poi_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_Poi_UpdateTimestamp;
GO
CREATE TRIGGER TR_Poi_UpdateTimestamp ON [Poi] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [Poi] SET UpdatedAt = GETDATE()
    WHERE PoiId IN (SELECT PoiId FROM inserted);
END
GO

-- PoiContent
IF OBJECT_ID('TR_PoiContent_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_PoiContent_UpdateTimestamp;
GO
CREATE TRIGGER TR_PoiContent_UpdateTimestamp ON [PoiContent] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [PoiContent] SET UpdatedAt = GETDATE()
    WHERE ContentId IN (SELECT ContentId FROM inserted);
END
GO

-- PoiGallery
IF OBJECT_ID('TR_PoiGallery_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_PoiGallery_UpdateTimestamp;
GO
CREATE TRIGGER TR_PoiGallery_UpdateTimestamp ON [PoiGallery] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [PoiGallery] SET UpdatedAt = GETDATE()
    WHERE ImageId IN (SELECT ImageId FROM inserted);
END
GO

-- Category
IF OBJECT_ID('TR_Category_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_Category_UpdateTimestamp;
GO
CREATE TRIGGER TR_Category_UpdateTimestamp ON [Category] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [Category] SET UpdatedAt = GETDATE()
    WHERE CategoryId IN (SELECT CategoryId FROM inserted);
END
GO

-- Tour
IF OBJECT_ID('TR_Tour_UpdateTimestamp', 'TR') IS NOT NULL DROP TRIGGER TR_Tour_UpdateTimestamp;
GO
CREATE TRIGGER TR_Tour_UpdateTimestamp ON [Tour] AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [Tour] SET UpdatedAt = GETDATE()
    WHERE TourId IN (SELECT TourId FROM inserted);
END
GO

-- ── 5. Stored Procedures (Analytics) ─────────────────────────

-- Top POI nghe nhiều nhất
IF OBJECT_ID('SP_GetTopPois', 'P') IS NOT NULL DROP PROCEDURE SP_GetTopPois;
GO
CREATE PROCEDURE SP_GetTopPois
    @TopN     INT      = 10,
    @FromDate DATETIME = NULL,
    @ToDate   DATETIME = NULL,
    @LangCode NVARCHAR(10) = 'vi'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@TopN)
        p.PoiId,
        pc.Title,
        COUNT(lh.HistoryId)                 AS ListenCount,
        AVG(CAST(lh.ListenDuration AS FLOAT)) AS AvgDurationSeconds,
        SUM(lh.ListenDuration)              AS TotalDurationSeconds
    FROM [Poi] p
    JOIN [PoiContent] pc ON p.PoiId = pc.PoiId AND pc.LanguageCode = @LangCode
    LEFT JOIN [ListenHistory] lh
        ON p.PoiId = lh.PoiId
        AND (@FromDate IS NULL OR lh.[Timestamp] >= @FromDate)
        AND (@ToDate   IS NULL OR lh.[Timestamp] <= @ToDate)
    WHERE p.Status = 'active'
    GROUP BY p.PoiId, pc.Title
    ORDER BY ListenCount DESC;
END
GO

-- Dữ liệu heatmap vị trí
IF OBJECT_ID('SP_GetHeatmapData', 'P') IS NOT NULL DROP PROCEDURE SP_GetHeatmapData;
GO
CREATE PROCEDURE SP_GetHeatmapData
    @FromDate DATETIME = NULL,
    @ToDate   DATETIME = NULL,
    @GridSize FLOAT    = 0.0001
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ROUND(Latitude  / @GridSize, 0) * @GridSize AS LatBucket,
        ROUND(Longitude / @GridSize, 0) * @GridSize AS LonBucket,
        COUNT(*)                                     AS PointCount
    FROM [LocationLog]
    WHERE
        (@FromDate IS NULL OR [Timestamp] >= @FromDate) AND
        (@ToDate   IS NULL OR [Timestamp] <= @ToDate)
    GROUP BY
        ROUND(Latitude  / @GridSize, 0) * @GridSize,
        ROUND(Longitude / @GridSize, 0) * @GridSize
    ORDER BY PointCount DESC;
END
GO

-- Thống kê cho 1 POI
IF OBJECT_ID('SP_GetPoiListenStats', 'P') IS NOT NULL DROP PROCEDURE SP_GetPoiListenStats;
GO
CREATE PROCEDURE SP_GetPoiListenStats
    @PoiId    NVARCHAR(255),
    @FromDate DATETIME = NULL,
    @ToDate   DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        @PoiId                              AS PoiId,
        COUNT(HistoryId)                    AS TotalListens,
        COUNT(DISTINCT DeviceId)            AS UniqueDevices,
        AVG(CAST(ListenDuration AS FLOAT))  AS AvgDurationSeconds,
        MIN([Timestamp])                    AS FirstListen,
        MAX([Timestamp])                    AS LastListen
    FROM [ListenHistory]
    WHERE PoiId = @PoiId
      AND (@FromDate IS NULL OR [Timestamp] >= @FromDate)
      AND (@ToDate   IS NULL OR [Timestamp] <= @ToDate);
END
GO

PRINT '== AudioGo schema setup complete ==';
