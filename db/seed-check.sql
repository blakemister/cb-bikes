-- Idempotent seed check: skip init.sql if data already exists
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'CBBikes')
BEGIN
    PRINT 'CBBikes database not found — run init.sql first.'
END
ELSE
BEGIN
    USE CBBikes;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Customer')
       AND (SELECT COUNT(*) FROM Customer) > 0
    BEGIN
        PRINT 'Database already seeded — skipping.'
    END
    ELSE
    BEGIN
        PRINT 'Database exists but is empty — run init.sql to seed.'
    END
END
GO
