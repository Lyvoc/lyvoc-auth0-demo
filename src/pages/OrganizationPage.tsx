import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
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
        <h1>Organizations & Branding</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          No organization in the demo configuration: add some to the customer's tfvars file, apply Terraform and run
          <code> npm run config</code>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Organizations & Branding</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Multi-brand B2B CIAM architecture using Auth0 Organizations.
        Each organization has its own visual identity, and application access is controlled by roles within each organization.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button style={tabStyle(activeTab === "demo", primaryColor)} onClick={() => setActiveTab("demo")}>
          🎨 Live Demo
        </button>
        <button style={tabStyle(activeTab === "architecture", primaryColor)} onClick={() => setActiveTab("architecture")}>
          🏗️ Architecture
        </button>
        <button style={tabStyle(activeTab === "accounts", primaryColor)} onClick={() => setActiveTab("accounts")}>
          👤 Test Accounts
        </button>
      </div>

      {/* DEMO TAB */}
      {activeTab === "demo" && (
        <>
          {/* Organization Selection */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Step 1: Select an Organization</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              Click an organization to preview its theme. The login page uses the organization's logo and colors.
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
                      Primary: {selectedBranding.theme.primaryColor} · ID: {getOrgId(selectedOrgForDemo)}
                    </div>
                  </div>
                  <button
                    style={{ ...orgButtonStyle(primaryColor), marginLeft: "auto", padding: "0.6rem 1.2rem", fontWeight: 600 }}
                    onClick={() => handleBrandedLogin(selectedOrgForDemo)}
                  >
                    Login to {selectedBranding.displayName}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role-Based Access Demo */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Step 2: Role-Based Application Access</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              Users see different applications based on their organization roles. Select roles to preview access:
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
                  Application Dashboard
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
                  Access Summary
                </h4>
                <RoleAccessSummary roles={demoRoles} primaryColor={primaryColor} />
              </div>
            </div>
          </div>

          {/* Step 3: Launch App */}
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Step 3: Launch an Application</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              Click an accessible app tile above to select it, then authenticate into it scoped to the selected organization.
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
                    {" "}· Roles: {demoRoles.join(", ")}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                  <button
                    style={{ ...orgButtonStyle(primaryColor), padding: "0.7rem 1.4rem", fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap" }}
                    onClick={() => handleBrandedLogin(selectedOrgForDemo)}
                  >
                    Launch {selectedApp.name} →
                  </button>
                  <button
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", fontSize: "0.8rem", cursor: "pointer", padding: "0.25rem" }}
                    onClick={() => setSelectedApp(null)}
                  >
                    Clear selection
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
                ← Click an accessible app tile in Step 2 to select it
              </div>
            )}
          </div>

          {/* Multi-Org User Demo */}
          {multiOrgUser && (
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Multi-Organization Users</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                The app passes the organization in the authorization request: the same user logs into each of their
                organizations in turn, with that organization's branding and roles.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {multiOrgUser.memberships.map((m) => {
                  const org = findOrganization(m.organization);
                  return (
                    <button
                      key={m.organization}
                      style={orgButtonStyle(org?.primaryColor || primaryColor)}
                      onClick={() => handleBrandedLogin(m.organization)}
                    >
                      Login to {org?.displayName || m.organization} ({m.roles.join(", ")})
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                Use <code>{multiOrgUser.email}</code>, member of {multiOrgUser.memberships.length} organizations.
              </p>
            </div>
          )}
        </>
      )}

      {/* ARCHITECTURE TAB */}
      {activeTab === "architecture" && (
        <>
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>🏗️ The Model: 1 Organization per Brand</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Each Auth0 Organization = one brand (or brand and country). Applications are NOT separate organizations:
              they are scoped within the organization via roles.
            </p>

            <hr style={dividerStyle} />

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>Organization</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>Auth0 Organization</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "var(--text-primary)" }}>Members</th>
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
                        {testUsers.filter((user) => user.memberships.some((m) => m.organization === org.name)).length} test account(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>🔑 Key Design Decisions</h2>
            <ul style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <li>
                <strong>One organization per brand</strong> (or per brand and country): the finest granularity at
                which branding, language and support contact differ.
              </li>
              <li>
                <strong>Applications are NOT separate organizations.</strong> Access to{" "}
                {Object.values(APPLICATIONS).map((app) => app.name).join(", ")} is controlled by the user's roles within
                the organization, not by which organization they are in.
              </li>
              <li>
                <strong>A single Auth0 database connection serves all organizations.</strong> Users are stored once
                and added as members to one or more organizations.
              </li>
              <li>
                <strong>The organization is URL-driven:</strong> the portal passes the <code>organization</code>
                parameter in the authorization request, and Auth0 shows that organization's branded login page.
              </li>
            </ul>
          </div>
        </>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === "accounts" && (
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>👤 Test Accounts</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Each account demonstrates a specific persona or access pattern. They share one password:{" "}
            <code>{demoConfig.testUsersPassword || "given by the presenter"}</code>
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
                    <div><span style={{ color: "var(--text-muted)" }}>Email:</span> <span style={{ color: "var(--text-primary)" }}>{user.email}</span></div>
                    {user.memberships.map((m) => (
                      <div key={m.organization}>
                        <span style={{ color: "var(--text-muted)" }}>{m.organization}:</span>{" "}
                        <span style={{ color: "var(--text-secondary)" }}>{m.roles.join(", ")} → {appNames(m.roles).join(", ") || "no application"}</span>
                      </div>
                    ))}
                    {user.daeRole && (
                      <div><span style={{ color: "var(--text-muted)" }}>DAE:</span> <span style={{ color: "var(--text-secondary)" }}>{user.daeRole}</span></div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    {user.memberships.map((m) => {
                      const org = findOrganization(m.organization);
                      return (
                        <button key={m.organization} style={orgButtonStyle(org?.primaryColor || color)} onClick={() => handleBrandedLogin(m.organization)}>
                          Login to {org?.displayName || m.organization}
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
