import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { demoConfig } from "../config/demo";

// Asks the "Demo MFA" Action for a second factor (step-up)
const MFA_POLICY = "http://schemas.openid.net/pape/policies/2007/06/multi-factor";

const AdaptiveMfaPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const database = demoConfig.connections.database;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>Adaptive MFA</h2>
      <p>
        <b>Adaptive Multi-Factor Authentication (MFA)</b> is a security feature that evaluates risk factors such as user location, device, and behavior to determine when to prompt for additional authentication. This helps balance security and user experience by only requiring MFA when necessary.
      </p>
      <p>
        The button below logs in with the <b>{database}</b> database connection and asks for a second factor
        (step-up): a regular login does not require MFA, this one does.
      </p>

      <button
        onClick={() => {
          loginWithRedirect({
            authorizationParams: {
              connection: database,
              redirect_uri: window.location.origin + "/token",
              scope: "openid profile email",
              prompt: "login",
              acr_values: MFA_POLICY,
            }
          });
          }}
        style={{
          marginTop: 32,
          background: "#3182ce",
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
        Log In with MFA (step-up)
      </button>
    </div>
  );
};

export default AdaptiveMfaPage;
