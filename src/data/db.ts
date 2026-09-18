import sql from 'mssql';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
  if (connectionString) {
    if (!poolPromise) poolPromise = new sql.ConnectionPool(connectionString).connect();
    return poolPromise;
  }

  const server = process.env.AZURE_SQL_SERVER;
  const database = process.env.AZURE_SQL_DATABASE;
  const clientId = process.env.AZURE_SQL_CLIENT_ID;
  if (!server || !database) {
    throw new Error('Azure SQL is not configured. Set AZURE_SQL_CONNECTION_STRING or AZURE_SQL_SERVER + AZURE_SQL_DATABASE.');
  }

  const authOptions: Record<string, string> = {};
  if (clientId) authOptions.clientId = clientId;

  const config: any = {
    server,
    database,
    options: { encrypt: true, trustServerCertificate: false },
    authentication: { type: 'azure-active-directory-msi-app-service', options: authOptions },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
  if (!poolPromise) poolPromise = new sql.ConnectionPool(config).connect();
  return poolPromise;
}

export async function ensureSchema(): Promise<void> {
  const pool = await getPool();
  await pool.request().query(`
IF OBJECT_ID('dbo.BusinessRequests','U') IS NULL
BEGIN
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
    UpdatedAtUtc DATETIME2(3) NOT NULL,
    CONSTRAINT CK_BusinessRequests_RequestType CHECK (RequestType IN ('PURCHASE','PRICING','INVENTORY','OPERATIONS')),
    CONSTRAINT CK_BusinessRequests_Priority CHECK (Priority IN ('LOW','NORMAL','HIGH','URGENT')),
    CONSTRAINT CK_BusinessRequests_Status CHECK (Status IN ('OPEN','ON_HOLD','CLOSED')),
    CONSTRAINT CK_BusinessRequests_Title CHECK (LEN(Title) BETWEEN 5 AND 200)
  );
END;

IF OBJECT_ID('dbo.BusinessRequestLines','U') IS NULL
BEGIN
  CREATE TABLE dbo.BusinessRequestLines (
    LineId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    RequestId UNIQUEIDENTIFIER NOT NULL,
    LineNumber INT NOT NULL,
    ItemCode NVARCHAR(60) NOT NULL,
    Description NVARCHAR(300) NOT NULL,
    Quantity DECIMAL(18,3) NOT NULL,
    Unit NVARCHAR(10) NOT NULL,
    CONSTRAINT FK_BusinessRequestLines_Request FOREIGN KEY (RequestId) REFERENCES dbo.BusinessRequests(RequestId),
    CONSTRAINT UQ_BusinessRequestLines_Request_Line UNIQUE (RequestId, LineNumber),
    CONSTRAINT CK_BusinessRequestLines_LineNumber CHECK (LineNumber > 0),
    CONSTRAINT CK_BusinessRequestLines_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_BusinessRequestLines_Unit CHECK (Unit IN ('EA','CS','LB','KG'))
  );
END;

IF OBJECT_ID('dbo.WorkflowDefinitions','U') IS NULL
BEGIN
  CREATE TABLE dbo.WorkflowDefinitions (
    DefinitionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    DefinitionKey NVARCHAR(80) NOT NULL,
    Version INT NOT NULL,
    DisplayName NVARCHAR(150) NOT NULL,
    InitialStateKey NVARCHAR(80) NOT NULL,
    CONSTRAINT UQ_WorkflowDefinitions_KeyVersion UNIQUE (DefinitionKey, Version)
  );
  CREATE TABLE dbo.WorkflowStates (
    StateId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    DefinitionId UNIQUEIDENTIFIER NOT NULL,
    StateKey NVARCHAR(80) NOT NULL,
    IsTerminal BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_WorkflowStates_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId),
    CONSTRAINT UQ_WorkflowStates_DefinitionState UNIQUE (DefinitionId, StateKey)
  );
  CREATE TABLE dbo.WorkflowTransitions (
    TransitionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    DefinitionId UNIQUEIDENTIFIER NOT NULL,
    TransitionKey NVARCHAR(80) NOT NULL,
    FromStateKey NVARCHAR(80) NOT NULL,
    ToStateKey NVARCHAR(80) NOT NULL,
    CONSTRAINT FK_WorkflowTransitions_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId),
    CONSTRAINT UQ_WorkflowTransitions UNIQUE (DefinitionId, TransitionKey, FromStateKey)
  );
  CREATE TABLE dbo.WorkflowInstances (
    InstanceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    DefinitionId UNIQUEIDENTIFIER NOT NULL,
    CurrentStateKey NVARCHAR(80) NOT NULL,
    Revision BIGINT NOT NULL DEFAULT 0,
    CreatedAtUtc DATETIME2(3) NOT NULL,
    UpdatedAtUtc DATETIME2(3) NOT NULL,
    CONSTRAINT FK_WorkflowInstances_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId)
  );
  CREATE TABLE dbo.WorkflowTransitionHistory (
    HistoryId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    InstanceId UNIQUEIDENTIFIER NOT NULL,
    TransitionKey NVARCHAR(80) NOT NULL,
    FromStateKey NVARCHAR(80) NOT NULL,
    ToStateKey NVARCHAR(80) NOT NULL,
    ActorRef NVARCHAR(120) NOT NULL,
    Reason NVARCHAR(500) NULL,
    OccurredAtUtc DATETIME2(3) NOT NULL,
    CONSTRAINT FK_WorkflowHistory_Instance FOREIGN KEY (InstanceId) REFERENCES dbo.WorkflowInstances(InstanceId)
  );
END;

IF OBJECT_ID('dbo.EvidenceItems','U') IS NULL
BEGIN
  CREATE TABLE dbo.EvidenceItems (
    EvidenceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EntityType NVARCHAR(80) NOT NULL,
    EntityId NVARCHAR(120) NOT NULL,
    OriginalFilename NVARCHAR(260) NOT NULL,
    ContentType NVARCHAR(150) NOT NULL,
    ByteLength BIGINT NOT NULL,
    Sha256Hex CHAR(64) NOT NULL,
    BlobContainer NVARCHAR(120) NOT NULL,
    BlobName NVARCHAR(500) NOT NULL UNIQUE,
    SourceRef NVARCHAR(120) NULL,
    UploadedAtUtc DATETIME2(3) NOT NULL,
    CONSTRAINT CK_EvidenceItems_ByteLength CHECK (ByteLength > 0)
  );
  CREATE INDEX IX_EvidenceItems_Entity ON dbo.EvidenceItems(EntityType, EntityId, UploadedAtUtc);
  CREATE INDEX IX_EvidenceItems_Hash ON dbo.EvidenceItems(Sha256Hex);
END;

IF OBJECT_ID('dbo.IdempotencyRecords','U') IS NULL
BEGIN
  CREATE TABLE dbo.IdempotencyRecords (
    IdempotencyKey NVARCHAR(160) NOT NULL PRIMARY KEY,
    RequestFingerprint CHAR(64) NOT NULL,
    ProcessingStatus NVARCHAR(20) NOT NULL,
    ResultReference NVARCHAR(160) NULL,
    HttpStatus INT NULL,
    ResponseJson NVARCHAR(MAX) NULL,
    CreatedAtUtc DATETIME2(3) NOT NULL,
    CompletedAtUtc DATETIME2(3) NULL,
    CONSTRAINT CK_IdempotencyRecords_Status CHECK (ProcessingStatus IN ('PROCESSING','COMPLETED','FAILED'))
  );
  CREATE TABLE dbo.InventoryAdjustments (
    AdjustmentId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    IdempotencyKey NVARCHAR(160) NOT NULL UNIQUE,
    Sku NVARCHAR(60) NOT NULL,
    Warehouse NVARCHAR(30) NOT NULL,
    QuantityDelta DECIMAL(18,3) NOT NULL,
    Reason NVARCHAR(80) NOT NULL,
    CreatedAtUtc DATETIME2(3) NOT NULL,
    CONSTRAINT FK_InventoryAdjustments_Idempotency FOREIGN KEY (IdempotencyKey) REFERENCES dbo.IdempotencyRecords(IdempotencyKey),
    CONSTRAINT CK_InventoryAdjustments_NonZero CHECK (QuantityDelta <> 0)
  );
END;
`);

  await seedWorkflows(pool);
}

async function seedWorkflows(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().query(`
DECLARE @d UNIQUEIDENTIFIER;

IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowDefinitions WHERE DefinitionKey='APPROVAL' AND Version=1)
BEGIN
  SET @d=NEWID();
  INSERT dbo.WorkflowDefinitions VALUES(@d,'APPROVAL',1,'Approval','DRAFT');
  INSERT dbo.WorkflowStates VALUES
    (NEWID(),@d,'DRAFT',0),(NEWID(),@d,'SUBMITTED',0),(NEWID(),@d,'APPROVED',0),(NEWID(),@d,'REJECTED',0),(NEWID(),@d,'COMPLETED',1);
  INSERT dbo.WorkflowTransitions VALUES
    (NEWID(),@d,'SUBMIT','DRAFT','SUBMITTED'),
    (NEWID(),@d,'APPROVE','SUBMITTED','APPROVED'),
    (NEWID(),@d,'REJECT','SUBMITTED','REJECTED'),
    (NEWID(),@d,'COMPLETE','APPROVED','COMPLETED'),
    (NEWID(),@d,'COMPLETE','REJECTED','COMPLETED');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowDefinitions WHERE DefinitionKey='ISSUE_RESOLUTION' AND Version=1)
BEGIN
  SET @d=NEWID();
  INSERT dbo.WorkflowDefinitions VALUES(@d,'ISSUE_RESOLUTION',1,'Issue Resolution','OPEN');
  INSERT dbo.WorkflowStates VALUES
    (NEWID(),@d,'OPEN',0),(NEWID(),@d,'INVESTIGATING',0),(NEWID(),@d,'RESOLVED',0),(NEWID(),@d,'CLOSED',1);
  INSERT dbo.WorkflowTransitions VALUES
    (NEWID(),@d,'INVESTIGATE','OPEN','INVESTIGATING'),
    (NEWID(),@d,'REOPEN_TRIAGE','INVESTIGATING','OPEN'),
    (NEWID(),@d,'RESOLVE','INVESTIGATING','RESOLVED'),
    (NEWID(),@d,'CLOSE','RESOLVED','CLOSED');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowDefinitions WHERE DefinitionKey='DOCUMENT_REVIEW' AND Version=1)
BEGIN
  SET @d=NEWID();
  INSERT dbo.WorkflowDefinitions VALUES(@d,'DOCUMENT_REVIEW',1,'Document Review','RECEIVED');
  INSERT dbo.WorkflowStates VALUES
    (NEWID(),@d,'RECEIVED',0),(NEWID(),@d,'REVIEWING',0),(NEWID(),@d,'ACCEPTED',1),(NEWID(),@d,'REJECTED',0);
  INSERT dbo.WorkflowTransitions VALUES
    (NEWID(),@d,'START_REVIEW','RECEIVED','REVIEWING'),
    (NEWID(),@d,'ACCEPT','REVIEWING','ACCEPTED'),
    (NEWID(),@d,'REJECT','REVIEWING','REJECTED'),
    (NEWID(),@d,'RESUBMIT','REJECTED','REVIEWING');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowDefinitions WHERE DefinitionKey='RELEASE_LIFECYCLE' AND Version=1)
BEGIN
  SET @d=NEWID();
  INSERT dbo.WorkflowDefinitions VALUES(@d,'RELEASE_LIFECYCLE',1,'Release Lifecycle','DRAFT');
  INSERT dbo.WorkflowStates VALUES
    (NEWID(),@d,'DRAFT',0),(NEWID(),@d,'PUBLISHED',0),(NEWID(),@d,'ARCHIVED',1);
  INSERT dbo.WorkflowTransitions VALUES
    (NEWID(),@d,'PUBLISH','DRAFT','PUBLISHED'),
    (NEWID(),@d,'ARCHIVE','PUBLISHED','ARCHIVED');
END;
`);
}
