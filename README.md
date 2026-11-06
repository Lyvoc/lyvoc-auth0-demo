# Lyvoc Auth0 demo platform

A reusable Auth0 demo, branded for each prospect in a few minutes: a demo portal (React single-page application), a second web application (single sign-on) and the Terraform configuration of the shared demo tenant. One file per customer sets the name, logo, colors, organizations and test accounts; Terraform creates everything on the tenant and the portal follows.

## What the demo shows

- **B2B organizations**: one login page per organization, with its logo and colors; a user member of several organizations logs into each of them in turn.
- **Access model**: applications and organizations are two separate permission lists. An application role gives access to the application; an organization role (`member`, `admin`) gives permissions in the organization. A member without an application role is denied (see [the access model](terraform/README.md#access-model)).
- **Login methods**: password, passwordless (code by email), step-up MFA (only when the portal asks for it).
- **Single sign-on**: logged in to the portal, the user opens the web application without typing a password again; the access rules apply there too.
- **Administration**: the [Admin UI](https://github.com/Lyvoc/lyvoc-auth0-admin-ui) manages the demo's users, organizations and roles; the changes show in the portal's tokens at the next login.
- **Delegated Administration extension (DAE)**: Auth0's delegated user management, next to the Admin UI: `acme-admin` manages the users of his organization only (see [dae-hooks/](dae-hooks/README.md)).

## Repository layout

| Path | Content |
|---|---|
| [`terraform/`](terraform/README.md) | Configuration of the demo tenant, one workspace and one file (`customers/<customer>.tfvars`) per customer |
| `src/` | The demo portal (Vite, React, Auth0 SPA SDK), configured by `src/config/demo.json` (generated, git-ignored) |
| `web-app/` | The web application of the single sign-on demo (Express, `express-openid-connect`), configured by `web-app/.env` (generated, git-ignored) |
| `scripts/config.mjs` | `npm run config`: writes both configurations from Terraform's outputs |
| [`dae-hooks/`](dae-hooks/README.md) | Hooks of the Delegated Administration extension: delegated admins manage the users of their organizations |
| `server.js`, `workers/`, `wrangler.toml` | Backend of an earlier Custom Token Exchange demo (its page is hidden unless enabled) |
| `docs/` | Guides of the earlier demos, to be reviewed |

The Admin UI is not part of this repository: it has its own repository and deployment, so the demo always uses its latest version. The portal links to it (`admin_ui_url` in the customer file).

## Prepare a demo for a prospect

Prerequisites (Terraform, credentials file, settings of the shared tenant): see [terraform/README.md](terraform/README.md#prerequisites).

```bash
cd terraform
source .env.<tenant>                                   # Terraform credentials, git-ignored
cp customers/acme.tfvars customers/<prospect>.tfvars   # name, logo, colors, organizations, test accounts
terraform init
terraform workspace new <prospect>
terraform plan -var-file=customers/<prospect>.tfvars -out=<prospect>.tfplan
terraform apply <prospect>.tfplan

cd ..
npm install && npm --prefix web-app install
npm run config    # writes src/config/demo.json and web-app/.env from Terraform's outputs
npm run dev       # portal: http://localhost:8080
npm run web       # web application (single sign-on), in another terminal: http://localhost:3000
```

The welcome page then shows the **Demo Test Plan**: every step of the demo with the account to use and a button to run it. The test accounts share one password, shown on the page. The full scenarios, with what to say and the expected results: [docs/scenarios.md](docs/scenarios.md).

To switch the portal to another customer: `terraform workspace select <customer>`, then `npm run config` again.

## Test accounts (Acme)

| Account | Organizations | Application | Shows |
|---|---|---|---|
| `acme-admin` | Acme France (admin) | admin | Full access, organization admin, DAE administrator |
| `acme-customer` | Acme France (member) | b2b_customer | Organization member |
| `acme-multi` | Acme France (member), Acme Spain (admin) | buyer | One user, several organizations, a different role in each |
| `acme-direct` | none | buyer | Application access without organization; passwordless login (real mailbox) |
| `acme-no-app` | Acme Spain (member) | none | Organization member without application access: denied |

Generic addresses (`<alias>@example.com`, receiving nothing), except the accounts with `receives_emails`: a real mailbox, set in the credentials file. Every `terraform apply` resets the accounts (password, roles, organizations), even after changes made during a demo.

## Customizing the portal live

The **Settings** page of the portal changes the name, logo and colors in the browser only (no redeployment, not shared, Auth0 login pages unchanged). For a lasting change, edit the customer file and run Terraform: see [what the customer variables drive](terraform/README.md#what-the-customer-variables-drive).
