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
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    authentication: {
      type: 'azure-active-directory-msi-app-service',
      options: authOptions
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000
    }
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
END;`);
}
