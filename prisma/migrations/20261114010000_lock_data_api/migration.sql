-- The app talks to Postgres directly (Prisma) as the table owner, which bypasses RLS.
-- On Supabase, the `public` schema is also exposed through the Data API (anon / authenticated roles).
-- Enable RLS on every table with no policies, and revoke those roles' privileges, so nothing is
-- readable or writable through the public API. Harmless on plain PostgreSQL.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_request_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
    END IF;
  END LOOP;
END $$;
