-- Read-only checks to run in the Supabase SQL Editor after schema.sql.

-- 1. RLS is enabled (expect rls_enabled = true).
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.tasks'::regclass;

-- 2. Exactly four policies, one per command, all for `authenticated`.
select policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public' and tablename = 'tasks'
order by cmd;

-- 3. Table privileges: authenticated has SELECT and DELETE; anon has nothing.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'tasks'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 4. Column privileges: INSERT/UPDATE only on the allowed columns.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'tasks'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE')
order by privilege_type, column_name;
