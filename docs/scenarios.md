# Demo scenarios

Scenarios to present the demo to a prospect, and to check it before a session. Each one gives its point (what to say), the steps and the expected result. The portal shows them too (menu **Scenarios**, one tab per scenario), built from the customer's configuration, with the login buttons of each step. The examples use the Acme customer (`terraform/customers/acme.tfvars`); with another customer, replace the organization and account names by its own (the portal's welcome page lists them).

## Before the demo

1. Prepare the customer and start the applications ([README](../README.md#prepare-a-demo-for-a-prospect)): `terraform apply`, `npm run config`, `npm run dev` (portal, http://localhost:8080), `npm run web` (web application, http://localhost:3000).
2. **Reset the test accounts**: `terraform apply` again puts back their password, roles and organizations, even after changes made during a previous demo.
3. Log out of the portal, the web application, the Admin UI and the DAE; for a clean run, use a private browser window.

### Test accounts (Acme)

Password: shown on the portal's welcome page (`Test123456*` on demo-lyvoc).

| Account | Organizations | Application role | Used for |
|---|---|---|---|
| `acme-admin@example.com` | Acme France (admin) | admin | Full access, step-up MFA, DAE Administrator |
| `acme-customer@example.com` | Acme France (member) | b2b_customer | Organization login, single sign-on, DAE Auditor (read-only) |
| `acme-dae-user@example.com` | Acme France (admin) | b2b_customer | DAE User (users only) |
| `acme-multi@example.com` | Acme France (member), Acme Spain (admin) | buyer | One user, several organizations; DAE Operator: manages Spain, reads France |
| `acme-direct` (real mailbox) | none | buyer | Application access without organization, passwordless login |
| `acme-no-app@example.com` | Acme Spain (member) | none | Organization member denied |

The `example.com` addresses receive nothing (password login only). `acme-direct` uses the presenter's mailbox (`test_users_email_template`) to receive the codes.

### Reading the tokens

The portal's **Token** page decodes the tokens. The demo's claims, set by the `Acme - Demo access` Action:

| Claim | Content |
|---|---|
| `https://acme.demo/app_roles` | Application roles (application access) |
| `https://acme.demo/org_roles` | Roles in the login organization (organization login only) |
| `https://acme.demo/organizations` | The user's organizations |
| `https://acme.demo/permissions` | Permissions of the application role + the organization role |
| `org_id` | Organization of the login (organization login only) |
| `amr` (ID token) | `mfa` after a second factor |

## 1. Login methods

**Point**: one Auth0 tenant, several ways to log in, chosen per user and per situation.

| # | Steps | Expected |
|---|---|---|
| 1.1 Password | Welcome page, **Email / password login**, `acme-customer@example.com` | Logged in. `app_roles: ["b2b_customer"]`, `permissions: ["read:data"]` |
| 1.2 Passwordless | **Passwordless login** step, the `acme-direct` address, then the code received by email | Logged in to the same account as with its password (`sub` starts with `auth0|`): one account, two login methods |
| 1.3 Unknown address | Passwordless login with an address that has no account | Auth0 does not reveal it ("If an account is linked to … you will receive an email") and sends nothing: no account is created (sign-ups are closed, accounts come from the administration) |
| 1.4 Step-up MFA | Log in as `acme-admin@example.com` (no second factor asked), then menu **Adaptive MFA**, **Log In with MFA (step-up)** | The second factor is asked only now (enrollment the first time: authenticator app). ID token: `amr` contains `mfa` |

**Talking point (1.4)**: MFA when the operation needs it (payment, sensitive data), not at every login.

## 2. B2B organizations

**Point**: each customer company is an organization, with its own branded login page, its members and their roles.

| # | Steps | Expected |
|---|---|---|
| 2.1 Branded login | Welcome page, **Log In to Acme France**, `acme-customer@example.com` | Login page with Acme France's logo and colors. `org_id` = Acme France, `org_roles: ["member"]`, `permissions: ["read:data","read:organization"]` |
| 2.2 Organization admin | **Log In to Acme France**, `acme-admin@example.com` | `org_roles: ["admin"]`, permissions also `update:organization` and `manage:members` |
| 2.3 Several organizations | `acme-multi@example.com` to **Acme France**, log out, then to **Acme Spain** | France: `org_roles: ["member"]`; Spain (orange page): `org_roles: ["admin"]`. `app_roles: ["buyer"]` in both |
| 2.4 Not a member | **Log In to Acme Spain** with `acme-customer@example.com` | Denied: "user … is not part of the org_… organization" |

**Talking point (2.3)**: the same person, a different role in each company they work with; the application receives the role of the organization they chose.

## 3. Access model: applications and organizations

**Point**: two separate permission lists. An application role gives access to the application; an organization role gives permissions in the organization. Being a member of a company does not open the applications.

| # | Steps | Expected |
|---|---|---|
| 3.1 Application without organization | **Application access without organization** step, `acme-direct` | Logged in: `app_roles: ["buyer"]`, `organizations: []` |
| 3.2 ... but no organization login | **Log In to Acme France** with `acme-direct` | Denied: not a member |
| 3.3 Member without application | **Organization member without application access** step (`acme-no-app@example.com`, Acme Spain) | Denied: "You don't have access to Acme Portal." |

After a denied login, the portal offers **Log In Again**, which asks for the credentials again (the Auth0 session survives a denied login).

## 4. Single sign-on

**Point**: logged in once, the user opens the company's other applications without typing a password again; the access rules apply in every application.

| # | Steps | Expected |
|---|---|---|
| 4.1 SSO | Log in to the portal as `acme-customer@example.com`, then **Open the web application** (http://localhost:3000) | Logged in without password: "Hello, Acme Customer", application roles `b2b_customer` |
| 4.2 Denied there too | On the web application, **Log out**, then **Log in** as `acme-no-app@example.com` | "Access denied: You don't have access to Acme Portal." |

On localhost Auth0 asks the consent to the web application at each account's first login: accept it (no consent on a deployed application).

## 5. Administration: the Admin UI

**Point**: the customer's administrators manage their users, organizations and roles without the Auth0 Dashboard; the changes apply at the next login. Open the Admin UI from the portal's menu (**Admin UI**), with an Admin UI administrator account.

| # | Steps in the Admin UI | Then in the portal | Expected |
|---|---|---|---|
| 5.1 Give an application access | Users, `acme-no-app`, **Add application**: Acme Portal, buyer | **Log In to Acme Spain** as `acme-no-app` | Allowed: `app_roles: ["buyer"]`, `org_roles: ["member"]` |
| 5.2 Add to an organization | Users, `acme-direct`, **Add organization**: Acme France, member (no application) | **Log In to Acme France** as `acme-direct` | Allowed: `org_roles: ["member"]` |
| 5.3 Remove an access | Users, `acme-direct`, Applications card: remove `buyer` | Login without organization as `acme-direct` | Denied |
| 5.4 Remove from an organization | Users, `acme-customer`, Organizations card: **Delete** on Acme France | **Log In to Acme France** as `acme-customer` | Denied: not a member |
| 5.5 Create a user | **Create user**: database `users-db`, an address of the presenter's mailbox (e.g. `firstname.lastname+new@…`), organization and application role | Choose the password from the email received, then log in | The account follows the same rules |

Run `terraform apply` afterwards: it puts the test accounts back.

## 6. Delegated administration: the DAE

**Point**: Auth0's Delegated Administration extension, next to the Admin UI: an administrator of a customer company manages only the users of their organizations. Open it from the portal (**DAE Extension**) and log in as `acme-admin@example.com`.

| # | Steps in the DAE | Expected |
|---|---|---|
| 6.1 Scoped list | Users | Only the members of Acme France, with their organizations and application roles. `acme-no-app` and `acme-direct` (other organization, none) are not listed |
| 6.2 Create a user | **Create User**: an `example.com` address, password, organization role `member`, application role `Acme Portal:buyer` | The dialog closes. After a few seconds and a refresh, the user is listed with `acme-france` and `Acme Portal:buyer` (completed by the `Acme - DAE assignment` Action). Visible in the Admin UI too |
| 6.3 Its login | Portal, **Log In to Acme France** with the new account | `app_roles: ["buyer"]`, `org_roles: ["member"]` |
| 6.4 Change a role | The user, **Actions > Change Profile**: application role `Acme Portal:b2b_customer` | The list shows the new role |
| 6.5 Delete | The user, **Actions > Delete** | The user is gone |
| 6.6 Rights per organization | Log out of the DAE, log in as `acme-multi@example.com`. Open a user of each organization, try **Actions > Block**, then **Create User** | Both organizations listed. Acme France: read-only ("Read-only: you are not an admin of this user's organizations."). Acme Spain: the actions work. **Create User**: no Organization field (a single organization managed), the field reads "Organization role in acme-spain", and the new user is listed in `acme-spain` |
| 6.7 DAE roles | Log in as `acme-dae-user@example.com`, then `acme-multi@example.com`, then `acme-admin@example.com` | User: users only. Operator: users and **Logs**. Administrator: also **Configuration** (hooks), in the menu under the name |
| 6.8 Auditor: read-only | Log in as `acme-customer@example.com` | The users of Acme France are listed and can be opened, without **Create User**; any action is refused ("Auditors have read-only access.") |

The rights inside an organization follow the organization role: a DAE role manages the users of the organizations where the account is `admin`, and only reads the ones where it is `member` (see [dae-hooks/README.md](../dae-hooks/README.md#rights-per-organization)).

**Talking point**: the DAE does the job with Auth0's own tool (no success message, the list needs a refresh after a creation); the Admin UI covers the same needs with a richer experience (notifications, applications, invitations, logs).

## After the demo

- `terraform apply`: test accounts back to their password, roles and organizations.
- Delete the accounts created during the demo (Admin UI or DAE): Terraform does not manage them.
