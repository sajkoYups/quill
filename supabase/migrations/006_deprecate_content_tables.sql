-- Local-first security: user content (chats, messages, screenshots, documents)
-- now lives only in the encrypted on-device vault and is never persisted server-side.
-- These tables are DEPRECATED. We intentionally do NOT drop them yet so the change
-- can be rolled back and any residual rows can be purged deliberately (see below).
--
-- Only usage_logs, users, guest_devices, subscriptions and waitlist remain in use.

COMMENT ON TABLE public.chats IS
  'DEPRECATED (migration 006): chat content is stored in the on-device encrypted vault, not the database.';
COMMENT ON TABLE public.messages IS
  'DEPRECATED (migration 006): message content is stored in the on-device encrypted vault, not the database.';
COMMENT ON TABLE public.screenshots IS
  'DEPRECATED (migration 006): screenshots are stored in the on-device encrypted vault, not the database.';
COMMENT ON TABLE public.documents IS
  'DEPRECATED (migration 006): documents are stored in the on-device encrypted vault, not the database.';
COMMENT ON TABLE public.document_chunks IS
  'DEPRECATED (migration 006): document chunks are stored in the on-device encrypted vault, not the database.';

-- One-time purge of existing content. Commented out by default: review, back up if
-- needed, then run manually (or via the admin cleanup task). ON DELETE CASCADE on the
-- child tables means deleting chats also removes messages/screenshots/documents/chunks.
--
--   DELETE FROM public.chats;
--
-- Storage objects (Supabase Storage buckets "screenshots" and "documents") are not
-- removed by SQL; purge them out-of-band with the storage admin API if required.
