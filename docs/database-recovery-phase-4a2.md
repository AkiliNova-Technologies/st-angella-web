# Phase 4A.2 database recovery plan

## Qualified baseline

- Project: st-angella-web-dev
- Reference: hmdeyiyvjbomnthmdwpk
- Region: eu-central-1
- PostgreSQL: 17.11
- Qualification date: 2026-10-30
- Application tables: none
- Application migration records: none
- Auth users: zero
- Storage buckets: zero
- Security/performance advisor findings: none before deployment

Reconfirm every baseline item immediately before deployment. Stop if the project
reference, application-object count, Auth-user count, bucket count, or migration
history differs.

## Backup preparation

Use a direct or session-mode migration connection from the approved secret
manager. Never place a password in shell history or this repository. Set the
connection through the deployment environment, then run:

    pg_dump --dbname="$DIRECT_URL" --format=custom --file=st-angella-pre-phase-4a2.dump
    pg_dump --dbname="$DIRECT_URL" --schema-only --no-owner --no-privileges --file=st-angella-pre-phase-4a2-schema.sql
    sha256sum st-angella-pre-phase-4a2.dump st-angella-pre-phase-4a2-schema.sql
    pg_restore --list st-angella-pre-phase-4a2.dump

Store dumps and the checksum manifest in the approved encrypted backup location,
not in Git. Confirm managed-backup/PITR entitlement separately; the logical dump
is required regardless.

## Migration controls

1. Record SHA-256 hashes for both reviewed migration.sql files.
2. Run Prisma validation, static security tests, and SQL static checks.
3. Inspect for DROP, TRUNCATE, ownership transfer, credentials, and unexpected
   grants.
4. Apply the foundation migration, inspect it, then apply the security migration
   through the approved migration connection.
5. Record migration history, owners, role attributes, force-RLS, grants,
   policies, functions, triggers, buckets, and advisor output.
6. Take a post-deployment custom-format dump before adding test data.

## Rollback strategy

PostgreSQL transaction rollback is the first response to an apply-time failure.
Do not mark a failed migration as applied.

Because the baseline has no application data, a reviewed cleanup script may
remove only the exact objects introduced by these migrations if a transaction
cannot be rolled back. It must resolve and display every target first. Never
reset the Supabase project, drop managed auth/storage objects, or use broad
schema/database deletion.

After application or test data exists, do not use object-drop rollback. Restore
the verified dump or approved managed recovery point into a separate recovery
environment, validate it, and coordinate cutover.

## Restore verification

Restore into an isolated empty PostgreSQL 17/Supabase-compatible test target:

    createdb st_angella_restore_verify
    pg_restore --dbname=st_angella_restore_verify --clean --if-exists --no-owner st-angella-pre-phase-4a2.dump
    psql --dbname=st_angella_restore_verify --file=st-angella-pre-phase-4a2-schema.sql --single-transaction

Verify that the dump lists and restores without errors, expected baseline counts
match, no application tables/users/buckets/migrations unexpectedly appear,
checksums match, and cleanup is explicitly reviewed and environment-scoped.

These commands are documentation only and were not executed in Phase 4A.2.
