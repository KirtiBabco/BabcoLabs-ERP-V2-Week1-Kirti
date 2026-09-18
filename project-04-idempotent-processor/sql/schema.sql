CREATE TABLE dbo.IdempotencyRecords (
 IdempotencyKey NVARCHAR(160) NOT NULL PRIMARY KEY,
 RequestFingerprint CHAR(64) NOT NULL, ProcessingStatus NVARCHAR(20) NOT NULL,
 ResultReference NVARCHAR(160) NULL, HttpStatus INT NULL, ResponseJson NVARCHAR(MAX) NULL,
 CreatedAtUtc DATETIME2(3) NOT NULL, CompletedAtUtc DATETIME2(3) NULL,
 CONSTRAINT CK_IdempotencyRecords_Status CHECK (ProcessingStatus IN ('PROCESSING','COMPLETED','FAILED'))
);
CREATE TABLE dbo.InventoryAdjustments (
 AdjustmentId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
 IdempotencyKey NVARCHAR(160) NOT NULL UNIQUE, Sku NVARCHAR(60) NOT NULL,
 Warehouse NVARCHAR(30) NOT NULL, QuantityDelta DECIMAL(18,3) NOT NULL,
 Reason NVARCHAR(80) NOT NULL, CreatedAtUtc DATETIME2(3) NOT NULL,
 CONSTRAINT FK_InventoryAdjustments_Idempotency FOREIGN KEY (IdempotencyKey) REFERENCES dbo.IdempotencyRecords(IdempotencyKey),
 CONSTRAINT CK_InventoryAdjustments_NonZero CHECK (QuantityDelta <> 0)
);
