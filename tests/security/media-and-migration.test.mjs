import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isMediaPublicationEligible } from "../../src/lib/media/eligibility.ts";
test("pupil media requires current consent, approval, and alt text", () => {
  const now = new Date("2026-10-30T12:00:00Z");
  assert.equal(isMediaPublicationEligible({ approved: true, altText: "Pupils in a classroom", containsPupils: true, consentGranted: true, consentValidFrom: new Date("2026-01-01"), consentValidUntil: new Date("2026-12-31"), now }), true);
  assert.equal(isMediaPublicationEligible({ approved: true, altText: "Pupils", containsPupils: true, consentGranted: true, consentValidFrom: new Date("2026-11-01"), now }), false);
  assert.equal(isMediaPublicationEligible({ approved: true, altText: "Pupils", containsPupils: true, consentGranted: true, consentValidUntil: new Date("2026-10-29"), now }), false);
  assert.equal(isMediaPublicationEligible({ approved: true, altText: "", containsPupils: false, consentGranted: true, now }), false);
});
test("security migration closes public writes and protects all public tables", async () => {
  const sql = await readFile(new URL("../../prisma/migrations/20261030091000_supabase_security/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /revoke all on all tables in schema public from public, anon, authenticated, st_angella_runtime/i);
  assert.doesNotMatch(sql, /grant insert on public\.(admission|contact)_enquiries to anon/i);
  assert.doesNotMatch(sql, /pages_reviewer_update|articles_reviewer_update|events_reviewer_update|media_reviewer_update/i);
  assert.match(sql, /grant update \(slug, title, body, updated_at\) on public\.page_contents/i);
  assert.match(sql, /force row level security/i);
  for (const table of ["staff_profiles", "page_contents", "media_assets", "admission_enquiries", "contact_enquiries", "audit_logs"]) assert.ok(sql.includes(`'${table}'`), `${table} must be included in the RLS enablement list`);
});
test("media publication and storage download are narrowly mediated", async () => {
  const sql = await readFile(new URL("../../prisma/migrations/20261030091000_supabase_security/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /media_is_publicly_eligible/);
  assert.match(sql, /valid_from is null or c\.valid_from <= current_date/);
  assert.match(sql, /valid_until is null or c\.valid_until >= current_date/);
  assert.match(sql, /storage\.allow_any_operation/);
  assert.match(sql, /object\.get_authenticated_info/);
  assert.doesNotMatch(sql, /storage_public_eligible_download[\s\S]*object\.list/);
});
test("runtime role cannot bypass RLS and has no login credentials", async () => {
  const sql = await readFile(new URL("../../prisma/migrations/20261030091000_supabase_security/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /create role st_angella_runtime nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls/i);
  assert.doesNotMatch(sql, /st_angella_runtime[\s\S]{0,120}password/i);
  assert.match(sql, /to anon, authenticated, st_angella_runtime using \(status = 'PUBLISHED'/i);
});
