import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const actions = await readFile(new URL("../../src/app/admin/content-actions.ts", import.meta.url), "utf8");
const shell = await readFile(new URL("../../src/components/admin/admin-shell.tsx", import.meta.url), "utf8");
const staffPage = await readFile(new URL("../../src/app/admin/staff/page.tsx", import.meta.url), "utf8");
const staffGuard = await readFile(new URL("../../src/lib/auth/require-staff.ts", import.meta.url), "utf8");
const adminLayout = await readFile(new URL("../../src/app/admin/layout.tsx", import.meta.url), "utf8");

test("every content mutation authenticates and server-authorizes the caller", () => {
  assert.equal((actions.match(/await requireStaff\(\)/g) ?? []).length, 5);
  assert.match(actions, /hasPermission\(staff\.roles, "content:edit"\)/);
  assert.match(actions, /hasPermission\(staff\.roles, "content:review"\)/);
  assert.match(actions, /redirect\("\/admin\/forbidden"\)/);
});

test("content lifecycle changes use the protected transition RPC", () => {
  assert.match(actions, /\.rpc\("transition_content"/);
  assert.doesNotMatch(actions, /\.update\(\{\s*status:/);
  assert.match(actions, /content_revisions/);
  assert.match(actions, /content_reviews/);
});

test("content mutations never use privileged Supabase credentials", () => {
  assert.doesNotMatch(actions, /createSupabaseAdminClient|SUPABASE_SECRET_KEY|service_role/);
  assert.match(actions, /createSupabaseServerClient/);
});

test("staff directory is restricted to SUPER_ADMIN and disambiguates membership ownership", () => {
  assert.match(staffPage, /requireStaff\(\["SUPER_ADMIN"\]\)/);
  assert.match(staffPage, /staff_memberships!staff_memberships_profile_id_fkey/);
});

test("navigation identifies role-restricted and unfinished sections", () => {
  assert.match(shell, /superOnly: true/);
  assert.match(shell, /aria-disabled="true"/);
  assert.match(shell, /Soon/);
});

test("protected staff rendering waits for an authenticated request", () => {
  assert.match(staffGuard, /import \{ connection \} from "next\/server"/);
  assert.ok(staffGuard.indexOf("await connection()") < staffGuard.indexOf("auth.getClaims()"));
  assert.match(adminLayout, /export const instant = false/);
  assert.match(staffPage, /requireStaff\(\["SUPER_ADMIN"\]\)/);
});
