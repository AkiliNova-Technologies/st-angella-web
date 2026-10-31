import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, canReviewOwnContent } from "../../src/lib/auth/permissions.ts";
test("editor cannot publish or manage staff", () => { assert.equal(hasPermission(["EDITOR"], "content:publish"), false); assert.equal(hasPermission(["EDITOR"], "staff:manage"), false); });
test("reviewer can review and publish", () => { assert.equal(hasPermission(["REVIEWER"], "content:review"), true); assert.equal(hasPermission(["REVIEWER"], "content:publish"), true); });
test("super admin has enquiry and staff access", () => { assert.equal(hasPermission(["SUPER_ADMIN"], "enquiries:read"), true); assert.equal(hasPermission(["SUPER_ADMIN"], "staff:manage"), true); });
test("author cannot review own content", () => { assert.equal(canReviewOwnContent("same", "same"), false); assert.equal(canReviewOwnContent("author", "reviewer"), true); });
