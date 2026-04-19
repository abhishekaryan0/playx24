-- Pending review uses PENDING (legacy SUBMITTED treated the same in app)
UPDATE "Application" SET status = 'PENDING' WHERE status = 'SUBMITTED';
