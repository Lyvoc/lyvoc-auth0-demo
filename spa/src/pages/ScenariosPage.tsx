import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { claimName, demoConfig, DemoOrganization, DemoTestUser } from "../config/demo";

/**
 * Demo scenarios (docs/scenarios.md), one sub-tab per scenario, built from the
 * demo configuration (spa/src/config/demo.json): accounts, organizations and
 * claims follow the customer. A scenario whose accounts are missing is hidden.
 */

type Action = { label: string; run: () => void };

type Step = {
  id: string;
  title: string;
  steps: React.ReactNode;
  expected: React.ReactNode;
  action?: Action;
};

type Scenario = {
  id: string;
  tab: string;
  title: string;
  point?: React.ReactNode;
  intro?: React.ReactNode;
  steps?: Step[];
  body?: React.ReactNode;
  talkingPoint?: React.ReactNode;
  note?: React.ReactNode;
};

// MFA policy the "Demo access" Action answers with a second factor (step-up)
const MFA_POLICY = "http://schemas.openid.net/pape/policies/2007/06/multi-factor";

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: 10,
  padding: "1.25rem 1.5rem",
  marginBottom: "1.5rem",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.55rem 1rem",
  background: active ? "var(--primary-color)" : "transparent",
  border: `1px solid ${active ? "var(--primary-color)" : "#3a3f50"}`,
  borderRadius: 6,
  color: active ? "#fff" : "var(--text-secondary)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 500,
  whiteSpace: "nowrap",
});

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.6rem 0.75rem",
  color: "var(--text-muted)",
  fontWeight: 600,
  borderBottom: "1px solid #3a3f50",
};
const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  verticalAlign: "top",
  color: "var(--text-primary)",
  borderBottom: "1px solid #2d3142",
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  background: "var(--primary-color)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "0.4rem 0.8rem",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const C = ({ children }: { children: React.ReactNode }) => (
  <code
    style={{
      fontFamily: "monospace",
      background: "#1a1d2e",
      borderRadius: 4,
      padding: "1px 5px",
      color: "#e2e8f0",
      fontSize: "0.9em",
      wordBreak: "break-word",
    }}
  >
    {children}
  </code>
);

const B = ({ children }: { children: React.ReactNode }) => <b>{children}</b>;

const json = (values: string[]) => JSON.stringify(values);

const memberOf = (user: DemoTestUser, org: string) => user.memberships.some((m) => m.organization === org);
const roleIn = (user: DemoTestUser, org: string) => user.memberships.find((m) => m.organization === org)?.role;

const useScenarios = (): Scenario[] => {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const { testUsers, organizations, connections, features, customer } = demoConfig;
  const redirectUri = window.location.origin + "/token";
  const appName = demoConfig.appName || `${customer.name} Portal`;
  const webAppUrl = demoConfig.webAppUrls[0];

  // Personas of the scenarios (terraform/customers/<customer>.tfvars)
  const admin = testUsers.find((u) => u.daeRole) ?? testUsers.find((u) => u.roles.includes("admin"));
  const customerUser = testUsers.find((u) => u !== admin && u.memberships.length === 1 && u.roles.length > 0);
  const multi = testUsers.find((u) => u.memberships.length > 1);
  const direct = testUsers.find((u) => u.memberships.length === 0 && u.roles.length > 0);
  const noApp = testUsers.find((u) => u.memberships.length > 0 && u.roles.length === 0);

  const orgByName = (name?: string) => organizations.find((o) => o.name === name);
  const mainOrg: DemoOrganization | undefined = orgByName(customerUser?.memberships[0]?.organization) ?? organizations[0];
  const otherOrg: DemoOrganization | undefined =
    orgByName(noApp?.memberships[0]?.organization) ?? organizations.find((o) => o !== mainOrg);

  const login = (params: Record<string, string>) => () =>
    loginWithRedirect({ authorizationParams: { redirect_uri: redirectUri, prompt: "login", ...params } });
  const loginOrg = (org: DemoOrganization): Action => ({
    label: `Log In to ${org.displayName}`,
    run: login({ organization: org.id }),
  });
  const loginPassword: Action = { label: "Email / password login", run: login({ connection: connections.database }) };
  const open = (url: string, label: string): Action => ({ label, run: () => window.open(url, "_blank", "noopener") });

  const appRoles = claimName("app_roles");
  const orgRoles = claimName("org_roles");
  const orgsClaim = claimName("organizations");
  const permissions = claimName("permissions");

  const scenarios: Scenario[] = [];

  // Before the demo
  scenarios.push({
    id: "before",
    tab: "Before the demo",
    title: "Before the demo",
    body: (
      <>
        <ol style={{ paddingLeft: 20, lineHeight: 1.7, marginTop: 0 }}>
          <li>
            Prepare the customer and start the applications: <C>terraform apply</C>, <C>npm run config</C>,{" "}
            <C>npm run dev</C> (portal), <C>npm run web</C> (web application{webAppUrl ? `, ${webAppUrl}` : ""}).
          </li>
          <li>
            <B>Reset the test accounts</B>: <C>terraform apply</C> again puts back their password, roles and
            organizations, even after changes made during a previous demo.
          </li>
          <li>
            Log out of the portal, the web application, the Admin UI and the DAE; for a clean run, use a private
            browser window.
          </li>
        </ol>

        <h3>Test accounts</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          Password: <C>{demoConfig.testUsersPassword || "given by the presenter"}</C>. The <C>example.com</C> addresses
          receive nothing (password login only).
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Account</th>
              <th style={thStyle}>Organizations</th>
              <th style={thStyle}>Application role</th>
              <th style={thStyle}>Used for</th>
            </tr>
          </thead>
          <tbody>
            {testUsers.map((u) => (
              <tr key={u.email}>
                <td style={tdStyle}>
                  <C>{u.email}</C>
                </td>
                <td style={tdStyle}>
                  {u.memberships
                    .map((m) => `${orgByName(m.organization)?.displayName ?? m.organization} (${m.role})`)
                    .join(", ") || "none"}
                </td>
                <td style={tdStyle}>{u.roles.join(", ") || "none"}</td>
                <td style={tdStyle}>{u.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Reading the tokens</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          The <B>Token / Profile</B> page decodes the tokens. The demo's claims, set by the{" "}
          <C>{customer.name} - Demo access</C> Action:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Claim</th>
              <th style={thStyle}>Content</th>
            </tr>
          </thead>
          <tbody>
            {[
              [appRoles, "Application roles (application access)"],
              [orgRoles, "Roles in the login organization (organization login only)"],
              [orgsClaim, "The user's organizations"],
              [permissions, "Permissions of the application role + the organization role"],
              ["org_id", "Organization of the login (organization login only)"],
              ["amr (ID token)", "mfa after a second factor"],
            ].map(([claim, content]) => (
              <tr key={claim}>
                <td style={tdStyle}>
                  <C>{claim}</C>
                </td>
                <td style={tdStyle}>{content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  });

  // 1. Login methods
  const loginSteps: Step[] = [];
  if (customerUser) {
    loginSteps.push({
      id: "1.1",
      title: "Password",
      steps: (
        <>
          Email / password login, <C>{customerUser.email}</C>
        </>
      ),
      expected: (
        <>
          Logged in. <C>app_roles: {json(customerUser.roles)}</C>
        </>
      ),
      action: loginPassword,
    });
  }
  if (features.passwordless && connections.passwordless && direct?.receivesEmails) {
    loginSteps.push({
      id: "1.2",
      title: "Passwordless",
      steps: (
        <>
          Passwordless login, <C>{direct.email}</C>, then the code received by email
        </>
      ),
      expected: (
        <>
          Logged in to the same account as with its password (<C>sub</C> starts with <C>auth0|</C>): one account, two
          login methods
        </>
      ),
      action: { label: "Log In with a code", run: login({ connection: connections.passwordless }) },
    });
    loginSteps.push({
      id: "1.3",
      title: "Unknown address",
      steps: "Passwordless login with an address that has no account",
      expected:
        "Auth0 does not reveal it and sends nothing: no account is created (sign-ups are closed, accounts come from the administration)",
      action: { label: "Log In with a code", run: login({ connection: connections.passwordless }) },
    });
  }
  if (features.mfa === "step-up" && admin) {
    loginSteps.push({
      id: "1.4",
      title: "Step-up MFA",
      steps: (
        <>
          Log in as <C>{admin.email}</C> (no second factor asked), then <B>Log In with MFA (step-up)</B>
        </>
      ),
      expected: (
        <>
          The second factor is asked only now (enrollment the first time: authenticator app). ID token: <C>amr</C>{" "}
          contains <C>mfa</C>
        </>
      ),
      action: {
        label: "Log In with MFA (step-up)",
        run: login({ connection: connections.database, acr_values: MFA_POLICY }),
      },
    });
  }
  if (loginSteps.length > 0) {
    scenarios.push({
      id: "login",
      tab: "1. Login methods",
      title: "1. Login methods",
      point: "One Auth0 tenant, several ways to log in, chosen per user and per situation.",
      steps: loginSteps,
      talkingPoint:
        features.mfa === "step-up"
          ? "MFA when the operation needs it (payment, sensitive data), not at every login."
          : undefined,
    });
  }

  // 2. B2B organizations
  const orgSteps: Step[] = [];
  if (mainOrg && customerUser && memberOf(customerUser, mainOrg.name)) {
    orgSteps.push({
      id: "2.1",
      title: "Branded login",
      steps: (
        <>
          <B>Log In to {mainOrg.displayName}</B>, <C>{customerUser.email}</C>
        </>
      ),
      expected: (
        <>
          Login page with {mainOrg.displayName}'s logo and colors. <C>org_id</C> = {mainOrg.displayName},{" "}
          <C>org_roles: {json([roleIn(customerUser, mainOrg.name) ?? ""])}</C>
        </>
      ),
      action: loginOrg(mainOrg),
    });
  }
  if (mainOrg && admin && memberOf(admin, mainOrg.name)) {
    orgSteps.push({
      id: "2.2",
      title: "Organization admin",
      steps: (
        <>
          <B>Log In to {mainOrg.displayName}</B>, <C>{admin.email}</C>
        </>
      ),
      expected: (
        <>
          <C>org_roles: {json([roleIn(admin, mainOrg.name) ?? ""])}</C>, with the organization permissions of that
          role
        </>
      ),
      action: loginOrg(mainOrg),
    });
  }
  if (multi) {
    const [first, second] = multi.memberships.map((m) => orgByName(m.organization));
    orgSteps.push({
      id: "2.3",
      title: "Several organizations",
      steps: (
        <>
          <C>{multi.email}</C> to <B>{first?.displayName}</B>, log out, then to <B>{second?.displayName}</B>
        </>
      ),
      expected: (
        <>
          {multi.memberships.map((m, i) => (
            <span key={m.organization}>
              {i > 0 && "; "}
              {orgByName(m.organization)?.displayName}: <C>org_roles: {json([m.role])}</C>
            </span>
          ))}
          . <C>app_roles: {json(multi.roles)}</C> in both
        </>
      ),
      action: first && loginOrg(first),
    });
  }
  if (otherOrg && customerUser && !memberOf(customerUser, otherOrg.name)) {
    orgSteps.push({
      id: "2.4",
      title: "Not a member",
      steps: (
        <>
          <B>Log In to {otherOrg.displayName}</B> with <C>{customerUser.email}</C>
        </>
      ),
      expected: <>Denied: "user … is not part of the org_… organization"</>,
      action: loginOrg(otherOrg),
    });
  }
  if (orgSteps.length > 0) {
    scenarios.push({
      id: "organizations",
      tab: "2. Organizations",
      title: "2. B2B organizations",
      point:
        "Each customer company is an organization, with its own branded login page, its members and their roles.",
      steps: orgSteps,
      talkingPoint: multi
        ? "The same person, a different role in each company they work with; the application receives the role of the organization they chose."
        : undefined,
    });
  }

  // 3. Access model
  const accessSteps: Step[] = [];
  if (direct) {
    accessSteps.push({
      id: "3.1",
      title: "Application without organization",
      steps: (
        <>
          Email / password login, <C>{direct.email}</C>
        </>
      ),
      expected: (
        <>
          Logged in: <C>app_roles: {json(direct.roles)}</C>, <C>organizations: []</C>
        </>
      ),
      action: loginPassword,
    });
    if (mainOrg) {
      accessSteps.push({
        id: "3.2",
        title: "... but no organization login",
        steps: (
          <>
            <B>Log In to {mainOrg.displayName}</B> with <C>{direct.email}</C>
          </>
        ),
        expected: "Denied: not a member",
        action: loginOrg(mainOrg),
      });
    }
  }
  if (noApp) {
    const org = orgByName(noApp.memberships[0]?.organization);
    accessSteps.push({
      id: "3.3",
      title: "Member without application",
      steps: (
        <>
          <B>Log In to {org?.displayName}</B> with <C>{noApp.email}</C>
        </>
      ),
      expected: <>Denied: "You don't have access to {appName}."</>,
      action: org && loginOrg(org),
    });
  }
  if (accessSteps.length > 0) {
    scenarios.push({
      id: "access",
      tab: "3. Access model",
      title: "3. Access model: applications and organizations",
      point:
        "Two separate permission lists. An application role gives access to the application; an organization role gives permissions in the organization. Being a member of a company does not open the applications.",
      steps: accessSteps,
      note: (
        <>
          After a denied login, the portal offers <B>Log In Again</B>, which asks for the credentials again (the Auth0
          session survives a denied login).
        </>
      ),
    });
  }

  // 4. Single sign-on
  if (webAppUrl && customerUser) {
    const ssoSteps: Step[] = [
      {
        id: "4.1",
        title: "SSO",
        steps: (
          <>
            Log in to the portal as <C>{customerUser.email}</C>, then open the web application
          </>
        ),
        expected: (
          <>
            Logged in without password: "Hello, {customerUser.name}", application roles{" "}
            <C>{customerUser.roles.join(", ")}</C>
          </>
        ),
        action: open(webAppUrl, "Open the web application"),
      },
    ];
    if (noApp) {
      ssoSteps.push({
        id: "4.2",
        title: "Denied there too",
        steps: (
          <>
            On the web application, <B>Log out</B>, then <B>Log in</B> as <C>{noApp.email}</C>
          </>
        ),
        expected: <>"Access denied: You don't have access to {appName}."</>,
        action: open(webAppUrl, "Open the web application"),
      });
    }
    scenarios.push({
      id: "sso",
      tab: "4. Single sign-on",
      title: "4. Single sign-on",
      point:
        "Logged in once, the user opens the company's other applications without typing a password again; the access rules apply in every application.",
      steps: ssoSteps,
      note: "On localhost Auth0 asks the consent to the web application at each account's first login: accept it (no consent on a deployed application).",
    });
  }

  // 5. Admin UI
  if (demoConfig.adminUiUrl) {
    const adminSteps: Step[] = [];
    if (noApp) {
      const org = orgByName(noApp.memberships[0]?.organization);
      const role = demoConfig.roles.find((r) => r.name !== "admin")?.name ?? "buyer";
      adminSteps.push({
        id: "5.1",
        title: "Give an application access",
        steps: (
          <>
            Admin UI: Users, <C>{noApp.email}</C>, <B>Add application</B>: {appName}, {role}. Then{" "}
            <B>Log In to {org?.displayName}</B> as this account
          </>
        ),
        expected: (
          <>
            Allowed: <C>app_roles: {json([role])}</C>, <C>org_roles: {json([noApp.memberships[0]?.role ?? ""])}</C>
          </>
        ),
        action: org && loginOrg(org),
      });
    }
    if (direct && mainOrg) {
      adminSteps.push({
        id: "5.2",
        title: "Add to an organization",
        steps: (
          <>
            Admin UI: Users, <C>{direct.email}</C>, <B>Add organization</B>: {mainOrg.displayName}, member (no
            application). Then <B>Log In to {mainOrg.displayName}</B> as this account
          </>
        ),
        expected: (
          <>
            Allowed: <C>org_roles: ["member"]</C>
          </>
        ),
        action: loginOrg(mainOrg),
      });
      adminSteps.push({
        id: "5.3",
        title: "Remove an access",
        steps: (
          <>
            Admin UI: Users, <C>{direct.email}</C>, Applications card: remove <C>{direct.roles.join(", ")}</C>. Then
            log in without organization as this account
          </>
        ),
        expected: "Denied",
        action: loginPassword,
      });
    }
    if (customerUser && mainOrg) {
      adminSteps.push({
        id: "5.4",
        title: "Remove from an organization",
        steps: (
          <>
            Admin UI: Users, <C>{customerUser.email}</C>, Organizations card: <B>Delete</B> on {mainOrg.displayName}.
            Then <B>Log In to {mainOrg.displayName}</B> as this account
          </>
        ),
        expected: "Denied: not a member",
        action: loginOrg(mainOrg),
      });
    }
    adminSteps.push({
      id: "5.5",
      title: "Create a user",
      steps: (
        <>
          Admin UI: <B>Create user</B>, database <C>{connections.database}</C>, an address of the presenter's mailbox
          (e.g. <C>firstname.lastname+new@…</C>), organization and application role. Choose the password from the
          email received, then log in
        </>
      ),
      expected: "The account follows the same rules",
      action: loginPassword,
    });
    scenarios.push({
      id: "admin-ui",
      tab: "5. Admin UI",
      title: "5. Administration: the Admin UI",
      point:
        "The customer's administrators manage their users, organizations and roles without the Auth0 Dashboard; the changes apply at the next login.",
      intro: (
        <>
          <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
            Open the Admin UI with an Admin UI administrator account, make the change, then check it in the portal.
          </p>
          <button style={{ ...buttonStyle, marginTop: 0, marginBottom: 16 }} onClick={() => window.open(demoConfig.adminUiUrl, "_blank", "noopener")}>
            Open the Admin UI ↗
          </button>
        </>
      ),
      steps: adminSteps,
      note: (
        <>
          Run <C>terraform apply</C> afterwards: it puts the test accounts back.
        </>
      ),
    });
  }

  // 6. DAE
  if (features.dae && demoConfig.daeUrl && admin) {
    const daeOrg = orgByName(admin.memberships[0]?.organization);
    const role = demoConfig.roles.find((r) => r.name !== "admin")?.name ?? "buyer";
    const otherRole = demoConfig.roles.find((r) => r.name !== "admin" && r.name !== role)?.name;
    const outside = testUsers.filter((u) => !daeOrg || !memberOf(u, daeOrg.name));
    const daeSteps: Step[] = [
      {
        id: "6.1",
        title: "Scoped list",
        steps: "DAE: Users",
        expected: (
          <>
            Only the members of {daeOrg?.displayName ?? "the administrator's organizations"}, with their organizations
            and application roles.
            {outside.length > 0 && (
              <>
                {" "}
                {outside.map((u, i) => (
                  <span key={u.email}>
                    {i > 0 && ", "}
                    <C>{u.email}</C>
                  </span>
                ))}{" "}
                are not listed
              </>
            )}
          </>
        ),
        action: { label: "Open the DAE page", run: () => navigate("/dae-extension") },
      },
      {
        id: "6.2",
        title: "Create a user",
        steps: (
          <>
            <B>Create User</B>: an <C>example.com</C> address, password, organization role <C>member</C>, application
            role <C>
              {appName}:{role}
            </C>
          </>
        ),
        expected: (
          <>
            The dialog closes. After a few seconds and a refresh, the user is listed with{" "}
            <C>{daeOrg?.name}</C> and <C>
              {appName}:{role}
            </C>{" "}
            (completed by the <C>{customer.name} - DAE assignment</C> Action). Visible in the Admin UI too
          </>
        ),
      },
    ];
    if (daeOrg) {
      daeSteps.push({
        id: "6.3",
        title: "Its login",
        steps: (
          <>
            Portal, <B>Log In to {daeOrg.displayName}</B> with the new account
          </>
        ),
        expected: (
          <>
            <C>app_roles: {json([role])}</C>, <C>org_roles: ["member"]</C>
          </>
        ),
        action: loginOrg(daeOrg),
      });
    }
    if (otherRole) {
      daeSteps.push({
        id: "6.4",
        title: "Change a role",
        steps: (
          <>
            The user, <B>Actions &gt; Change Profile</B>: application role <C>
              {appName}:{otherRole}
            </C>
          </>
        ),
        expected: "The list shows the new role",
      });
    }
    daeSteps.push({
      id: "6.5",
      title: "Delete",
      steps: (
        <>
          The user, <B>Actions &gt; Delete</B>
        </>
      ),
      expected: "The user is gone",
    });
    scenarios.push({
      id: "dae",
      tab: "6. DAE",
      title: "6. Delegated administration: the DAE",
      point: (
        <>
          Auth0's Delegated Administration extension, next to the Admin UI: an administrator of a customer company
          manages only the users of their organizations. Log in as <C>{admin.email}</C>.
        </>
      ),
      steps: daeSteps,
      talkingPoint:
        "The DAE does the job with Auth0's own tool (no success message, the list needs a refresh after a creation); the Admin UI covers the same needs with a richer experience (notifications, applications, invitations, logs).",
    });
  }

  // After the demo
  scenarios.push({
    id: "after",
    tab: "After the demo",
    title: "After the demo",
    body: (
      <ul style={{ paddingLeft: 20, lineHeight: 1.7, marginTop: 0 }}>
        <li>
          <C>terraform apply</C>: test accounts back to their password, roles and organizations.
        </li>
        <li>Delete the accounts created during the demo (Admin UI or DAE): Terraform does not manage them.</li>
      </ul>
    ),
  });

  return scenarios;
};

const StepsTable = ({ steps }: { steps: Step[] }) => (
  <table style={tableStyle}>
    <thead>
      <tr>
        <th style={{ ...thStyle, width: "22%" }}>#</th>
        <th style={{ ...thStyle, width: "40%" }}>Steps</th>
        <th style={thStyle}>Expected</th>
      </tr>
    </thead>
    <tbody>
      {steps.map((step) => (
        <tr key={step.id}>
          <td style={tdStyle}>
            <div style={{ fontWeight: 600 }}>
              {step.id} {step.title}
            </div>
            {step.action && (
              <button style={buttonStyle} onClick={step.action.run}>
                {step.action.label}
              </button>
            )}
          </td>
          <td style={tdStyle}>{step.steps}</td>
          <td style={tdStyle}>{step.expected}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ScenariosPage: React.FC = () => {
  const scenarios = useScenarios();
  const [searchParams, setSearchParams] = useSearchParams();
  // The tab is kept in the URL (?s=…): a link opens a given scenario
  const active = scenarios.find((s) => s.id === searchParams.get("s")) ?? scenarios[0];

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <h1>Demo scenarios</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Scenarios to present the demo to a prospect, and to check it before a session. Each one gives its point (what
        to say), the steps and the expected result, for {demoConfig.customer.name}'s accounts and organizations.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {scenarios.map((s) => (
          <button key={s.id} style={tabStyle(s.id === active.id)} onClick={() => setSearchParams({ s: s.id })}>
            {s.tab}
          </button>
        ))}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>{active.title}</h2>
        {active.point && (
          <p style={{ color: "var(--text-primary)" }}>
            <B>Point</B>: {active.point}
          </p>
        )}
        {active.intro}
        {active.steps && <StepsTable steps={active.steps} />}
        {active.body}
        {active.talkingPoint && (
          <p
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              borderLeft: "3px solid var(--primary-color)",
              background: "var(--bg-primary)",
              borderRadius: 6,
              color: "var(--text-secondary)",
            }}
          >
            <B>Talking point</B>: {active.talkingPoint}
          </p>
        )}
        {active.note && <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "1rem" }}>{active.note}</p>}
      </div>
    </div>
  );
};

export default ScenariosPage;
