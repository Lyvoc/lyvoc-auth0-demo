# Demo tenant configuration (Terraform)

Creates, on a shared Auth0 demo tenant, everything one customer's demo needs, branded for that customer:

| Object | Name | Notes |
|---|---|---|
| SPA | `<app_name>` (default `<Customer> Portal`) | The React app of this repository. Callbacks `<origin>/token` |
| Regular web app | `<app_name> Web` | SSO between two applications. Callbacks `<origin>/callback` |
| API | `<Customer> - Demo API` | Scopes `read:data` / `write:data` (application roles), `read:organization` / `update:organization` / `manage:members` (organization roles), RBAC (permissions in the access token) |
| Database | `users-db` (existing, `users_connection`) | The tenant's single users database, shared by every customer (the Admin UI's): looked up, enabled on both apps and every organization. The Admin UI admins stay in their own database |
| Passwordless | `email` (existing) | One per tenant: looked up, enabled on the apps only: organization logins use the password |
| Organizations | from `organizations` | Logo and colors per organization (login page branding) |
| Application roles | `<app_name>:<role>` | Admin UI naming convention, with their API permissions. Held directly: application access |
| Organization roles | `member`, `admin` (existing) | The Admin UI's tenant-wide roles: looked up, this demo adds its API permissions to them |
| Test users | from `test_users` | Application roles and organization memberships (two separate lists), one shared password, `app_metadata` role cache read by the Admin UI (reset at every apply), generic `<alias>@example.com` addresses, except the accounts with `receives_emails`: a real mailbox and a passwordless identity linked to the account (one account, two ways to log in: `scripts/link-passwordless.py`) |
| Actions (post-login) | `<Customer> - Demo access`, `<Customer> - Demo MFA` | Only run for the demo apps |
| Action (post-user-registration) | `<Customer> - DAE assignment` | Completes the users created through the DAE (membership, roles): see `dae-hooks/README.md` |
| DAE hooks M2M | `<Customer> - DAE hooks` | Management API access for the Delegated Administration hooks |

The tenant is shared with other demos and with the Admin UI:

- Every object is prefixed with the customer: several customers can live on the tenant, each in its own Terraform workspace.
- Tenant-wide settings are **not** managed: tenant settings, MFA factors, Universal Login theme and prompts, email provider, the passwordless `email` connection, the Delegated Administration extension and its roles.
- Actions are bound one by one (`auth0_trigger_action`): binding them with `auth0_trigger_actions` would replace the whole post-login flow, unbinding the Admin UI's Action.

## Access model

Organizations and applications are two separate permission lists:

- **Applications**: an application role (`<app_name>:admin`, `b2b_customer`, `buyer`), held directly, gives access to the application. Users without one are denied by the `<Customer> - Demo access` Action, organization member or not.
- **Organizations**: membership, with an organization role (`member` reads the organization's data, `admin` also updates it and manages its members). Only members log in through an organization (checked by Auth0).

| User | Login without organization | Login through organization X |
|---|---|---|
| Organizations + application role | Allowed: application permissions | Allowed (member of X): application + organization permissions |
| Application role, no organization | Allowed: application permissions | Denied: not a member |
| Organizations, no application role | Denied: no application access | Denied: no application access |

On an organization login Auth0 only puts the organization's roles in the token: the Action reads the application roles from the `app_metadata.roles` cache kept by the Admin UI, and adds the claims `app_roles`, `org_roles`, `organizations` and `permissions` (application + organization roles).

## Prerequisites

- Terraform >= 1.9 and Python 3 (account linking script, standard library only).
- The organization roles `member` and `admin` on the tenant (the Admin UI's roles, shared by every customer).
- A machine-to-machine application on the tenant, authorized on the **Auth0 Management API** with all its permissions (Dashboard > Applications > Create Application > Machine to Machine). Its credentials go in `terraform/.env.<tenant>` (git-ignored), never in the repository:

  ```bash
  export AUTH0_DOMAIN=<tenant>.eu.auth0.com
  export AUTH0_CLIENT_ID=<client id>
  export AUTH0_CLIENT_SECRET=<client secret>
  # Mailbox of the test accounts with receives_emails (passwordless codes), %s = account alias
  export TF_VAR_test_users_email_template="firstname.lastname+%s@lyvoc.com"
  # Password of all the test accounts (generated when not set), shown on the demo site
  export TF_VAR_test_users_password="<password>"
  ```

- Shared by every customer, so set once, by hand (Terraform never changes them):
  - the users database (`users-db`, created by the Admin UI's `npm run auth0:setup`): this application enabled (Dashboard > Authentication > Database > users-db > Applications), since the Management API only creates users in a connection enabled for the caller; **Disable Sign Ups** on (accounts come from the Admin UI or Terraform: a self-registered one would hold no application role);
  - the passwordless `email` connection (Dashboard > Authentication > Passwordless > Email): this application enabled, and **Disable Sign Ups** on. Auth0 then still shows "We've sent an email with your code" for an unknown address (it never tells which addresses have an account): the text of that screen is reworded, for every language of the tenant (Branding > Universal Login > Advanced Options > Custom Text, prompt `login-passwordless`, screen `login-passwordless-email-code`, key `description`), e.g. "If an account is linked to ${email}, you will receive an email with your code."

- At least one MFA factor enabled on the tenant (Security > Multi-factor Auth), for the MFA Action (`require_mfa = false` otherwise).

## Usage

One customer = one file in `customers/` + one workspace named after its `slug` (a guard stops a plan run in another customer's workspace).

```bash
cd terraform
source .env.<tenant>
terraform init

terraform workspace new acme          # first time; then: terraform workspace select acme
terraform plan -var-file=customers/acme.tfvars -out=acme.tfplan
terraform apply acme.tfplan
```

Configuration of the demo app (organizations, roles, applications, test accounts and their password, Auth0 client, Admin UI and DAE links; no other secret), from the repository root:

```bash
npm run config    # terraform output -json demo_config > src/config/demo.json (git-ignored)
npm run dev
```

Without `src/config/demo.json`, the app falls back to a neutral configuration and the `VITE_AUTH0_*` variables of `.env`, which also override the generated values when set.

Other outputs:

```bash
terraform output spa_env                    # .env of the demo SPA
terraform output organizations              # organization IDs
terraform output dae                        # values for the DAE hooks
terraform output -raw test_users_password   # password of the test accounts
terraform output -raw web_app_client_secret
```

Removing a customer's demo: `terraform destroy -var-file=customers/<slug>.tfvars` in its workspace.

## New customer

Copy `customers/acme.tfvars` to `customers/<slug>.tfvars` and set:

- `customer`: slug, name, logo and colors (the SPA theme, and the default branding of the organizations);
- `organizations`: name, display name and optional logo / colors of each organization;
- `test_users`: alias (email through `test_users_email_template`), name, `organizations` (`organization = "member"` or `"admin"`), `roles` (application roles), `receives_emails` (real mailbox and passwordless login; otherwise `<alias>@example.com`) and app_metadata (`dae_role`: Delegated Administration extension role, given as a direct role);
- optionally `app_name`, `roles`, `claims_namespace`, `spa_urls` / `web_app_urls` (deployed demo URLs).

## What the customer variables drive

Nothing customer-specific is hard-coded: every name derives from the customer file (`main.tf`), and the portal reads its configuration from Terraform.

| Derived from the customer | Acme |
|---|---|
| Application name (`app_name`, default `<name> Portal`) | `Acme Portal`, `Acme Portal Web` |
| Application roles (`<app_name>:<role>`) | `Acme Portal:admin`, `Acme Portal:b2b_customer`, `Acme Portal:buyer` |
| API (`api_identifier`, default `https://<slug>.demo/api`) | `Acme - Demo API`, `https://acme.demo/api` |
| Custom claims namespace (`claims_namespace`, default `https://<slug>.demo/`) | `https://acme.demo/app_roles`, … |
| Actions | `Acme - Demo access`, `Acme - Demo MFA` |
| Organization login pages | Each organization's logo and colors, else the customer's |

Changing `app_name` renames the roles: Terraform recreates and reassigns them for the test accounts, but roles given by hand (Admin UI) are lost.

The portal follows the customer without code change:

1. `terraform output -json demo_config` gathers what the portal needs: customer name, logo and colors, Auth0 client and audience, claims namespace, connections, organizations (IDs and branding), roles, test accounts and their password, Admin UI and DAE URLs, enabled features.
2. `npm run config` writes it to `src/config/demo.json` (git-ignored, one customer at a time).
3. The portal reads it (`src/config/demo.ts`): theme (`src/context/ThemeContext.tsx`), organizations (`src/config/organizationBranding.ts`), the welcome page's Demo Test Plan and test accounts, the Admin UI and DAE links. Without the file, the portal falls back to a neutral configuration and the `VITE_AUTH0_*` variables of `.env`.

## State

Local for now (`terraform.tfstate.d/<workspace>/`, git-ignored): it holds the client secrets and the test password, keep it on your machine. It moves to S3 with the GitHub pipeline.
