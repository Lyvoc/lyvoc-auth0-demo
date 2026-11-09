import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { demoConfig, DemoTestUser } from "../config/demo";

const technologies = [
  "React 18 (frontend)",
  "TypeScript",
  "Vite (build tool)",
  "Express (backend)",
  "Auth0 (Okta Customer Identity Cloud)",
  "@auth0/auth0-react (Auth0 React SDK)",
  "Terraform (tenant configuration)",
  "Cloudflare Workers (deployment)",
  "Node.js"
];

type TestStep = {
  title: string;
  where: string;
  account?: string;
  note?: string;
  action?: { label: string; run: () => void };
};

const monoStyle: React.CSSProperties = {
  fontFamily: "monospace",
  background: "#1a1d2e",
  borderRadius: 4,
  padding: "2px 6px",
  color: "#e2e8f0",
  userSelect: "all",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 10,
  background: "var(--primary-color)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "0.45rem 0.9rem",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const memberOf = (user: DemoTestUser, org: string) => user.memberships.some((m) => m.organization === org);

/**
 * Demo test plan, built from the demo configuration (spa/src/config/demo.json)
 */
const useTestPlan = (): TestStep[] => {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const { testUsers, organizations, connections, features } = demoConfig;
  const redirectUri = window.location.origin + "/token";
  const steps: TestStep[] = [];

  steps.push({
    title: "Email / password login (SPA)",
    where: "Universal Login, without organization",
    account: testUsers[0]?.email,
    action: {
      label: "Log In",
      run: () => loginWithRedirect({ authorizationParams: { connection: connections.database, redirect_uri: redirectUri } }),
    },
  });

  if (features.passwordless && connections.passwordless) {
    steps.push({
      title: "Passwordless login (code by email)",
      where: "Universal Login, passwordless email connection, without organization",
      account: testUsers.find((user) => user.receivesEmails)?.email,
      note: "The code is sent to this account's mailbox. The other test accounts have generic addresses (example.com): no email, password login only.",
      action: {
        label: "Log In with a code",
        run: () => loginWithRedirect({ authorizationParams: { connection: connections.passwordless!, redirect_uri: redirectUri } }),
      },
    });
  }

  if (features.mfa !== "off") {
    steps.push({
      title: "Step-up MFA",
      where: "Menu: Adaptive MFA",
      account: testUsers[0]?.email,
      note: "The first time, enroll a factor (authenticator app, email…).",
      action: { label: "Open", run: () => navigate("/adaptive-mfa") },
    });
  }

  for (const org of organizations) {
    steps.push({
      title: `Login through an organization: ${org.displayName}`,
      where: `Branded login page of ${org.name}`,
      account: testUsers.find((user) => memberOf(user, org.name) && user.roles.length > 0)?.email,
      action: {
        label: `Log In to ${org.displayName}`,
        run: () => loginWithRedirect({ authorizationParams: { organization: org.id, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  const multiOrgUser = testUsers.find((user) => user.memberships.length > 1);
  if (multiOrgUser) {
    steps.push({
      title: "One user, several organizations",
      where: `Log in to ${multiOrgUser.memberships.map((m) => `${m.organization} (${m.role})`).join(", ")} in turn: the organization role and branding change, the application roles stay`,
      account: multiOrgUser.email,
      action: { label: "Open", run: () => navigate("/organization") },
    });
  }

  const webAppUrl = demoConfig.webAppUrls[0];
  if (webAppUrl) {
    steps.push({
      title: "Single sign-on to a second application",
      where: `Web application (npm run web): ${webAppUrl}`,
      account: testUsers.find((user) => user.roles.length > 0)?.email,
      note: "Log in to the portal first, then open the web application: no password asked, same Auth0 session. An account without application access is denied there too.",
      action: { label: "Open the web application", run: () => window.open(webAppUrl, "_blank", "noopener") },
    });
  }

  const directUser = testUsers.find((user) => user.memberships.length === 0 && user.roles.length > 0);
  if (directUser) {
    steps.push({
      title: "Application access without organization",
      where: "Log in without organization: allowed. Through an organization: denied (not a member)",
      account: directUser.email,
      action: {
        label: "Log In",
        run: () => loginWithRedirect({ authorizationParams: { connection: connections.database, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  const noAppUser = testUsers.find((user) => user.memberships.length > 0 && user.roles.length === 0);
  if (noAppUser) {
    const org = organizations.find((o) => memberOf(noAppUser, o.name));
    steps.push({
      title: "Organization member without application access",
      where: `Log in to ${org?.displayName || "the organization"}: denied, membership alone gives no application access`,
      account: noAppUser.email,
      action: org && {
        label: `Log In to ${org.displayName}`,
        run: () => loginWithRedirect({ authorizationParams: { organization: org.id, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  if (features.dae && demoConfig.daeUrl) {
    steps.push({
      title: "DAE (Delegated Admin Extension)",
      where: "Menu: DAE Extension",
      account: testUsers.find((user) => user.daeRole)?.email,
      action: { label: "Open", run: () => navigate("/dae-extension") },
    });
  }

  if (demoConfig.adminUiUrl) {
    steps.push({
      title: "Admin UI: manage the organizations, users and roles of the demo",
      where: demoConfig.adminUiUrl,
      note: "Log in with an Admin UI administrator account.",
      action: { label: "Open the Admin UI", run: () => window.open(demoConfig.adminUiUrl, "_blank", "noopener") },
    });
  }

  return steps;
};

const Welcome = () => {
  const testPlan = useTestPlan();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", width: "100%" }}>
      <h1 className="main-title" style={{ textAlign: "center", marginBottom: 24 }}>
        Welcome to the {demoConfig.customer.name} Auth0 CIC Demo
      </h1>
      <div
        className="action-card"
        style={{
          maxWidth: 1300,
          width: "100%",
          margin: "0 auto",
          background: "#23263a",
          borderRadius: 12,
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "3rem",
          alignItems: "start",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h2 style={{ color: "#48bb78", marginBottom: 12 }}>Demo Test Plan</h2>
          <p style={{ color: "#a0aec0", marginBottom: 20 }}>
            Run the steps in order. All test accounts share one password:{" "}
            <code style={monoStyle}>{demoConfig.testUsersPassword || "given by the presenter"}</code>
          </p>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {testPlan.map((step) => (
              <li key={step.title} style={{ color: "#e2e8f0", marginBottom: 20 }}>
                <div style={{ fontWeight: 600 }}>{step.title}</div>
                <div style={{ color: "#a0aec0", fontSize: 14, marginTop: 4 }}>{step.where}</div>
                {step.account && (
                  <div style={{ fontSize: 14, marginTop: 6 }}>
                    Account: <code style={monoStyle}>{step.account}</code>
                  </div>
                )}
                {step.note && <div style={{ color: "#a0aec0", fontSize: 13, marginTop: 6 }}>{step.note}</div>}
                {step.action && (
                  <button style={buttonStyle} onClick={step.action.run}>
                    {step.action.label}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div style={{ textAlign: "left" }}>
          <h2 style={{ color: "#ed8936", marginBottom: 12 }}>Test Accounts</h2>
          {demoConfig.testUsers.length === 0 && (
            <p style={{ color: "#a0aec0" }}>No test account in the demo configuration (spa/src/config/demo.json).</p>
          )}
          {demoConfig.testUsers.map((user) => (
            <div key={user.email} style={{ background: "#1a1e27", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: 12 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{user.name}</div>
              {user.description && <div style={{ color: "#a0aec0", fontSize: 13 }}>{user.description}</div>}
              <div style={{ fontSize: 13, marginTop: 6 }}>
                <code style={monoStyle}>{user.email}</code>
              </div>
              <div style={{ color: "#a0aec0", fontSize: 13, marginTop: 6 }}>
                Application: {user.roles.join(", ") || "no access"} · Organizations:{" "}
                {user.memberships.map((m) => `${m.organization} (${m.role})`).join(", ") || "none"}
                {user.daeRole && ` · DAE: ${user.daeRole}`}
              </div>
            </div>
          ))}

          <h2 style={{ color: "#63b3ed", margin: "28px 0 12px" }}>Technologies Used</h2>
          <div style={{ color: "#a0aec0", fontSize: "1rem" }}>
            {technologies.map((tech) => (
              <div key={tech} style={{ marginBottom: 6 }}>{tech}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
