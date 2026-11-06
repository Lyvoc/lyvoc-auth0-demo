
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Sidebar from "./components/Sidebar";
import DaeExtensionPage from "./pages/DaeExtensionPage";
import Welcome from "./pages/Welcome";
import TokenPage from "./pages/TokenPage";
import AdaptiveMfaPage from "./pages/AdaptiveMfaPage";
import ActionsPage from "./pages/ActionsPage";
import OrganizationPage from "./pages/OrganizationPage";
import SettingsPage from "./pages/SettingsPage";
import { OrganizationProvider } from "./context/OrganizationContext";
import { useTheme } from "./context/ThemeContext";
import { getOrgId } from "./config/organizationBranding";

/**
 * Inner App component that has access to theme context
 */
const AppContent = () => {
  const { loginWithRedirect, isAuthenticated, getIdTokenClaims } = useAuth0();
  const { applyOrganizationTheme } = useTheme();

  // Handle organization invitations and URL-based org routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitation = params.get("invitation");
    const organization = params.get("organization");
    const organizationName = params.get("organization_name");
    const orgParam = params.get("org"); // Short form for org routing

    // Handle invitation flow
    if (invitation && organization) {
      loginWithRedirect({
        authorizationParams: {
          invitation,
          organization,
          ...(organizationName ? { organization_name: organizationName } : {}),
        },
      });
      return;
    }

    // Handle URL-based organization routing (e.g., ?org=<organization name> or ?org=org_xxx)
    if (orgParam && !isAuthenticated) {
      // Convert org name to org ID if needed
      const orgId = getOrgId(orgParam);
      loginWithRedirect({
        authorizationParams: {
          organization: orgId,
          redirect_uri: window.location.origin + "/token",
          scope: "openid profile email",
        },
      });
      return;
    }

    // Apply theme preview from URL
    if (orgParam) {
      applyOrganizationTheme(orgParam);
    }
  }, [loginWithRedirect, isAuthenticated, applyOrganizationTheme]);

  // Extract org from token and apply theme after authentication
  useEffect(() => {
    const applyOrgThemeFromToken = async () => {
      if (!isAuthenticated) return;
      
      try {
        const claims = await getIdTokenClaims();
        if (claims) {
          const orgId = (claims as Record<string, unknown>)["org_id"] as string | undefined;
          const orgName = (claims as Record<string, unknown>)["org_name"] as string | undefined;
          
          if (orgName) {
            applyOrganizationTheme(orgName);
          } else if (orgId) {
            applyOrganizationTheme(orgId);
          }
        }
      } catch (error) {
        console.error("Failed to extract org from token:", error);
      }
    };

    applyOrgThemeFromToken();
  }, [isAuthenticated, getIdTokenClaims, applyOrganizationTheme]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          boxSizing: "border-box",
          marginLeft: 220,
          padding: "2rem 1rem",
          background: "var(--bg-primary)",
        }}
      >
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/token" element={<TokenPage />} />
          <Route path="/adaptive-mfa" element={<AdaptiveMfaPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/organization" element={<OrganizationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dae-extension" element={<DaeExtensionPage />} />
        </Routes>
      </main>
    </div>
  );
};

/**
 * Main App component wrapped with OrganizationProvider
 */
const App = () => {
  return (
    <OrganizationProvider>
      <AppContent />
    </OrganizationProvider>
  );
};

export default App;