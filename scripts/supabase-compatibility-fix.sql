-- ============================================================================
-- FLOW FINANCE - CORREÇÃO DE COMPATIBILIDADE E SEGURANÇA (RLS) NO SUPABASE
-- Execute este script no SQL Editor do painel do Supabase.
-- ============================================================================

-- 1. Função RPC segura para verificar se um e-mail já está cadastrado na tela de login
--    (substitui leitura pública da tabela public.users por usuários anônimos)
CREATE OR REPLACE FUNCTION public.check_user_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.check_user_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_exists(text) TO anon, authenticated;

-- 2. Ativar e restringir RLS na tabela public.users
--    Remove qualquer política permissiva de leitura anônima e permite acesso
--    apenas ao próprio usuário autenticado (comparando o e-mail do JWT).
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users;', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "users_delete_own"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));
