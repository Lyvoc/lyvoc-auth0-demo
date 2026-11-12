import React from "react";
import { useAuth0 } from "../auth";
import { demoConfig } from "../config/demo";
import { defineMessages, useMessages } from "../i18n";

const MESSAGES = defineMessages(
  {
    title: "Adaptive MFA",
    intro: (
      <>
        <b>Adaptive Multi-Factor Authentication (MFA)</b> is a security feature that evaluates risk factors such as user location, device, and behavior to determine when to prompt for additional authentication. This helps balance security and user experience by only requiring MFA when necessary.
      </>
    ),
    stepUp: (database: string) => (
      <>
        The button below logs in with the <b>{database}</b> database connection and asks for a second factor
        (step-up): a regular login does not require MFA, this one does.
      </>
    ),
    button: "Log In with MFA (step-up)",
  },
  {
    title: "MFA adaptative",
    intro: (
      <>
        <b>L'authentification multifacteur (MFA) adaptative</b> est une fonctionnalité de sécurité qui évalue des facteurs de risque tels que la localisation, l'appareil et le comportement de l'utilisateur pour déterminer quand demander une authentification supplémentaire. Elle concilie ainsi sécurité et expérience utilisateur en n'exigeant la MFA que lorsque c'est nécessaire.
      </>
    ),
    stepUp: (database) => (
      <>
        Le bouton ci-dessous vous connecte avec la connexion de base de données <b>{database}</b> et demande un second facteur
        (step-up) : une connexion classique n'exige pas de MFA, celle-ci si.
      </>
    ),
    button: "Se connecter avec MFA (step-up)",
  }
);

// Asks the "Demo MFA" Action for a second factor (step-up)
const MFA_POLICY = "http://schemas.openid.net/pape/policies/2007/06/multi-factor";

const AdaptiveMfaPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const database = demoConfig.connections.database;
  const m = useMessages(MESSAGES);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>{m.title}</h2>
      <p>{m.intro}</p>
      <p>{m.stepUp(database)}</p>

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
        {m.button}
      </button>
    </div>
  );
};

export default AdaptiveMfaPage;
