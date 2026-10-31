import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildEmailConfirmationUrl,
  destinationForEmailFlow,
  isSupportedEmailFlow,
} from "../../src/lib/auth/email-flow.ts";

test("email flow destinations are fixed to safe administration routes", () => {
  assert.equal(isSupportedEmailFlow("invite"), true);
  assert.equal(isSupportedEmailFlow("recovery"), true);
  assert.equal(isSupportedEmailFlow("signup"), false);
  assert.equal(destinationForEmailFlow("invite", "https://evil.example"), "/admin/set-password");
  assert.equal(destinationForEmailFlow("recovery", "/admin/reset-password"), "/admin/reset-password");
  assert.equal(
    buildEmailConfirmationUrl("https://school.example", "/admin/set-password"),
    "https://school.example/auth/confirm?next=%2Fadmin%2Fset-password",
  );
});

test("confirmation route verifies token hashes and never handles URL fragments", async () => {
  const route = await readFile(
    new URL("../../src/app/auth/confirm/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /verifyOtp/);
  assert.match(route, /token_hash: tokenHash/);
  assert.match(route, /!data\.session/);
  assert.match(route, /Cache-Control", "no-store"/);
  assert.match(route, /Referrer-Policy", "no-referrer"/);
  assert.doesNotMatch(route, /location\.hash|access_token|refresh_token|console\./);
});

test("password setup requires claims before a server-side password update", async () => {
  const action = await readFile(
    new URL("../../src/app/admin/set-password/actions.ts", import.meta.url),
    "utf8",
  );
  assert.ok(action.indexOf("auth.getClaims") < action.indexOf("auth.updateUser"));
  assert.match(action, /signOut\(\{ scope: "local" \}\)/);
  assert.doesNotMatch(action, /SUPER_ADMIN|staff_memberships|console\./);
});

test("staff invitation supplies the dedicated setup redirect", async () => {
  const provisioning = await readFile(
    new URL("../../src/lib/auth/provision-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(provisioning, /buildEmailConfirmationUrl/);
  assert.match(provisioning, /"\/admin\/set-password"/);
  assert.match(provisioning, /redirectTo/);
});

test("an authenticated account with no active role is not staff", async () => {
  const guard = await readFile(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(guard, /if \(roles\.length === 0\) return null/);
  assert.match(guard, /redirect\("\/admin\/forbidden"\)/);
});

test("staff lookup disambiguates the membership profile relationship", async () => {
  const guard = await readFile(
    new URL("../../src/lib/auth/require-staff.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    guard,
    /staff_memberships!staff_memberships_profile_id_fkey\(staff_roles\(code\)\)/,
  );
  assert.doesNotMatch(guard, /staff_memberships\(staff_roles\(code\)\)/);
});
