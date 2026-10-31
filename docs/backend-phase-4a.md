# Phase 4A backend operations

## Safety status

The approved development target is st-angella-web-dev
(hmdeyiyvjbomnthmdwpk, eu-central-1, PostgreSQL 17.11). It was confirmed active
and empty on 2026-10-30. Phase 4A.2 modifies local migration artifacts only: no
migration, role, bucket, or staff account has been created remotely.

## Required environment

Copy `.env.example` to `.env.local` and provide a development project's URL, publishable key, server-only secret key, pooled runtime `DATABASE_URL`, direct `DIRECT_URL`, and canonical site URL. Never expose database URLs or `SUPABASE_SECRET_KEY` through `NEXT_PUBLIC_` variables.

## Supabase Auth configuration

- Disable public email sign-up.
- Configure the Site URL and allow `/auth/callback` redirects for each environment.
- Keep access-token expiry short enough for the school's risk profile and enable refresh-token rotation.
- Provision the first `SUPER_ADMIN` manually in a reviewed transaction; later staff invitations use the server-only provisioning service.
- Configure SMTP before production recovery flows are enabled.

## Migration review and application

1. Inspect the target database, extensions, grants, existing tables, buckets, and migration history.
2. Review both SQL files under `prisma/migrations` for the named development project.
3. Take or confirm a recoverable development backup.
4. Apply only through the approved development migration workflow using `DIRECT_URL`.
5. Run database/RLS tests with separate anon, editor, reviewer, and super-admin identities.
6. Run Supabase database and security advisors and resolve findings before promotion.

The runtime Prisma URL should use the transaction pooler. Prisma migrations must
use the direct or session-mode URL. The migration creates st_angella_runtime as
a NOLOGIN, NOBYPASSRLS capability role with published-only reads. Deployment
operations must separately create a generated, secret LOGIN role and grant it
st_angella_runtime; the LOGIN role must not own tables. Staff writes use
user-scoped Supabase Auth/RLS rather than the Prisma runtime credential. Public
enquiry insertion remains disabled in Phase 4A.

## Hardened lifecycle and media boundaries

- Editors and SUPER_ADMIN users can edit permitted content columns. Status
  changes are excluded from table grants and go through transition_content.
- Reviews are append-only. Both the revision author and original content creator
  are barred from reviewing the submission.
- SUPER_ADMIN inherits editor/reviewer capabilities through server-side checks,
  without extra memberships, but cannot self-approve content or media.
- Media approval/publication goes through set_media_publication; direct writes
  to approval flags are not granted.
- Pupil media requires an approved asset, alt text, GRANTED consent, and current
  start/expiry dates. Consent rows are never public.
- Storage buckets remain private. Anonymous access is limited to approved object
  download operations; bucket listing is not allowed.

## Enquiry retention

private.purge_expired_enquiries(date) is prepared but has no application-role
execute grant and is not scheduled. It deletes only records already soft-deleted
and past retention. Activation requires separate approval.

## Bootstrap warning

The first administrator is a deliberate manual bootstrap operation because no account may grant itself privileges. Create the Auth user, matching `staff_profiles` row, and `SUPER_ADMIN` membership together under administrator control. Never expose a bootstrap endpoint.

The development bootstrap was completed for the explicitly approved Auth user
through a reviewed, transactional operation. The one-shot local bootstrap
utility and command were removed immediately afterward. Any future recovery or
administrator replacement requires a new reviewed operation; no bootstrap HTTP
endpoint exists.

See [database-recovery-phase-4a2.md](./database-recovery-phase-4a2.md) before
approving deployment.
