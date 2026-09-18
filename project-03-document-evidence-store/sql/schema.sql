CREATE TABLE dbo.EvidenceItems (
 EvidenceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
 EntityType NVARCHAR(80) NOT NULL, EntityId NVARCHAR(120) NOT NULL,
 OriginalFilename NVARCHAR(260) NOT NULL, ContentType NVARCHAR(150) NOT NULL,
 ByteLength BIGINT NOT NULL, Sha256Hex CHAR(64) NOT NULL,
 BlobContainer NVARCHAR(120) NOT NULL, BlobName NVARCHAR(500) NOT NULL UNIQUE,
 SourceRef NVARCHAR(120) NULL, UploadedAtUtc DATETIME2(3) NOT NULL,
 CONSTRAINT CK_EvidenceItems_ByteLength CHECK (ByteLength > 0)
);
CREATE INDEX IX_EvidenceItems_Entity ON dbo.EvidenceItems(EntityType,EntityId,UploadedAtUtc);
CREATE INDEX IX_EvidenceItems_Hash ON dbo.EvidenceItems(Sha256Hex);
