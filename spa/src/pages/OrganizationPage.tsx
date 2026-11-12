import React, { useState } from "react";
import { useAuth0 } from "../auth";
import { useTheme } from "../context/ThemeContext";
import ApplicationTiles, { RoleAccessSummary } from "../components/ApplicationTiles";
import {
  ROLE_APP_ACCESS,
  APPLICATIONS,
  getOrganizationBranding,
  getOrgId,
  ApplicationAccess,
} from "../config/organizationBranding";
import { demoConfig, findOrganization } from "../config/demo";
import { defineMessages, useMessages } from "../i18n";

const MESSAGES = defineMessages(
  {
    title: "Organizations & Branding",
    noOrganizations: "No organization in the demo configuration: add some to the customer's tfvars file, apply Terraform and run",
    intro:
      "Multi-brand B2B CIAM architecture using Auth0 Organizations. Each organization has its own visual identity, and application access is controlled by roles within each organization.",
    tabDemo: "🎨 Live Demo",
    tabArchitecture: "🏗️ Architecture",
    tabAccounts: "👤 Test Accounts",
    step1Title: "Step 1: Select an Organization",
    step1Text: "Click an organization to preview its theme. The login page uses the organization's logo and colors.",
    primaryAndId: (color: string, id: string) => `Primary: ${color} · ID: ${id}`,
    loginTo: (name: string) => `Login to ${name}`,
    loginToWithRole: (name: string, role: string) => `Login to ${name} (${role})`,
    step2Title: "Step 2: Role-Based Application Access",
    step2Text: "Users see different applications based on their organization roles. Select roles to preview access:",
    appDashboard: "Application Dashboard",
    accessSummary: "Access Summary",
    step3Title: "Step 3: Launch an Application",
    step3Text:
      "Click an accessible app tile above to select it, then authenticate into it scoped to the selected organization.",
    rolesList: (roles: string) => `· Roles: ${roles}`,
    launch: (name: string) => `Launch ${name} →`,
    clearSelection: "Clear selection",
    selectAppHint: "← Click an accessible app tile in Step 2 to select it",
    multiOrgTitle: "Multi-Organization Users",
    multiOrgText:
      "The app passes the organization in the authorization request: the same user logs into each of their organizations in turn, with that organization's branding and roles.",
    multiOrgUse: (email: string, count: number) => (
      <>
        Use <code>{email}</code>, member of {count} organizations.
      </>
    ),
    modelTitle: "🏗️ The Model: 1 Organization per Brand",
    modelText:
      "Each Auth0 Organization = one brand (or brand and country). Applications are NOT separate organizations: they are scoped within the organization via roles.",
    colOrganization: "Organization",
    colAuth0Organization: "Auth0 Organization",
    colMembers: "Members",
    testAccountCount: (count: number) => `${count} test account(s)`,
    decisionsTitle: "🔑 Key Design Decisions",
    decisionOrgPerBrand: () => (
      <>
        <strong>One organization per brand</strong> (or per brand and country): the finest granularity at which
        branding, language and support contact differ.
      </>
    ),
    decisionAppsNotOrgs: (apps: string) => (
      <>
        <strong>Applications are NOT separate organizations.</strong> Access to {apps} is controlled by the user's roles
        within the organization, not by which organization they are in.
      </>
    ),
    decisionSingleDatabase: () => (
      <>
        <strong>A single Auth0 database connection serves all organizations.</strong> Users are stored once and added as
        members to one or more organizations.
      </>
    ),
    decisionUrlDriven: () => (
      <>
        <strong>The organization is URL-driven:</strong> the portal passes the <code>organization</code> parameter in
        the authorization request, and Auth0 shows that organization's branded login page.
      </>
    ),
    accountsTitle: "👤 Test Accounts",
    accountsText: "Each account demonstrates a specific persona or access pattern. They share one password:",
    passwordFromPresenter: "given by the presenter",
    labelEmail: "Email:",
    labelApplication: "Application:",
    labelOrganizations: "Organizations:",
    labelDae: "DAE:",
    noTile: "no tile",
    noAccess: "no access",
    none: "none",
  },
  {
    title: "Organisations et image de marque",
    noOrganizations:
      "Aucune organisation dans la configuration de la démo : ajoutez-en dans le fichier tfvars du client, appliquez Terraform puis lancez",
    intro:
      "Architecture CIAM B2B multimarque reposant sur Auth0 Organizations. Chaque organisation possède sa propre identité visuelle, et l'accès aux applications est contrôlé par les rôles au sein de chaque organisation.",
    tabDemo: "🎨 Démo en direct",
    tabArchitecture: "🏗️ Architecture",
    tabAccounts: "👤 Comptes de test",
    step1Title: "Étape 1 : sélectionnez une organisation",
    step1Text:
      "Cliquez sur une organisation pour prévisualiser son thème. La page de connexion reprend le logo et les couleurs de l'organisation.",
    primaryAndId: (color, id) => `Couleur principale : ${color} · ID : ${id}`,
    loginTo: (name) => `Se connecter à ${name}`,
    loginToWithRole: (name, role) => `Se connecter à ${name} (${role})`,
    step2Title: "Étape 2 : accès aux applications selon les rôles",
    step2Text:
      "Les utilisateurs voient des applications différentes selon leurs rôles dans l'organisation. Sélectionnez des rôles pour prévisualiser les accès :",
    appDashboard: "Tableau de bord des applications",
    accessSummary: "Récapitulatif des accès",
    step3Title: "Étape 3 : lancez une application",
    step3Text:
      "Cliquez ci-dessus sur la tuile d'une application accessible pour la sélectionner, puis connectez-vous à celle-ci dans le contexte de l'organisation sélectionnée.",
    rolesList: (roles) => `· Rôles : ${roles}`,
    launch: (name) => `Lancer ${name} →`,
    clearSelection: "Effacer la sélection",
    selectAppHint: "← Cliquez sur la tuile d'une application accessible à l'étape 2 pour la sélectionner",
    multiOrgTitle: "Utilisateurs multi-organisations",
    multiOrgText:
      "L'application transmet l'organisation dans la requête d'autorisation : le même utilisateur se connecte tour à tour à chacune de ses organisations, avec l'image de marque et les rôles propres à chacune.",
    multiOrgUse: (email, count) => (
      <>
        Utilisez <code>{email}</code>, membre de {count} organisations.
      </>
    ),
    modelTitle: "🏗️ Le modèle : 1 organisation par marque",
    modelText:
      "Chaque organisation Auth0 = une marque (ou une marque et un pays). Les applications ne sont PAS des organisations distinctes : leur accès est défini au sein de l'organisation, par les rôles.",
    colOrganization: "Organisation",
    colAuth0Organization: "Organisation Auth0",
    colMembers: "Membres",
    testAccountCount: (count) => `${count} compte(s) de test`,
    decisionsTitle: "🔑 Principaux choix de conception",
    decisionOrgPerBrand: () => (
      <>
        <strong>Une organisation par marque</strong> (ou par marque et pays) : le niveau le plus fin auquel l'image de
        marque, la langue et le contact du support diffèrent.
      </>
    ),
    decisionAppsNotOrgs: (apps) => (
      <>
        <strong>Les applications ne sont PAS des organisations distinctes.</strong> L'accès à {apps} est contrôlé par
        les rôles de l'utilisateur au sein de l'organisation, et non par l'organisation à laquelle il appartient.
      </>
    ),
    decisionSingleDatabase: () => (
      <>
        <strong>Une seule connexion de base de données Auth0 sert toutes les organisations.</strong> Les utilisateurs
        sont enregistrés une seule fois et ajoutés comme membres d'une ou plusieurs organisations.
      </>
    ),
    decisionUrlDriven: () => (
      <>
        <strong>L'organisation est pilotée par l'URL :</strong> le portail transmet le paramètre{" "}
        <code>organization</code> dans la requête d'autorisation, et Auth0 affiche la page de connexion aux couleurs de
        cette organisation.
      </>
    ),
    accountsTitle: "👤 Comptes de test",
    accountsText: "Chaque compte illustre un persona ou un modèle d'accès particulier. Ils partagent le même mot de passe :",
    passwordFromPresenter: "communiqué par le présentateur",
    labelEmail: "E-mail :",
    labelApplication: "Application :",
    labelOrganizations: "Organisations :",
    labelDae: "DAE :",
    noTile: "aucune tuile",
    noAccess: "aucun accès",
    none: "aucune",
  }
);

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: "10px",
  padding: "1.25rem 1.5rem",
  marginBottom: "1.5rem",
};

const dividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #3a3f50",
  margin: "1rem 0",
};

const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
  padding: "0.6rem 1.2rem",
  background: active ? color + "20" : "transparent",
  border: `1px solid ${active ? color : "transparent"}`,
  borderRadius: "6px",
  color: active ? color : "var(--text-muted)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 500,
  transition: "all 0.2s ease",
});

const orgButtonStyle = (color: string): React.CSSProperties => ({
  background: color,
  border: "none",
  borderRadius: "6px",
  padding: "0.5rem 1rem",
  color: "#fff",
  fontWeight: 500,
  fontSize: "0.85rem",
  cursor: "pointer",
});

const appNames = (roles: string[]) =>
  [...new Set(roles.flatMap((role) => ROLE_APP_ACCESS[role] || []))].map((id) => APPLICATIONS[id]?.name).filter(Boolean);

const OrganizationPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const { applyOrganizationTheme } = useTheme();
  const m = useMessages(MESSAGES);
  const { organizations, testUsers, roles } = demoConfig;
  const [activeTab, setActiveTab] = useState<"demo" | "architecture" | "accounts">("demo");
  const [demoRoles, setDemoRoles] = useState<string[]>(roles[0] ? [roles[0].name] : []);
  const [selectedOrgForDemo, setSelectedOrgForDemo] = useState<string>(organizations[0]?.name || "");
  const [selectedApp, setSelectedApp] = useState<ApplicationAccess | null>(null);

  const selectedBranding = getOrganizationBranding(selectedOrgForDemo);
  const primaryColor = selectedBranding?.theme.primaryColor || "#63b3ed";
  const multiOrgUser = testUsers.find((user) => user.memberships.length > 1);

  const handleBrandedLogin = (orgName: string) => {
    // Auth0 requires the org ID
    loginWithRedirect({
      authorizationParams: {
        organization: getOrgId(orgName),
        redirect_uri: window.location.origin + "/token",
        scope: "openid profile email",
        prompt: "login",
      },
    });
  };

  const handlePreviewTheme = (orgName: string) => {
    setSelectedOrgForDemo(orgName);
    applyOrganizationTheme(orgName);
  };

  if (organizations.length === 0) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>{m.title}</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {m.noOrganizations}
          <code> npm run config</code>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>{m.title}</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        {m.intro}
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button style={tabStyle(activeTab === "demo", primaryColor)} onClick={() => setActiveTab("demo")}>
          {m.tabDemo}
        </button>
        <button style={tabStyle(activeTab === "architecture", primaryColor)} onClick={() => setActiveTab("architecture")}>
          {m.tabArchitecture}
        </button>
        <button style={tabStyle(activeTab === "accounts", primaryColor)} onClick={() => setActiveTab("accounts")}>
          {m.tabAccounts}
        </button>
      </div>

      {/* DEMO TAB */}
      {activeTab === "demo" && (
        <>
          {/* Organization Selection */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{m.step1Title}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              {m.step1Text}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handlePreviewTheme(org.name)}
                  style={{
                    background: selectedOrgForDemo === org.name ? org.primaryColor + "20" : "var(--bg-primary)",
                    border: `2px solid ${selectedOrgForDemo === org.name ? org.primaryColor : "transparent"}`,
                    borderRadius: "10px",
                    padding: "1rem 1.5rem",
                    cursor: "pointer",
                    minWidth: "160px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <img
                    src={org.logoUrl}
                    alt={org.displayName}
                    style={{ height: "36px", marginBottom: "0.5rem", objectFit: "contain" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{org.displayName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{org.name}</div>
                </div>
              ))}
            </div>

            {selectedBranding && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-primary)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: primaryColor }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedBranding.displayName}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {m.primaryAndId(selectedBranding.theme.primaryColor, getOrgId(selectedOrgForDemo))}
                    </div>
                  </div>
                  <button
                    style={{ ...orgButtonStyle(primaryColor), marginLeft: "auto", padding: "0.6rem 1.2rem", fontWeight: 600 }}
                    onClick={() => handleBrandedLogin(selectedOrgForDemo)}
                  >
                    {m.loginTo(selectedBranding.displayName)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role-Based Access Demo */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{m.step2Title}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              {m.step2Text}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {Object.keys(ROLE_APP_ACCESS).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setDemoRoles((prev) =>
                      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                    );
                  }}
                  style={{
                    background: demoRoles.includes(role) ? primaryColor + "20" : "var(--bg-primary)",
                    border: `1px solid ${demoRoles.includes(role) ? primaryColor : "var(--text-muted)"}`,
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    color: demoRoles.includes(role) ? primaryColor : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  {role}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
              <div>
                <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>
                  {m.appDashboard}
                </h4>
                <ApplicationTiles
                  roles={demoRoles}
                  branding={selectedBranding}
                  showAllApps={true}
                  onAppClick={(app) => setSelectedApp(app)}
                />
              </div>
              <div>
                <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>
                  {m.accessSummary}
                </h4>
                <RoleAccessSummary roles={demoRoles} primaryColor={primaryColor} />
              </div>
            </div>
          </div>

          {/* Step 3: Launch App */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{m.step3Title}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              {m.step3Text}
            </p>

            {selectedApp ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                background: "var(--bg-primary)",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                border: `2px solid ${primaryColor}40`,
              }}>
                <div style={{ fontSize: "2.5rem" }}>{selectedApp.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {selectedApp.name}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    <span style={{ background: primaryColor + "20", color: primaryColor, padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 500 }}>
                      {selectedBranding?.displayName || selectedOrgForDemo}
                    </span>
                    {" "}{m.rolesList(demoRoles.join(", "))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                  <button
                    style={{ ...orgButtonStyle(primaryColor), padding: "0.7rem 1.4rem", fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap" }}
                    onClick={() => handleBrandedLogin(selectedOrgForDemo)}
                  >
                    {m.launch(selectedApp.name)}
                  </button>
                  <button
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", fontSize: "0.8rem", cursor: "pointer", padding: "0.25rem" }}
                    onClick={() => setSelectedApp(null)}
                  >
                    {m.clearSelection}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                background: "var(--bg-primary)",
                borderRadius: "10px",
                border: "2px dashed var(--text-muted)",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
              }}>
                {m.selectAppHint}
              </div>
            )}
          </div>

          {/* Multi-Org User Demo */}
          {multiOrgUser && (
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>{m.multiOrgTitle}</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                {m.multiOrgText}
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {multiOrgUser.memberships.map((membership) => {
                  const org = findOrganization(membership.organization);
                  return (
                    <button
                      key={membership.organization}
                      style={orgButtonStyle(org?.primaryColor || primaryColor)}
                      onClick={() => handleBrandedLogin(membership.organization)}
                    >
                      {m.loginToWithRole(org?.displayName || membership.organization, membership.role)}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                {m.multiOrgUse(multiOrgUser.email, multiOrgUser.memberships.length)}
              </p>
            </div>
          )}
        </>
      )}

      {/* ARCHITECTURE TAB */}
      {activeTab === "architecture" && (
        <>
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{m.modelTitle}</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              {m.modelText}
            </p>

            <hr style={dividerStyle} />

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>{m.colOrganization}</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>{m.colAuth0Organization}</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>{m.colMembers}</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} style={{ borderBottom: "1px solid var(--bg-primary)" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 600, color: org.primaryColor }}>{org.displayName}</td>
                      <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>
                        <code style={{ fontSize: "0.8rem" }}>{org.name} · {org.id}</code>
                      </td>
                      <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>
                        {m.testAccountCount(testUsers.filter((user) => user.memberships.some((membership) => membership.organization === org.name)).length)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>{m.decisionsTitle}</h2>
            <ul style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <li>{m.decisionOrgPerBrand()}</li>
              <li>{m.decisionAppsNotOrgs(Object.values(APPLICATIONS).map((app) => app.name).join(", "))}</li>
              <li>{m.decisionSingleDatabase()}</li>
              <li>{m.decisionUrlDriven()}</li>
            </ul>
          </div>
        </>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === "accounts" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>{m.accountsTitle}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {m.accountsText}{" "}
            <code>{demoConfig.testUsersPassword || m.passwordFromPresenter}</code>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {testUsers.map((user) => {
              const firstOrg = findOrganization(user.memberships[0]?.organization || "");
              const color = firstOrg?.primaryColor || primaryColor;
              return (
                <div key={user.email} style={{ background: "var(--bg-primary)", borderRadius: "8px", padding: "1rem", borderLeft: `3px solid ${color}` }}>
                  <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong>
                  {user.description && (
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{user.description}</div>
                  )}
                  <div style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "6px", marginTop: "0.75rem" }}>
                    <div><span style={{ color: "var(--text-muted)" }}>{m.labelEmail}</span> <span style={{ color: "var(--text-primary)" }}>{user.email}</span></div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>{m.labelApplication}</span>{" "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {user.roles.length > 0 ? `${user.roles.join(", ")} → ${appNames(user.roles).join(", ") || m.noTile}` : m.noAccess}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>{m.labelOrganizations}</span>{" "}
                      <span style={{ color: "var(--text-secondary)" }}>
                        {user.memberships.map((membership) => `${membership.organization} (${membership.role})`).join(", ") || m.none}
                      </span>
                    </div>
                    {user.daeRole && (
                      <div><span style={{ color: "var(--text-muted)" }}>{m.labelDae}</span> <span style={{ color: "var(--text-secondary)" }}>{user.daeRole}</span></div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    {user.memberships.map((membership) => {
                      const org = findOrganization(membership.organization);
                      return (
                        <button key={membership.organization} style={orgButtonStyle(org?.primaryColor || color)} onClick={() => handleBrandedLogin(membership.organization)}>
                          {m.loginTo(org?.displayName || membership.organization)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
