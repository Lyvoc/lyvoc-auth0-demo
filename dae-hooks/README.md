# Delegated Administration extension (DAE) hooks

The DAE is Auth0's delegated user management extension, shown next to the Admin UI. A delegated admin (DAE role `Delegated Admin - …`, e.g. `acme-admin`) manages **the users of their own organizations** only, with the demo's access model: the users it creates are organization members with an organization role (`member`, `admin`), an application role held directly (application access) and an optional DAE role. They show in the Admin UI like any other user.

| Hook | Role |
|---|---|
| `filter-hook.js` | The users listed: those of the admin's organizations (`app_metadata.organizations`) |
| `access-hook.js` | What the admin may do on a user: only the users of their organizations; `Delegated Admin - Auditor` is read-only |
| `memberships-query-hook.js` | The organizations offered in the Create User dialog: the admin's |
| `settings-query-hook.js` | The forms: organization role, application role (the admin's applications), DAE role (never above the admin's own); organizations and application roles in the users list |
| `write-hook.js` | Creation (account in the users database, membership, roles, `app_metadata` role cache) and profile changes (application and DAE roles) |

No customer-specific value: organizations and roles are looked up by name, so the hooks serve every customer of the tenant. The DAE runs the Write Hook before creating the user, so the hook creates the account itself and ends with a "User created" message (shown as an error) instead of letting the DAE create a second account.

## Setup (once per tenant, by hand)

The extension, its "DAE App" application and its hooks are shared by the whole tenant: Terraform only creates the Management API application the hooks use (`<Customer> - DAE hooks`).

1. **DAE App** (Dashboard > Applications): only `https://<tenant>.<region>.webtask.run/auth0-delegated-admin/login` in the Allowed Callback URLs; Connections tab: the users database (`users-db`) only.
   The extension checks the `read:users` permission of the logged-in admin on its API: on demo-lyvoc, the APIs "DAE" (`https://testdae`) and "test" (`https://test:api`), whose `read:users` permission the 4 `Delegated Admin - …` roles hold. **Never delete them** ("Missing scope read:users" in the DAE otherwise).
2. `npm run config` (repository root): writes the hooks with the Management API credentials to `dae-hooks/generated/` (git-ignored: never commit them).
3. Open the DAE (the portal's DAE Extension page) with an account holding `Delegated Admin - Administrator`, then **Configuration > Hooks**: paste each file of `dae-hooks/generated/` into its hook, and save.

The DAE stores the hooks (with the credentials) in the extension: only Dashboard admins and DAE administrators can read them. Paste them again after the `<Customer> - DAE hooks` secret changes.

## Extension version and settings

Version **4.8 or later** is required: older ones read the connections' `enabled_clients` field, removed from the Management API (July 2026), and fail on the user details page ("String 'enabled_clients' does not match pattern"). On demo-lyvoc the extension is still 4.7: the upgrade to 5.0.0 fails ("Could not upgrade extension", November 2026), so the list and user creation work, the user details page does not (manage those users from the Admin UI).

Settings to enter when (re)installing it (Dashboard > Extensions > Delegated Administration Dashboard), then paste the hooks again:

| Setting | demo-lyvoc |
|---|---|
| Extension client id | Client ID of "DAE App" |
| Title | `DAE Demo` |
| Custom css, Favicon path, Auth0 custom domain | empty |
| User search engine | `v3` |
| Federated logout | `No` |
| Public wt url | `https://<tenant>.<region>.webtask.run/auth0-delegated-admin` |
| Isolated domain | `true` |
