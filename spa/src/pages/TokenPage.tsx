import React from "react";
import { useAuth0 } from "../auth";
import LoginButton from "../components/LoginButton";
import { defineMessages, useMessages } from "../i18n";

const MESSAGES = defineMessages(
  {
    loading: "Loading...",
    authError: "Authentication Error",
    logInAgain: "Log In Again",
    processing: "Processing authentication...",
    loginRequired: "You need to log in to view your token",
    loginExplanation: (
      <>
        Clicking <b>Log In</b> will trigger the default Auth0 Universal Login experience, where all connections (databases, social, enterprise, passwordless, etc.) enabled for this application in your tenant will be shown.
      </>
    ),
    yourTokens: "Your Auth0 Tokens",
    accessToken: "Access Token",
    idToken: "ID Token",
    rawToken: "Raw Token:",
    copied: "Copied!",
    copy: "📋 Copy",
    noAccessToken: "No access token available.",
    noIdToken: "No ID token available.",
    header: "Header:",
    payload: "Payload:",
    signature: "Signature:",
    user: "User:",
    idpInitiated: "(IdP-initiated, not decoded)",
    unknown: "Unknown",
  },
  {
    loading: "Chargement...",
    authError: "Erreur d'authentification",
    logInAgain: "Se reconnecter",
    processing: "Authentification en cours...",
    loginRequired: "Connectez-vous pour afficher votre token",
    loginExplanation: (
      <>
        Cliquer sur <b>Se connecter</b> ouvre l'expérience Auth0 Universal Login par défaut, qui affiche toutes les connexions (bases de données, réseaux sociaux, entreprise, sans mot de passe, etc.) activées pour cette application dans votre tenant.
      </>
    ),
    yourTokens: "Vos tokens Auth0",
    accessToken: "Access Token",
    idToken: "ID Token",
    rawToken: "Token brut :",
    copied: "Copié !",
    copy: "📋 Copier",
    noAccessToken: "Aucun access token disponible.",
    noIdToken: "Aucun ID token disponible.",
    header: "Header :",
    payload: "Payload :",
    signature: "Signature :",
    user: "Utilisateur :",
    idpInitiated: "(initié par l'IdP, non décodé)",
    unknown: "Inconnu",
  }
);


const decodeJWT = (token: string) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return {
      header: JSON.parse(atob(parts[0])),
      payload: JSON.parse(atob(parts[1])),
      signature: parts[2],
    };
  } catch {
    return null;
  }
};


const TokenPage = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently, getIdTokenClaims, loginWithRedirect, user, error: authError } = useAuth0();
  const [accessToken, setAccessToken] = React.useState<string>("");
  const [idTokenValue, setIdTokenValue] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [copiedAccess, setCopiedAccess] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [manualTokens, setManualTokens] = React.useState<{ accessToken?: string; idToken?: string } | null>(null);
  const [authTimeout, setAuthTimeout] = React.useState(false);
  const m = useMessages(MESSAGES);

  // Add timeout for authentication processing
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if ((urlParams.get('code') || urlParams.get('state')) && !isAuthenticated) {
      const timer = setTimeout(() => {
        setAuthTimeout(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Helper to parse hash fragment for tokens
  function parseHashTokens(hash: string) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    return { idToken, accessToken };
  }

  // On mount, check for tokens in hash (IdP-initiated SSO)
  React.useEffect(() => {
    if (!isAuthenticated && window.location.hash && (window.location.hash.includes('id_token') || window.location.hash.includes('access_token'))) {
      const { idToken, accessToken } = parseHashTokens(window.location.hash);
      if (idToken || accessToken) {
        // Store in localStorage for later use
        if (idToken) localStorage.setItem('idp_id_token', idToken);
        if (accessToken) localStorage.setItem('idp_access_token', accessToken);
        setManualTokens({ 
          idToken: idToken || undefined, 
          accessToken: accessToken || undefined 
        });
        // Remove hash from URL for cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // On normal navigation, try to load from localStorage if not authenticated
      if (!isAuthenticated) {
        const idToken = localStorage.getItem('idp_id_token') || undefined;
        const accessToken = localStorage.getItem('idp_access_token') || undefined;
        if (idToken || accessToken) {
          setManualTokens({ idToken, accessToken });
        }
      }
    }
  }, [isAuthenticated]);

  // Normal Auth0 SDK token fetch
  React.useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently()
        .then((token) => setAccessToken(token ?? ""))
        .catch((err) => setError(err.message));
      getIdTokenClaims()
        .then((claims) => {
          if (claims && claims.__raw) {
            setIdTokenValue(claims.__raw);
          } else {
            setIdTokenValue("");
          }
        })
        .catch(() => setIdTokenValue(""));
    }
  }, [isAuthenticated, getAccessTokenSilently, getIdTokenClaims]);

  // Use SDK tokens if authenticated, else manual tokens if present
  const effectiveAccessToken = isAuthenticated ? accessToken : manualTokens?.accessToken || "";
  const effectiveIdToken = isAuthenticated ? idTokenValue : manualTokens?.idToken || "";
  const decodedAccess = decodeJWT(effectiveAccessToken);
  const decodedId = decodeJWT(effectiveIdToken);

  const handleCopyAccess = () => {
    navigator.clipboard.writeText(effectiveAccessToken);
    setCopiedAccess(true);
    setTimeout(() => setCopiedAccess(false), 1200);
  };
  const handleCopyId = () => {
    navigator.clipboard.writeText(effectiveIdToken);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1200);
  };


  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-text" style={{ color: "#63b3ed", fontSize: 24 }}>{m.loading}</div>
      </div>
    );
  }

  // Show auth error if exists
  if (authError) {
    return (
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <h2 style={{ color: "#fc8181" }}>{m.authError}</h2>
        <div style={{ color: "#b2b7c2", margin: "16px 0 24px 0", fontSize: 16 }}>
          {authError.message}
        </div>
        {/* The Auth0 session survives a denied login: ask for the credentials
            again, or the next login silently reuses it (without organization) */}
        <button
          onClick={() => loginWithRedirect({ authorizationParams: { prompt: "login" } })}
          className="button login"
        >
          {m.logInAgain}
        </button>
      </div>
    );
  }

  // Add extra time for Auth0 state to settle after callback
  if (!isAuthenticated && !manualTokens) {
    // If we just got redirected (has code or state params), show loading a bit longer
    const urlParams = new URLSearchParams(window.location.search);
    if ((urlParams.get('code') || urlParams.get('state')) && !authTimeout) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <div className="loading-text" style={{ color: "#63b3ed", fontSize: 24 }}>{m.processing}</div>
        </div>
      );
    }
    
    return (
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <h2 style={{ color: "#f7fafc" }}>{m.loginRequired}</h2>
        <div style={{ color: "#b2b7c2", margin: "16px 0 24px 0", fontSize: 16 }}>
          {m.loginExplanation}
        </div>
        <LoginButton />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1600, width: "100%", margin: "2rem auto", background: "#2d313c", borderRadius: 15, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ color: "#63b3ed", marginBottom: 24, textAlign: "center" }}>{m.yourTokens}</h2>
      {error && <div style={{ color: "#fc8181", marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "flex", gap: 32, justifyContent: "center", width: "100%" }}>
        {/* Access Token Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ color: "#ed8936", marginBottom: 8 }}>{m.accessToken}</h3>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#a0aec0", fontSize: 15 }}>{m.rawToken}</span>
            <button onClick={handleCopyAccess} className="token-copy-button" style={{ fontSize: 14 }}>
              {copiedAccess ? m.copied : m.copy}
            </button>
          </div>
          <div style={{ background: "#1a1e27", padding: 16, borderRadius: 8, color: "#e2e8f0", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 24, maxHeight: 200, overflow: "auto" }}>
            {effectiveAccessToken || m.noAccessToken}
          </div>
          {decodedAccess && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.header}</div>
                <pre className="token-decoded-display">{JSON.stringify(decodedAccess.header, null, 2)}</pre>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.payload}</div>
                <pre className="token-decoded-display">{JSON.stringify(decodedAccess.payload, null, 2)}</pre>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.signature}</div>
                <div className="token-raw-display">{decodedAccess.signature}</div>
              </div>
            </>
          )}
        </div>
        {/* ID Token Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ color: "#38a169", marginBottom: 8 }}>{m.idToken}</h3>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#a0aec0", fontSize: 15 }}>{m.rawToken}</span>
            <button onClick={handleCopyId} className="token-copy-button" style={{ fontSize: 14 }}>
              {copiedId ? m.copied : m.copy}
            </button>
          </div>
          <div style={{ background: "#1a1e27", padding: 16, borderRadius: 8, color: "#e2e8f0", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 24, maxHeight: 200, overflow: "auto" }}>
            {effectiveIdToken || m.noIdToken}
          </div>
          {decodedId && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.header}</div>
                <pre className="token-decoded-display">{JSON.stringify(decodedId.header, null, 2)}</pre>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.payload}</div>
                <pre className="token-decoded-display">{JSON.stringify(decodedId.payload, null, 2)}</pre>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div className="token-section-label">{m.signature}</div>
                <div className="token-raw-display">{decodedId.signature}</div>
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ marginTop: 32, color: "#a0aec0", textAlign: "center" }}>
        <strong>{m.user}</strong> {user?.email || user?.name || (manualTokens?.idToken ? m.idpInitiated : m.unknown)}
      </div>
    </div>
  );
};

export default TokenPage;
