import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App";
import "./index.css";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { demoConfig } from "./config/demo";
import { LanguageProvider, currentLocale } from "./i18n";

// Environment variables override the demo configuration (spa/src/config/demo.json)
const domain = import.meta.env.VITE_AUTH0_DOMAIN || demoConfig.auth0.domain;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || demoConfig.auth0.clientId;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || demoConfig.auth0.audience;

// Validate Auth0 configuration
if (!domain || !clientId) {
  console.error("Auth0 configuration missing: generate spa/src/config/demo.json (npm run config) or set in spa/.env:");
  console.error("- VITE_AUTH0_DOMAIN");
  console.error("- VITE_AUTH0_CLIENT_ID");
  throw new Error("Auth0 domain and client ID must be set (spa/src/config/demo.json or spa/.env)");
}

// Validate domain format (custom domains like demo-auth0.lyvoc.com are also valid)
if (!domain.includes('.auth0.com') && !domain.includes('.us.auth0.com') && !domain.includes('.eu.auth0.com') && !domain.includes('.au.auth0.com')) {
  console.info("Using custom Auth0 domain:", domain);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Custom wrapper to use navigate in onRedirectCallback
function Auth0WithRouter() {
  const navigate = useNavigate();
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + "/token",
        audience: audience,
        scope: "openid profile email read:data",
        // Auth0 pages in the portal's language (each login sends the current one)
        ui_locales: currentLocale(),
      }}
      onRedirectCallback={(appState) => {
        // Navigate to the intended page or /token if none specified
        navigate(appState?.returnTo || "/token");
      }}
    >
      <App />
    </Auth0Provider>
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Auth0WithRouter />
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);