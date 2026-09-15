-- Project 1 / Build Unit 1.1 verification
-- Run only after schema.sql in an isolated Week 1 lab database.
-- This script intentionally attempts invalid writes and rolls back its test data.

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @RequestId UNIQUEIDENTIFIER = NEWID();
DECLARE @LineId UNIQUEIDENTIFIER = NEWID();

BEGIN TRANSACTION;

-- Positive: valid parent row.
INSERT INTO dbo.BusinessRequests (
    RequestId, RequestNumber, RequestType, Title, Description,
    Priority, Status, OwnerCode, CreatedAtUtc, UpdatedAtUtc
)
VALUES (
    @RequestId, N'BR-VERIFY-0001', N'PURCHASE', N'Valid verification request', NULL,
    N'NORMAL', N'OPEN', N'LAB-USER-01', SYSUTCDATETIME(), SYSUTCDATETIME()
);

-- Positive: valid child row.
INSERT INTO dbo.BusinessRequestLines (
    LineId, RequestId, LineNumber, ItemCode, Description, Quantity, Unit
)
VALUES (
    @LineId, @RequestId, 1, N'SKU-VERIFY', N'Valid verification line', 1.000, N'EA'
);

IF NOT EXISTS (
    SELECT 1
    FROM dbo.BusinessRequests r
    JOIN dbo.BusinessRequestLines l ON l.RequestId = r.RequestId
    WHERE r.RequestId = @RequestId AND l.LineId = @LineId
)
    THROW 51000, 'Positive parent/child verification failed.', 1;

-- Negative: duplicate request number must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequests (
        RequestId, RequestNumber, RequestType, Title, Description,
        Priority, Status, OwnerCode, CreatedAtUtc, UpdatedAtUtc
    )
    VALUES (
        NEWID(), N'BR-VERIFY-0001', N'PURCHASE', N'Duplicate request number', NULL,
        N'NORMAL', N'OPEN', N'LAB-USER-01', SYSUTCDATETIME(), SYSUTCDATETIME()
    );
    THROW 51001, 'Expected duplicate request number rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51001 THROW;
END CATCH;

-- Negative: missing parent FK must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequestLines (
        LineId, RequestId, LineNumber, ItemCode, Description, Quantity, Unit
    )
    VALUES (
        NEWID(), NEWID(), 1, N'SKU-X', N'Missing parent test', 1.000, N'EA'
    );
    THROW 51002, 'Expected missing-parent FK rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51002 THROW;
END CATCH;

-- Negative: duplicate line number within one request must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequestLines (
        LineId, RequestId, LineNumber, ItemCode, Description, Quantity, Unit
    )
    VALUES (
        NEWID(), @RequestId, 1, N'SKU-DUP', N'Duplicate line number', 1.000, N'EA'
    );
    THROW 51003, 'Expected duplicate line-number rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51003 THROW;
END CATCH;

-- Negative: zero quantity must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequestLines (
        LineId, RequestId, LineNumber, ItemCode, Description, Quantity, Unit
    )
    VALUES (
        NEWID(), @RequestId, 2, N'SKU-ZERO', N'Zero quantity', 0.000, N'EA'
    );
    THROW 51004, 'Expected zero-quantity rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51004 THROW;
END CATCH;

-- Negative: invalid unit must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequestLines (
        LineId, RequestId, LineNumber, ItemCode, Description, Quantity, Unit
    )
    VALUES (
        NEWID(), @RequestId, 3, N'SKU-BADUNIT', N'Invalid unit', 1.000, N'INVALID'
    );
    THROW 51005, 'Expected invalid-unit rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51005 THROW;
END CATCH;

-- Negative: invalid request type must fail.
BEGIN TRY
    INSERT INTO dbo.BusinessRequests (
        RequestId, RequestNumber, RequestType, Title, Description,
        Priority, Status, OwnerCode, CreatedAtUtc, UpdatedAtUtc
    )
    VALUES (
        NEWID(), N'BR-VERIFY-BADTYPE', N'INVALID', N'Invalid request type test', NULL,
        N'NORMAL', N'OPEN', N'LAB-USER-01', SYSUTCDATETIME(), SYSUTCDATETIME()
    );
    THROW 51006, 'Expected invalid request-type rejection did not occur.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51006 THROW;
END CATCH;

SELECT
    'PASS' AS VerificationStatus,
    'PK/FK/unique/check constraints behaved as expected inside rolled-back verification transaction.' AS Result;

ROLLBACK TRANSACTION;
