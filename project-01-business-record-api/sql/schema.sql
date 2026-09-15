-- Project 1: Business Record API
-- Based on the READ-ONLY Week 1 curriculum scaffold, completed with explicit integrity checks.
-- Run only against an isolated Week 1 lab database/schema. Never production.

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

    CONSTRAINT CK_BusinessRequests_RequestNumber_NotBlank
        CHECK (LEN(LTRIM(RTRIM(RequestNumber))) > 0),
    CONSTRAINT CK_BusinessRequests_RequestType
        CHECK (RequestType IN ('PURCHASE','PRICING','INVENTORY','OPERATIONS')),
    CONSTRAINT CK_BusinessRequests_Title_Length
        CHECK (LEN(LTRIM(RTRIM(Title))) BETWEEN 5 AND 200),
    CONSTRAINT CK_BusinessRequests_Priority
        CHECK (Priority IN ('LOW','NORMAL','HIGH','URGENT')),
    CONSTRAINT CK_BusinessRequests_Status
        CHECK (Status IN ('OPEN','ON_HOLD','CLOSED')),
    CONSTRAINT CK_BusinessRequests_OwnerCode_NotBlank
        CHECK (LEN(LTRIM(RTRIM(OwnerCode))) > 0)
);

CREATE TABLE dbo.BusinessRequestLines (
    LineId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    RequestId UNIQUEIDENTIFIER NOT NULL,
    LineNumber INT NOT NULL,
    ItemCode NVARCHAR(60) NOT NULL,
    Description NVARCHAR(300) NOT NULL,
    Quantity DECIMAL(18,3) NOT NULL,
    Unit NVARCHAR(10) NOT NULL,

    CONSTRAINT FK_BusinessRequestLines_Request
        FOREIGN KEY (RequestId) REFERENCES dbo.BusinessRequests(RequestId),
    CONSTRAINT UQ_BusinessRequestLines_Request_Line
        UNIQUE (RequestId, LineNumber),
    CONSTRAINT CK_BusinessRequestLines_LineNumber
        CHECK (LineNumber > 0),
    CONSTRAINT CK_BusinessRequestLines_ItemCode_NotBlank
        CHECK (LEN(LTRIM(RTRIM(ItemCode))) > 0),
    CONSTRAINT CK_BusinessRequestLines_Description_NotBlank
        CHECK (LEN(LTRIM(RTRIM(Description))) > 0),
    CONSTRAINT CK_BusinessRequestLines_Quantity
        CHECK (Quantity > 0),
    CONSTRAINT CK_BusinessRequestLines_Unit
        CHECK (Unit IN ('EA','CS','LB','KG'))
);
