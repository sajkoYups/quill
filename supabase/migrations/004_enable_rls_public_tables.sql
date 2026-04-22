-- Enable RLS on all public tables flagged by Supabase advisors.
-- Service role remains operational (bypasses RLS), while authenticated users
-- get least-privilege access to rows they own.

ALTER TABLE public.guest_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- users: each authenticated user can only read/update their own public user row.
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- subscriptions: each authenticated user can read/manage their own subscription.
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
CREATE POLICY subscriptions_insert_own
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
CREATE POLICY subscriptions_update_own
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS subscriptions_delete_own ON public.subscriptions;
CREATE POLICY subscriptions_delete_own
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- settings: owner_type=user rows are accessible to the matching auth user.
DROP POLICY IF EXISTS settings_select_own_user ON public.settings;
CREATE POLICY settings_select_own_user
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS settings_insert_own_user ON public.settings;
CREATE POLICY settings_insert_own_user
  ON public.settings
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS settings_update_own_user ON public.settings;
CREATE POLICY settings_update_own_user
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text)
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS settings_delete_own_user ON public.settings;
CREATE POLICY settings_delete_own_user
  ON public.settings
  FOR DELETE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

-- chats: owner_type=user chats are scoped to the authenticated owner.
DROP POLICY IF EXISTS chats_select_own_user ON public.chats;
CREATE POLICY chats_select_own_user
  ON public.chats
  FOR SELECT
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS chats_insert_own_user ON public.chats;
CREATE POLICY chats_insert_own_user
  ON public.chats
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS chats_update_own_user ON public.chats;
CREATE POLICY chats_update_own_user
  ON public.chats
  FOR UPDATE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text)
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS chats_delete_own_user ON public.chats;
CREATE POLICY chats_delete_own_user
  ON public.chats
  FOR DELETE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

-- messages: access is derived from a chat owned by the authenticated user.
DROP POLICY IF EXISTS messages_select_own_user_chat ON public.messages;
CREATE POLICY messages_select_own_user_chat
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS messages_insert_own_user_chat ON public.messages;
CREATE POLICY messages_insert_own_user_chat
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS messages_update_own_user_chat ON public.messages;
CREATE POLICY messages_update_own_user_chat
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS messages_delete_own_user_chat ON public.messages;
CREATE POLICY messages_delete_own_user_chat
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

-- screenshots: access is derived from a chat owned by the authenticated user.
DROP POLICY IF EXISTS screenshots_select_own_user_chat ON public.screenshots;
CREATE POLICY screenshots_select_own_user_chat
  ON public.screenshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = screenshots.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS screenshots_insert_own_user_chat ON public.screenshots;
CREATE POLICY screenshots_insert_own_user_chat
  ON public.screenshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = screenshots.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS screenshots_update_own_user_chat ON public.screenshots;
CREATE POLICY screenshots_update_own_user_chat
  ON public.screenshots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = screenshots.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = screenshots.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS screenshots_delete_own_user_chat ON public.screenshots;
CREATE POLICY screenshots_delete_own_user_chat
  ON public.screenshots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = screenshots.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

-- usage_logs: user-owned logs only.
DROP POLICY IF EXISTS usage_logs_select_own_user ON public.usage_logs;
CREATE POLICY usage_logs_select_own_user
  ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS usage_logs_insert_own_user ON public.usage_logs;
CREATE POLICY usage_logs_insert_own_user
  ON public.usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS usage_logs_update_own_user ON public.usage_logs;
CREATE POLICY usage_logs_update_own_user
  ON public.usage_logs
  FOR UPDATE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text)
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid()::text);

DROP POLICY IF EXISTS usage_logs_delete_own_user ON public.usage_logs;
CREATE POLICY usage_logs_delete_own_user
  ON public.usage_logs
  FOR DELETE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid()::text);

-- documents: access is derived from a chat owned by the authenticated user.
DROP POLICY IF EXISTS documents_select_own_user_chat ON public.documents;
CREATE POLICY documents_select_own_user_chat
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = documents.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS documents_insert_own_user_chat ON public.documents;
CREATE POLICY documents_insert_own_user_chat
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = documents.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS documents_update_own_user_chat ON public.documents;
CREATE POLICY documents_update_own_user_chat
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = documents.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = documents.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS documents_delete_own_user_chat ON public.documents;
CREATE POLICY documents_delete_own_user_chat
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = documents.chat_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

-- document_chunks: access is derived through documents -> chats ownership.
DROP POLICY IF EXISTS document_chunks_select_own_user_chat ON public.document_chunks;
CREATE POLICY document_chunks_select_own_user_chat
  ON public.document_chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.documents d
      JOIN public.chats c ON c.id = d.chat_id
      WHERE d.id = document_chunks.document_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS document_chunks_insert_own_user_chat ON public.document_chunks;
CREATE POLICY document_chunks_insert_own_user_chat
  ON public.document_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.documents d
      JOIN public.chats c ON c.id = d.chat_id
      WHERE d.id = document_chunks.document_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS document_chunks_update_own_user_chat ON public.document_chunks;
CREATE POLICY document_chunks_update_own_user_chat
  ON public.document_chunks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.documents d
      JOIN public.chats c ON c.id = d.chat_id
      WHERE d.id = document_chunks.document_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.documents d
      JOIN public.chats c ON c.id = d.chat_id
      WHERE d.id = document_chunks.document_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS document_chunks_delete_own_user_chat ON public.document_chunks;
CREATE POLICY document_chunks_delete_own_user_chat
  ON public.document_chunks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.documents d
      JOIN public.chats c ON c.id = d.chat_id
      WHERE d.id = document_chunks.document_id
        AND c.owner_type = 'user'
        AND c.owner_id = auth.uid()::text
    )
  );
