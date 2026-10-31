import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionContent } from "../../src/lib/content/lifecycle.ts";
const base = { authorProfileId: "author", actorProfileId: "reviewer", latestRevisionApproved: true };
test("editor can submit own draft but cannot publish", () => { assert.equal(canTransitionContent({ ...base, from: "DRAFT", to: "IN_REVIEW", roles: ["EDITOR"], actorProfileId: "author" }), true); assert.equal(canTransitionContent({ ...base, from: "APPROVED", to: "PUBLISHED", roles: ["EDITOR"], actorProfileId: "author" }), false); });
test("reviewer requires independent approved revision", () => { assert.equal(canTransitionContent({ ...base, from: "APPROVED", to: "PUBLISHED", roles: ["REVIEWER"] }), true); assert.equal(canTransitionContent({ ...base, from: "APPROVED", to: "PUBLISHED", roles: ["REVIEWER"], actorProfileId: "author" }), false); assert.equal(canTransitionContent({ ...base, from: "APPROVED", to: "PUBLISHED", roles: ["REVIEWER"], latestRevisionApproved: false }), false); });
test("invalid transition is rejected", () => { assert.equal(canTransitionContent({ ...base, from: "DRAFT", to: "PUBLISHED", roles: ["SUPER_ADMIN"] }), false); });
test("super admin inherits workflow capabilities but cannot self-approve", () => {
  assert.equal(canTransitionContent({ ...base, from: "DRAFT", to: "IN_REVIEW", roles: ["SUPER_ADMIN"], actorProfileId: "author" }), true);
  assert.equal(canTransitionContent({ ...base, from: "IN_REVIEW", to: "APPROVED", roles: ["SUPER_ADMIN"] }), true);
  assert.equal(canTransitionContent({ ...base, from: "IN_REVIEW", to: "APPROVED", roles: ["SUPER_ADMIN"], actorProfileId: "author" }), false);
});
