# Demo tenant configuration (Terraform)

Creates, on a shared Auth0 demo tenant, everything one customer's demo needs, branded for that customer:

| Object | Name | Notes |
|---|---|---|
| SPA | `<app_name>` (default `<Customer> Portal`) | The React app of this repository. Callbacks `<origin>/token` |
| Regular web app | `<app_name> Web` | SSO between two applications. Callbacks `<origin>/callback` |
| API | `<Customer> - Demo API` | Scopes `read:data` / `write:data`, RBAC (permissions in the access token) |
| Database | `<slug>-users` | Username/password, enabled on both apps and every organization |
| Passwordless | `email` (existing) | One per tenant: looked up, enabled on the apps and organizations |
| Organizations | from `organizations` | Logo and colors per organization (login page branding) |
| Roles | `<app_name>:<role>` | Admin UI naming convention, with their API permissions |
| Test users | from `test_users` | Organization members with their roles, one generated password |
| Actions (post-login) | `<Customer> - Demo claims`, `<Customer> - Demo MFA` | Only run for the demo apps |
| DAE hooks M2M | `<Customer> - DAE hooks` | Management API access for the Delegated Administration hooks |

The tenant is shared with other demos and with the Admin UI:

- Every object is prefixed with the customer: several customers can live on the tenant, each in its own Terraform workspace.
- Tenant-wide settings are **not** managed: tenant settings, MFA factors, Universal Login theme and prompts, email provider, the passwordless `email` connection, the Delegated Administration extension and its roles.
- Actions are bound one by one (`auth0_trigger_action`): binding them with `auth0_trigger_actions` would replace the whole post-login flow, unbinding the Admin UI's Action.

## Prerequisites

- Terraform >= 1.9.
- A machine-to-machine application on the tenant, authorized on the **Auth0 Management API** with all its permissions (Dashboard > Applications > Create Application > Machine to Machine). Its credentials go in `terraform/.env.<tenant>` (git-ignored), never in the repository:

  ```bash
  export AUTH0_DOMAIN=<tenant>.eu.auth0.com
  export AUTH0_CLIENT_ID=<client id>
  export AUTH0_CLIENT_SECRET=<client secret>
  export TF_VAR_terraform_client_id="$AUTH0_CLIENT_ID"
  # Mailbox receiving the test accounts' emails (passwordless and MFA codes), %s = account alias
  export TF_VAR_test_users_email_template="firstname.lastname+%s@lyvoc.com"
  ```

  The demo database is enabled for this application: the Management API only creates users in a database enabled for the caller.

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

Configuration of the demo app (organizations, roles, applications, test accounts, Auth0 client, Admin UI and DAE links; no secret), from the repository root:

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
- `test_users`: alias (email through `test_users_email_template`), name, memberships (`organization = [roles]`) and app_metadata;
- optionally `app_name`, `roles`, `claims_namespace`, `spa_urls` / `web_app_urls` (deployed demo URLs).

## State

Local for now (`terraform.tfstate.d/<workspace>/`, git-ignored): it holds the client secrets and the test password, keep it on your machine. It moves to S3 with the GitHub pipeline.
