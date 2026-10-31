# Staff invitation and password setup

## Flow

Staff registration remains invitation-only. An authorized SUPER_ADMIN invokes
the server-only provisioning service, which creates the Auth invitation and the
requested staff profile/membership. It does not implicitly grant SUPER_ADMIN.

The invitation email sends a one-time token hash to /auth/confirm. That route
verifies the hash with Supabase Auth, stores the resulting SSR session in secure
cookies, and immediately redirects to /admin/set-password without retaining the
token in the destination URL.

Password setup validates the server-side session again before updating the
password. After a successful update, the temporary local session is signed out
and the user returns to /admin/login. Accounts without an active staff profile
and at least one active role are denied access to protected administration
routes.

## Supabase URL configuration

In Supabase Dashboard, open **Authentication → URL Configuration**.

Set **Site URL** to the canonical application origin, for example:

    https://school.example

Add exact redirect URLs for every approved environment:

    https://school.example/auth/confirm
    http://localhost:3000/auth/confirm

Preview deployments should use explicit allow-listed origins. Avoid broad
wildcards for production. Ensure NEXT_PUBLIC_SITE_URL exactly matches the
environment's canonical allow-listed origin.

## Invite email template

In **Authentication → Email Templates → Invite user**, use a token-hash link:

    <h2>Set up your staff account</h2>
    <p>You have been invited to St. Angella administration.</p>
    <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/set-password">Accept invitation</a></p>
    <p>This link is single-use and expires. If you did not expect it, ignore this email.</p>

Do not use the default ConfirmationURL for this SSR flow: it can complete an
implicit exchange at Supabase and redirect browser-only tokens in a URL
fragment, which a Next.js server route cannot read.

## Recovery email template

In **Authentication → Email Templates → Reset password**, use:

    <h2>Reset your staff password</h2>
    <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password">Reset password</a></p>
    <p>This link is single-use and expires. If you did not request it, ignore this email.</p>

## Operational checks

1. Disable public user sign-up in the Email provider configuration.
2. Keep invitation and recovery token lifetimes short.
3. Configure production SMTP before relying on invitations.
4. Confirm no analytics middleware records query strings on /auth/confirm.
5. Do not log request URLs, token hashes, Auth errors, or email-link parameters.
6. Test expired, reused, malformed, invitation, and recovery links.
7. Verify an Auth user without an active staff membership reaches Access denied,
   not the administration dashboard.
