import { NavLink } from "react-router-dom";
import { useAuth0 } from "../auth";
import { useTheme } from "../context/ThemeContext";
import { OrganizationBadge } from "./OrganizationPicker";
import { demoConfig } from "../config/demo";
import { defineMessages, LOCALE_LABELS, LOCALES, useLanguage, useMessages } from "../i18n";

const MESSAGES = defineMessages(
  {
    demo: "CIC Demo",
    welcome: "Welcome",
    adaptiveMfa: "Adaptive MFA",
    token: "Token / Profile",
    organization: "Organization",
    scenarios: "Scenarios",
    dae: "DAE Extension",
    adminUi: "Admin UI ↗",
    passwordless: "Passwordless Login",
    universalLogin: "Universal Login",
    logout: "Log Out",
    logoutConfirm: "Are you sure you want to log out?",
    settings: "⚙ Settings",
    language: "Language",
  },
  {
    demo: "Démo CIC",
    welcome: "Accueil",
    adaptiveMfa: "MFA adaptative",
    token: "Token / Profil",
    organization: "Organisation",
    scenarios: "Scénarios",
    dae: "Extension DAE",
    adminUi: "Admin UI ↗",
    passwordless: "Connexion sans mot de passe",
    universalLogin: "Universal Login",
    logout: "Se déconnecter",
    logoutConfirm: "Voulez-vous vraiment vous déconnecter ?",
    settings: "⚙ Paramètres",
    language: "Langue",
  }
);

const { features } = demoConfig;

const Sidebar = () => {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const { theme, currentOrgBranding } = useTheme();
  const { locale, setLocale } = useLanguage();
  const m = useMessages(MESSAGES);

  const handlePasswordless = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: demoConfig.connections.passwordless || "email",
        redirect_uri: window.location.origin + "/token"
      }
    });
  };

  return (
    <nav
      style={{
        width: 220,
        background: "var(--bg-sidebar)",
        height: "100vh",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 10,
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        {theme.logoUrl && theme.logoUrl.trim() && (
          <img
            src={theme.logoUrl}
            alt="Logo"
            style={{ maxWidth: 140, maxHeight: 60, marginBottom: 12, objectFit: "contain" }}
          />
        )}
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18 }}>
          {theme.customerName && theme.customerName.trim() ? theme.customerName : demoConfig.customer.name} {m.demo}
        </div>

        {/* Organization Badge */}
        {currentOrgBranding && isAuthenticated && (
          <div style={{ marginTop: "1rem" }}>
            <OrganizationBadge
              orgName={currentOrgBranding.brandId}
              displayName={currentOrgBranding.displayName}
              logoUrl={currentOrgBranding.logoUrl}
              primaryColor={currentOrgBranding.theme.primaryColor}
              onSwitch={() => {
                // Navigate to organization page to switch
                window.location.href = "/organization";
              }}
            />
          </div>
        )}
      </div>
      <NavLink to="/" end style={({ isActive }) => ({
        color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
      })}>
        {m.welcome}
      </NavLink>
      {features.mfa !== "off" && (
        <NavLink to="/adaptive-mfa" style={({ isActive }) => ({
          color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 17,
          marginBottom: 16,
        })}>
          {m.adaptiveMfa}
        </NavLink>
      )}
      <NavLink to="/token" style={({ isActive }) => ({
        color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
      })}>
        {m.token}
      </NavLink>

      <NavLink to="/organization" style={({ isActive }) => ({
        color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
      })}>
        {m.organization}
      </NavLink>

      <NavLink to="/scenarios" style={({ isActive }) => ({
        color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
      })}>
        {m.scenarios}
      </NavLink>

      {features.dae && (
        <NavLink
          to="/dae-extension"
          style={({ isActive }) => ({
            color: isActive ? "#63b3ed" : "#e2e8f0",
            background: isActive ? "#23263a" : "#2b6cb0",
            border: isActive ? "2px solid #63b3ed" : "none",
            borderRadius: 8,
            padding: "0.9rem 1.2rem",
            fontWeight: 600,
            fontSize: 16,
            marginTop: 16,
            marginBottom: 8,
            display: "block",
            textDecoration: "none",
            textAlign: "left",
            transition: "background 0.2s, color 0.2s",
          })}
        >
          {m.dae}
        </NavLink>
      )}

      {demoConfig.adminUiUrl && (
        <a
          href={demoConfig.adminUiUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 16,
            background: "#38a169",
            color: "#fff",
            borderRadius: 8,
            padding: "0.9rem 1.2rem",
            fontWeight: 600,
            fontSize: 16,
            display: "block",
            textDecoration: "none",
            textAlign: "left",
          }}
        >
          {m.adminUi}
        </a>
      )}

      {features.passwordless && (
        <button
          onClick={handlePasswordless}
          style={{
            marginTop: 16,
            background: "#ed8936",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.9rem 1.2rem",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {m.passwordless}
        </button>
      )}

      {/* Universal Login Button */}
      <button
        onClick={() => loginWithRedirect()}
        style={{
          marginTop: 16,
          background: "#5830c5ff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "0.9rem 1.2rem",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {m.universalLogin}
      </button>
      <button
        onClick={() => {
          if (window.confirm(m.logoutConfirm)) {
            // Enhanced universal logout - clear all browser storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear Auth0 cache if available
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => {
                  if (name.includes('auth0') || name.includes('token')) {
                    caches.delete(name);
                  }
                });
              });
            }
            
            // Small delay to ensure cleanup completes before logout
            setTimeout(() => {
              logout({ 
                logoutParams: { 
                  returnTo: window.location.origin, 
                  federated: true,
                  // Force logout from IdP regardless of session state
                  prompt: 'none'
                } 
              });
            }, 100);
          }
        }}
        style={{
          marginTop: 16,
          background: "#c53030",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "0.9rem 1.2rem",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {m.logout}
      </button>
      {/* Spacer to push settings to bottom */}
      <div style={{ flex: 1 }} />

      {/* Display language (also the language of the Auth0 login pages) */}
      <div role="group" aria-label={m.language} style={{ display: "flex", gap: 6, marginTop: 16 }}>
        {LOCALES.map((value) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            title={LOCALE_LABELS[value]}
            aria-pressed={value === locale}
            style={{
              flex: 1,
              padding: "0.4rem 0",
              borderRadius: 6,
              border: `1px solid ${value === locale ? "var(--primary-color)" : "var(--text-muted)"}`,
              background: value === locale ? "var(--primary-color)" : "transparent",
              color: value === locale ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>

      <NavLink to="/settings" style={({ isActive }) => ({
        color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 15,
        paddingTop: 16,
        borderTop: "1px solid var(--text-muted)",
        marginTop: 16,
      })}>
        {m.settings}
      </NavLink>    </nav>
  );
};

export default Sidebar;
