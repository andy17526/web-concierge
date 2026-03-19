-- Run after db/schema.sql
-- 1) Create an admin user (replace placeholders)
-- 2) Use a hash generated via:
--    node -e "const {hashPassword}=require('./lib/ops-auth'); console.log(hashPassword('TU_PASSWORD_SEGURA'))"

insert into ops_users (email, role, password_hash, mfa_enabled, mfa_secret, active)
values (
  'ops-admin@vedara.eu',
  'admin',
  'REPLACE_WITH_HASH',
  true,
  'REPLACE_WITH_BASE32_TOTP_SECRET',
  true
)
on conflict (email) do update
set role = excluded.role,
    password_hash = excluded.password_hash,
    mfa_enabled = excluded.mfa_enabled,
    mfa_secret = excluded.mfa_secret,
    active = excluded.active,
    updated_at = now();

-- Optional sample editor user (no MFA requirement)
insert into ops_users (email, role, password_hash, mfa_enabled, mfa_secret, active)
values (
  'ops-editor@vedara.eu',
  'editor',
  'REPLACE_WITH_HASH',
  false,
  null,
  true
)
on conflict (email) do nothing;
