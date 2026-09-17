-- Week 1 Project 1 Azure SQL schema. The running API also applies this idempotently at startup.
CREATE TABLE dbo.BusinessRequests (
  RequestId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
  RequestNumber NVARCHAR(40) NOT NULL UNIQUE,
  RequestType NVARCHAR(30) NOT NULL,
  Title NVARCHAR(200) NOT NULL,
  Description NVARCHAR(2000) NULL,
  Priority NVARCHAR(20) NOT NULL,
  Status NVARCHAR(20) NOT NULL,
  OwnerCode NVARCHAR(50) NOT NULL,
  CreatedAtUtc DATETIME2(3) NOT NULL,
  UpdatedAtUtc DATETIME2(3) NOT NULL
);
CREATE TABLE dbo.BusinessRequestLines (
  LineId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
  RequestId UNIQUEIDENTIFIER NOT NULL,
  LineNumber INT NOT NULL,
  ItemCode NVARCHAR(60) NOT NULL,
  Description NVARCHAR(300) NOT NULL,
  Quantity DECIMAL(18,3) NOT NULL,
  Unit NVARCHAR(10) NOT NULL,
  CONSTRAINT FK_BusinessRequestLines_Request FOREIGN KEY (RequestId) REFERENCES dbo.BusinessRequests(RequestId),
  CONSTRAINT UQ_BusinessRequestLines_Request_Line UNIQUE (RequestId, LineNumber)
);
