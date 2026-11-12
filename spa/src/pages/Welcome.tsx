import React from "react";
import { useAuth0 } from "../auth";
import { useNavigate } from "react-router-dom";
import { demoConfig, DemoTestUser } from "../config/demo";
import { defineMessages, useMessages } from "../i18n";

const MESSAGES = defineMessages(
  {
    title: (customer: string) => `Welcome to the ${customer} Auth0 CIC Demo`,
    testPlan: "Demo Test Plan",
    testPlanIntro: "Run the steps in order. All test accounts share one password:",
    passwordFromPresenter: "given by the presenter",
    account: "Account:",
    testAccounts: "Test Accounts",
    noTestAccount: "No test account in the demo configuration (spa/src/config/demo.json).",
    application: "Application:",
    noAccess: "no access",
    organizations: "Organizations:",
    daeLabel: "DAE:",
    none: "none",
    technologiesUsed: "Technologies Used",
    technologies: [
      "React 18 (frontend)",
      "TypeScript",
      "Vite (build tool)",
      "Express (backend)",
      "Auth0 (Okta Customer Identity Cloud)",
      "@auth0/auth0-react (Auth0 React SDK)",
      "Terraform (tenant configuration)",
      "Cloudflare Workers (deployment)",
      "Node.js",
    ],
    // Test plan
    open: "Open",
    logIn: "Log In",
    logInTo: (org: string) => `Log In to ${org}`,
    passwordTitle: "Email / password login (SPA)",
    passwordWhere: "Universal Login, without organization",
    passwordlessTitle: "Passwordless login (code by email)",
    passwordlessWhere: "Universal Login, passwordless email connection, without organization",
    passwordlessNote:
      "The code is sent to this account's mailbox. The other test accounts have generic addresses (example.com): no email, password login only.",
    passwordlessAction: "Log In with a code",
    mfaTitle: "Step-up MFA",
    mfaWhere: "Menu: Adaptive MFA",
    mfaNote: "The first time, enroll a factor (authenticator app, email…).",
    orgTitle: (org: string) => `Login through an organization: ${org}`,
    orgWhere: (org: string) => `Branded login page of ${org}`,
    multiOrgTitle: "One user, several organizations",
    multiOrgWhere: (memberships: string) =>
      `Log in to ${memberships} in turn: the organization role and branding change, the application roles stay`,
    ssoTitle: "Single sign-on to a second application",
    ssoWhere: (url: string) => `Web application (npm run web): ${url}`,
    ssoNote:
      "Log in to the portal first, then open the web application: no password asked, same Auth0 session. An account without application access is denied there too.",
    ssoAction: "Open the web application",
    directTitle: "Application access without organization",
    directWhere: "Log in without organization: allowed. Through an organization: denied (not a member)",
    noAppTitle: "Organization member without application access",
    noAppWhere: (org: string | undefined) =>
      `Log in to ${org || "the organization"}: denied, membership alone gives no application access`,
    daeTitle: "DAE (Delegated Admin Extension)",
    daeWhere: "Menu: DAE Extension",
    adminUiTitle: "Admin UI: manage the organizations, users and roles of the demo",
    adminUiNote: "Log in with an Admin UI administrator account.",
    adminUiAction: "Open the Admin UI",
  },
  {
    title: (customer) => `Bienvenue dans la démo Auth0 CIC de ${customer}`,
    testPlan: "Plan de test de la démo",
    testPlanIntro: "Suivez les étapes dans l'ordre. Tous les comptes de test partagent le même mot de passe :",
    passwordFromPresenter: "communiqué par le présentateur",
    account: "Compte :",
    testAccounts: "Comptes de test",
    noTestAccount: "Aucun compte de test dans la configuration de la démo (spa/src/config/demo.json).",
    application: "Application :",
    noAccess: "aucun accès",
    organizations: "Organisations :",
    daeLabel: "DAE :",
    none: "aucune",
    technologiesUsed: "Technologies utilisées",
    technologies: [
      "React 18 (frontend)",
      "TypeScript",
      "Vite (outil de build)",
      "Express (backend)",
      "Auth0 (Okta Customer Identity Cloud)",
      "@auth0/auth0-react (SDK React d'Auth0)",
      "Terraform (configuration du tenant)",
      "Cloudflare Workers (déploiement)",
      "Node.js",
    ],
    // Test plan
    open: "Ouvrir",
    logIn: "Se connecter",
    logInTo: (org) => `Se connecter à ${org}`,
    passwordTitle: "Connexion e-mail / mot de passe (SPA)",
    passwordWhere: "Universal Login, sans organisation",
    passwordlessTitle: "Connexion sans mot de passe (code par e-mail)",
    passwordlessWhere: "Universal Login, connexion passwordless par e-mail, sans organisation",
    passwordlessNote:
      "Le code est envoyé dans la boîte mail de ce compte. Les autres comptes de test ont des adresses génériques (example.com) : pas d'e-mail, connexion par mot de passe uniquement.",
    passwordlessAction: "Se connecter avec un code",
    mfaTitle: "MFA renforcée (step-up)",
    mfaWhere: "Menu : MFA adaptative",
    mfaNote: "La première fois, enregistrez un facteur (application d'authentification, e-mail…).",
    orgTitle: (org) => `Connexion via une organisation : ${org}`,
    orgWhere: (org) => `Page de connexion personnalisée de ${org}`,
    multiOrgTitle: "Un utilisateur, plusieurs organisations",
    multiOrgWhere: (memberships) =>
      `Connectez-vous tour à tour à ${memberships} : le rôle dans l'organisation et l'habillage changent, les rôles applicatifs restent`,
    ssoTitle: "Authentification unique (SSO) vers une deuxième application",
    ssoWhere: (url) => `Application web (npm run web) : ${url}`,
    ssoNote:
      "Connectez-vous d'abord au portail, puis ouvrez l'application web : aucun mot de passe demandé, même session Auth0. Un compte sans accès à l'application y est également refusé.",
    ssoAction: "Ouvrir l'application web",
    directTitle: "Accès à l'application sans organisation",
    directWhere: "Connexion sans organisation : autorisée. Via une organisation : refusée (non membre)",
    noAppTitle: "Membre d'une organisation sans accès à l'application",
    noAppWhere: (org) =>
      `Connexion à ${org || "l'organisation"} : refusée, l'appartenance seule ne donne pas accès à l'application`,
    daeTitle: "DAE (Delegated Admin Extension)",
    daeWhere: "Menu : Extension DAE",
    adminUiTitle: "Admin UI : gérer les organisations, les utilisateurs et les rôles de la démo",
    adminUiNote: "Connectez-vous avec un compte administrateur de l'Admin UI.",
    adminUiAction: "Ouvrir l'Admin UI",
  }
);

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
  const m = useMessages(MESSAGES);
  const { testUsers, organizations, connections, features } = demoConfig;
  const redirectUri = window.location.origin + "/token";
  const steps: TestStep[] = [];

  steps.push({
    title: m.passwordTitle,
    where: m.passwordWhere,
    account: testUsers[0]?.email,
    action: {
      label: m.logIn,
      run: () => loginWithRedirect({ authorizationParams: { connection: connections.database, redirect_uri: redirectUri } }),
    },
  });

  if (features.passwordless && connections.passwordless) {
    steps.push({
      title: m.passwordlessTitle,
      where: m.passwordlessWhere,
      account: testUsers.find((user) => user.receivesEmails)?.email,
      note: m.passwordlessNote,
      action: {
        label: m.passwordlessAction,
        run: () => loginWithRedirect({ authorizationParams: { connection: connections.passwordless!, redirect_uri: redirectUri } }),
      },
    });
  }

  if (features.mfa !== "off") {
    steps.push({
      title: m.mfaTitle,
      where: m.mfaWhere,
      account: testUsers[0]?.email,
      note: m.mfaNote,
      action: { label: m.open, run: () => navigate("/adaptive-mfa") },
    });
  }

  for (const org of organizations) {
    steps.push({
      title: m.orgTitle(org.displayName),
      where: m.orgWhere(org.name),
      account: testUsers.find((user) => memberOf(user, org.name) && user.roles.length > 0)?.email,
      action: {
        label: m.logInTo(org.displayName),
        run: () => loginWithRedirect({ authorizationParams: { organization: org.id, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  const multiOrgUser = testUsers.find((user) => user.memberships.length > 1);
  if (multiOrgUser) {
    steps.push({
      title: m.multiOrgTitle,
      where: m.multiOrgWhere(multiOrgUser.memberships.map((ms) => `${ms.organization} (${ms.role})`).join(", ")),
      account: multiOrgUser.email,
      action: { label: m.open, run: () => navigate("/organization") },
    });
  }

  const webAppUrl = demoConfig.webAppUrls[0];
  if (webAppUrl) {
    steps.push({
      title: m.ssoTitle,
      where: m.ssoWhere(webAppUrl),
      account: testUsers.find((user) => user.roles.length > 0)?.email,
      note: m.ssoNote,
      action: { label: m.ssoAction, run: () => window.open(webAppUrl, "_blank", "noopener") },
    });
  }

  const directUser = testUsers.find((user) => user.memberships.length === 0 && user.roles.length > 0);
  if (directUser) {
    steps.push({
      title: m.directTitle,
      where: m.directWhere,
      account: directUser.email,
      action: {
        label: m.logIn,
        run: () => loginWithRedirect({ authorizationParams: { connection: connections.database, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  const noAppUser = testUsers.find((user) => user.memberships.length > 0 && user.roles.length === 0);
  if (noAppUser) {
    const org = organizations.find((o) => memberOf(noAppUser, o.name));
    steps.push({
      title: m.noAppTitle,
      where: m.noAppWhere(org?.displayName),
      account: noAppUser.email,
      action: org && {
        label: m.logInTo(org.displayName),
        run: () => loginWithRedirect({ authorizationParams: { organization: org.id, redirect_uri: redirectUri, prompt: "login" } }),
      },
    });
  }

  if (features.dae && demoConfig.daeUrl) {
    steps.push({
      title: m.daeTitle,
      where: m.daeWhere,
      account: testUsers.find((user) => user.daeRole)?.email,
      action: { label: m.open, run: () => navigate("/dae-extension") },
    });
  }

  if (demoConfig.adminUiUrl) {
    steps.push({
      title: m.adminUiTitle,
      where: demoConfig.adminUiUrl,
      note: m.adminUiNote,
      action: { label: m.adminUiAction, run: () => window.open(demoConfig.adminUiUrl, "_blank", "noopener") },
    });
  }

  return steps;
};

const Welcome = () => {
  const testPlan = useTestPlan();
  const m = useMessages(MESSAGES);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", width: "100%" }}>
      <h1 className="main-title" style={{ textAlign: "center", marginBottom: 24 }}>
        {m.title(demoConfig.customer.name)}
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
          <h2 style={{ color: "#48bb78", marginBottom: 12 }}>{m.testPlan}</h2>
          <p style={{ color: "#a0aec0", marginBottom: 20 }}>
            {m.testPlanIntro}{" "}
            <code style={monoStyle}>{demoConfig.testUsersPassword || m.passwordFromPresenter}</code>
          </p>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {testPlan.map((step) => (
              <li key={step.title} style={{ color: "#e2e8f0", marginBottom: 20 }}>
                <div style={{ fontWeight: 600 }}>{step.title}</div>
                <div style={{ color: "#a0aec0", fontSize: 14, marginTop: 4 }}>{step.where}</div>
                {step.account && (
                  <div style={{ fontSize: 14, marginTop: 6 }}>
                    {m.account} <code style={monoStyle}>{step.account}</code>
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
          <h2 style={{ color: "#ed8936", marginBottom: 12 }}>{m.testAccounts}</h2>
          {demoConfig.testUsers.length === 0 && (
            <p style={{ color: "#a0aec0" }}>{m.noTestAccount}</p>
          )}
          {demoConfig.testUsers.map((user) => (
            <div key={user.email} style={{ background: "#1a1e27", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: 12 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{user.name}</div>
              {user.description && <div style={{ color: "#a0aec0", fontSize: 13 }}>{user.description}</div>}
              <div style={{ fontSize: 13, marginTop: 6 }}>
                <code style={monoStyle}>{user.email}</code>
              </div>
              <div style={{ color: "#a0aec0", fontSize: 13, marginTop: 6 }}>
                {m.application} {user.roles.join(", ") || m.noAccess} · {m.organizations}{" "}
                {user.memberships.map((ms) => `${ms.organization} (${ms.role})`).join(", ") || m.none}
                {user.daeRole && ` · ${m.daeLabel} ${user.daeRole}`}
              </div>
            </div>
          ))}

          <h2 style={{ color: "#63b3ed", margin: "28px 0 12px" }}>{m.technologiesUsed}</h2>
          <div style={{ color: "#a0aec0", fontSize: "1rem" }}>
            {m.technologies.map((tech) => (
              <div key={tech} style={{ marginBottom: 6 }}>{tech}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
