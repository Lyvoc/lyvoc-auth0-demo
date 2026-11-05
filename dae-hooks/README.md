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
2. `npm run config` (repository root): writes the hooks with the Management API credentials to `dae-hooks/generated/` (git-ignored: never commit them).
3. Open the DAE (the portal's DAE Extension page) with an account holding `Delegated Admin - Administrator`, then **Configuration > Hooks**: paste each file of `dae-hooks/generated/` into its hook, and save.

The DAE stores the hooks (with the credentials) in the extension: only Dashboard admins and DAE administrators can read them. Paste them again after the `<Customer> - DAE hooks` secret changes.
