CREATE TABLE [Account] (
  [AccountId] nvarchar(255) PRIMARY KEY,
  [Username] nvarchar(255),
  [PasswordHash] nvarchar(255),
  [Role] nvarchar(255),
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [Poi] (
  [PoiId] nvarchar(255) PRIMARY KEY,
  [AccountId] nvarchar(255),
  [Latitude] float,
  [Longitude] float,
  [ActivationRadius] int,
  [Priority] int,
  [Status] nvarchar(255),
  [LogoUrl] nvarchar(255),
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [PoiContent] (
  [ContentId] nvarchar(255) PRIMARY KEY,
  [PoiId] nvarchar(255),
  [LanguageCode] nvarchar(255),
  [Title] nvarchar(255),
  [Description] nvarchar(max),
  [AudioUrl] nvarchar(255),
  [LocalAudioPath] nvarchar(255),
  [IsMaster] bit,
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [PoiGallery] (
  [ImageId] nvarchar(255) PRIMARY KEY,
  [PoiId] nvarchar(255),
  [ImageUrl] nvarchar(255),
  [SortOrder] int,
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [Category] (
  [CategoryId] nvarchar(255) PRIMARY KEY,
  [Name] nvarchar(255),
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [CategoryPoi] (
  [CategoryId] nvarchar(255),
  [PoiId] nvarchar(255),
  PRIMARY KEY ([CategoryId], [PoiId])
)
GO

CREATE TABLE [Tour] (
  [TourId] nvarchar(255) PRIMARY KEY,
  [Name] nvarchar(255),
  [Description] nvarchar(max),
  [CreatedAt] datetime DEFAULT (GETDATE()),
  [UpdatedAt] datetime
)
GO

CREATE TABLE [TourPoi] (
  [TourId] nvarchar(255),
  [PoiId] nvarchar(255),
  [StepOrder] int,
  PRIMARY KEY ([TourId], [PoiId])
)
GO

CREATE TABLE [ListenHistory] (
  [HistoryId] nvarchar(255) PRIMARY KEY,
  [DeviceId] nvarchar(255),
  [PoiId] nvarchar(255),
  [Timestamp] datetime DEFAULT (GETDATE()),
  [ListenDuration] int
)
GO

CREATE TABLE [LocationLog] (
  [LocationId] nvarchar(255) PRIMARY KEY,
  [DeviceId] nvarchar(255),
  [Latitude] float,
  [Longitude] float,
  [Timestamp] datetime DEFAULT (GETDATE())
)
GO

ALTER TABLE [Poi] ADD FOREIGN KEY ([AccountId]) REFERENCES [Account] ([AccountId])
GO

ALTER TABLE [PoiContent] ADD FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
GO

ALTER TABLE [PoiGallery] ADD FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
GO

ALTER TABLE [CategoryPoi] ADD FOREIGN KEY ([CategoryId]) REFERENCES [Category] ([CategoryId])
GO

ALTER TABLE [CategoryPoi] ADD FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
GO

ALTER TABLE [TourPoi] ADD FOREIGN KEY ([TourId]) REFERENCES [Tour] ([TourId])
GO

ALTER TABLE [TourPoi] ADD FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
GO

ALTER TABLE [ListenHistory] ADD FOREIGN KEY ([PoiId]) REFERENCES [Poi] ([PoiId])
GO

-- ==================== CONSTRAINTS ====================

-- Unique constraint on username
ALTER TABLE [Account] ADD CONSTRAINT [UQ_Account_Username] UNIQUE ([Username])
GO

-- Not null constraints
ALTER TABLE [Account] ALTER COLUMN [AccountId] nvarchar(255) NOT NULL
ALTER TABLE [Account] ALTER COLUMN [Username] nvarchar(255) NOT NULL
ALTER TABLE [Account] ALTER COLUMN [PasswordHash] nvarchar(255) NOT NULL
GO

ALTER TABLE [Poi] ALTER COLUMN [PoiId] nvarchar(255) NOT NULL
ALTER TABLE [Poi] ALTER COLUMN [AccountId] nvarchar(255) NOT NULL
GO

ALTER TABLE [PoiContent] ALTER COLUMN [ContentId] nvarchar(255) NOT NULL
ALTER TABLE [PoiContent] ALTER COLUMN [PoiId] nvarchar(255) NOT NULL
ALTER TABLE [PoiContent] ALTER COLUMN [LanguageCode] nvarchar(255) NOT NULL
ALTER TABLE [PoiContent] ALTER COLUMN [Title] nvarchar(255) NOT NULL
GO

ALTER TABLE [PoiGallery] ALTER COLUMN [ImageId] nvarchar(255) NOT NULL
ALTER TABLE [PoiGallery] ALTER COLUMN [PoiId] nvarchar(255) NOT NULL
GO

ALTER TABLE [Category] ALTER COLUMN [CategoryId] nvarchar(255) NOT NULL
ALTER TABLE [Category] ALTER COLUMN [Name] nvarchar(255) NOT NULL
GO

ALTER TABLE [Tour] ALTER COLUMN [TourId] nvarchar(255) NOT NULL
ALTER TABLE [Tour] ALTER COLUMN [Name] nvarchar(255) NOT NULL
GO

ALTER TABLE [ListenHistory] ALTER COLUMN [HistoryId] nvarchar(255) NOT NULL
ALTER TABLE [ListenHistory] ALTER COLUMN [DeviceId] nvarchar(255) NOT NULL
ALTER TABLE [ListenHistory] ALTER COLUMN [PoiId] nvarchar(255) NOT NULL
GO

ALTER TABLE [LocationLog] ALTER COLUMN [LocationId] nvarchar(255) NOT NULL
ALTER TABLE [LocationLog] ALTER COLUMN [DeviceId] nvarchar(255) NOT NULL
GO

-- ==================== INDEXES ====================

-- Poi table indexes
CREATE INDEX [IX_Poi_AccountId] ON [Poi] ([AccountId])
GO

CREATE INDEX [IX_Poi_Status] ON [Poi] ([Status])
GO

-- PoiContent table indexes
CREATE INDEX [IX_PoiContent_PoiId] ON [PoiContent] ([PoiId])
GO

CREATE INDEX [IX_PoiContent_LanguageCode] ON [PoiContent] ([LanguageCode])
GO

-- PoiGallery table indexes
CREATE INDEX [IX_PoiGallery_PoiId] ON [PoiGallery] ([PoiId])
GO

-- ListenHistory table indexes
CREATE INDEX [IX_ListenHistory_DeviceId] ON [ListenHistory] ([DeviceId])
GO

CREATE INDEX [IX_ListenHistory_PoiId] ON [ListenHistory] ([PoiId])
GO

CREATE INDEX [IX_ListenHistory_Timestamp] ON [ListenHistory] ([Timestamp])
GO

-- LocationLog table indexes
CREATE INDEX [IX_LocationLog_DeviceId] ON [LocationLog] ([DeviceId])
GO

CREATE INDEX [IX_LocationLog_Timestamp] ON [LocationLog] ([Timestamp])
GO

-- Composite indexes for common queries
CREATE INDEX [IX_ListenHistory_DeviceId_Timestamp] ON [ListenHistory] ([DeviceId], [Timestamp])
GO

CREATE INDEX [IX_LocationLog_DeviceId_Timestamp] ON [LocationLog] ([DeviceId], [Timestamp])
GO
