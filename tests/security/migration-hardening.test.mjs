import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const foundationUrl = new URL("../../prisma/migrations/20261030090000_phase_4a_foundation/migration.sql", import.meta.url);
const securityUrl = new URL("../../prisma/migrations/20261030091000_supabase_security/migration.sql", import.meta.url);

test("all required updated_at columns have defaults and update triggers", async () => {
  const foundation = await readFile(foundationUrl, "utf8");
  const security = await readFile(securityUrl, "utf8");
  const updatedAtColumns = foundation.match(/"updated_at" TIMESTAMPTZ\(6\) NOT NULL DEFAULT CURRENT_TIMESTAMP/g) ?? [];
  assert.equal(updatedAtColumns.length, 8);
  for (const table of ["staff_profiles", "page_contents", "news_articles", "school_events", "media_assets", "admission_enquiries", "contact_enquiries", "school_settings"]) {
    assert.match(security, new RegExp(`create trigger ${table}_set_updated_at before update on public\\.${table}`, "i"));
  }
});

test("review decisions are append-only and lifecycle operations are scoped", async () => {
  const sql = await readFile(securityUrl, "utf8");
  assert.match(sql, /create or replace function private\.transition_content/);
  assert.match(sql, /create or replace function private\.validate_review_decision/);
  assert.match(sql, /Staff cannot review their own submission/);
  assert.doesNotMatch(sql, /grant update[^;]*content_reviews/i);
  assert.doesNotMatch(sql, /create policy[^;]*content_reviews for update/i);
});

test("ownership and revision attribution are immutable", async () => {
  const sql = await readFile(securityUrl, "utf8");
  for (const fragment of ["Content ownership cannot be reassigned", "Media ownership and object identity cannot be reassigned", "Consent attribution cannot be reassigned", "Revision attribution cannot be changed", "Revision target does not exist"]) {
    assert.ok(sql.includes(fragment), `missing hardening rule: ${fragment}`);
  }
});

test("security-definer functions have safe search paths and explicit revokes", async () => {
  const sql = await readFile(securityUrl, "utf8");
  const definers = sql.match(/security definer set search_path = ''/gi) ?? [];
  assert.ok(definers.length >= 10);
  assert.doesNotMatch(sql, /security definer(?! set search_path = '')/i);
  assert.match(sql, /alter default privileges revoke execute on functions from public/i);
});

test("foreign-key indexes and integrity checks are present", async () => {
  const foundation = await readFile(foundationUrl, "utf8");
  const security = await readFile(securityUrl, "utf8");
  for (const index of ["staff_memberships_granted_by_idx", "page_contents_created_by_id_idx", "news_articles_created_by_id_idx", "school_events_created_by_id_idx", "content_revisions_author_id_idx", "media_assets_uploaded_by_id_idx", "media_consent_records_recorded_by_id_idx", "school_settings_updated_by_idx"]) {
    assert.ok(foundation.includes(index), `missing index: ${index}`);
  }
  assert.match(security, /media_assets_byte_size_positive check \(byte_size > 0\)/);
  assert.match(security, /content_revisions_number_positive check \(revision_number > 0\)/);
});

test("audit records exclude content and consent details", async () => {
  const sql = await readFile(securityUrl, "utf8");
  assert.match(sql, /row_data - array\['body'\]/);
  assert.match(sql, /row_data - array\['reference_code','notes'\]/);
  assert.match(sql, /if tg_op = 'DELETE' then return old; else return new; end if/);
});
