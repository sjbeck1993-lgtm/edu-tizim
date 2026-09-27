-- Data backfill: assign every existing row to one default Tenant
-- (Sardorbek's existing Smart Learning Center), so the app keeps working
-- exactly as before while the multi-tenant columns are being introduced.
-- Idempotent: safe to run more than once, and safe if tenantId is
-- already set on some rows (only fills in NULLs).
DO $$
DECLARE
    default_tenant_id INTEGER;
BEGIN
    SELECT "id" INTO default_tenant_id FROM "Tenant" WHERE "slug" = 'smart-learning-center';

    IF default_tenant_id IS NULL THEN
        INSERT INTO "Tenant" ("name", "slug", "isActive")
        VALUES ('Smart Learning Center', 'smart-learning-center', true)
        RETURNING "id" INTO default_tenant_id;
    END IF;

    UPDATE "User" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Course" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Group" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Lead" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Payment" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Debt" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Attendance" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Task" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
    UPDATE "Material" SET "tenantId" = default_tenant_id WHERE "tenantId" IS NULL;
END $$;
