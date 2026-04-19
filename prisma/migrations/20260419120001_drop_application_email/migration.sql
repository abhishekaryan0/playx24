-- Revert optional email column if it was added for mail feature
ALTER TABLE "Application" DROP COLUMN IF EXISTS "email";
