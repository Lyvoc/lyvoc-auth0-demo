import React from "react";
import { useAuth0 } from "../auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { claimName, demoConfig, DemoOrganization, DemoTestUser } from "../config/demo";
import { defineMessages, useMessages } from "../i18n";

/**
 * Demo scenarios (docs/scenarios.md), one sub-tab per scenario, built from the
 * demo configuration (spa/src/config/demo.json): accounts, organizations and
 * claims follow the customer. A scenario whose accounts are missing is hidden.
 */

type Action = { label: string; run: () => void };

type Step = {
  id: string;
  title: string;
  steps: React.ReactNode;
  expected: React.ReactNode;
  action?: Action;
};

type Scenario = {
  id: string;
  tab: string;
  title: string;
  point?: React.ReactNode;
  intro?: React.ReactNode;
  steps?: Step[];
  body?: React.ReactNode;
  talkingPoint?: React.ReactNode;
  note?: React.ReactNode;
};

// MFA policy the "Demo access" Action answers with a second factor (step-up)
const MFA_POLICY = "http://schemas.openid.net/pape/policies/2007/06/multi-factor";

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: 10,
  padding: "1.25rem 1.5rem",
  marginBottom: "1.5rem",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.55rem 1rem",
  background: active ? "var(--primary-color)" : "transparent",
  border: `1px solid ${active ? "var(--primary-color)" : "#3a3f50"}`,
  borderRadius: 6,
  color: active ? "#fff" : "var(--text-secondary)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 500,
  whiteSpace: "nowrap",
});

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.6rem 0.75rem",
  color: "var(--text-muted)",
  fontWeight: 600,
  borderBottom: "1px solid #3a3f50",
};
const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  verticalAlign: "top",
  color: "var(--text-primary)",
  borderBottom: "1px solid #2d3142",
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  background: "var(--primary-color)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "0.4rem 0.8rem",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const C = ({ children }: { children: React.ReactNode }) => (
  <code
    style={{
      fontFamily: "monospace",
      background: "#1a1d2e",
      borderRadius: 4,
      padding: "1px 5px",
      color: "#e2e8f0",
      fontSize: "0.9em",
      wordBreak: "break-word",
    }}
  >
    {children}
  </code>
);

const B = ({ children }: { children: React.ReactNode }) => <b>{children}</b>;

type N = React.ReactNode;

// Quotes of Auth0 / the web application (what the presenter literally sees) stay in English
const MESSAGES = defineMessages(
  {
    // Page
    pageTitle: "Demo scenarios",
    pageIntro: (customer: string) => (
      <>
        Scenarios to present the demo to a prospect, and to check it before a session. Each one gives its point (what
        to say), the steps and the expected result, for {customer}'s accounts and organizations.
      </>
    ),
    point: "Point:",
    colon: ":",
    talkingPoint: "Talking point:",
    thSteps: "Steps",
    thExpected: "Expected",

    // Actions
    logInTo: (org: string) => `Log In to ${org}`,
    passwordLogin: "Email / password login",
    codeLogin: "Log In with a code",
    mfaLogin: "Log In with MFA (step-up)",
    openWebApp: "Open the web application",
    openAdminUi: "Open the Admin UI ↗",
    openDae: "Open the DAE page",
    loginWith: (button: N, email: N) => (
      <>
        {button} with {email}
      </>
    ),

    // Before the demo
    beforeTab: "Before the demo",
    beforePrepare: (webAppUrl?: string) => (
      <>
        Prepare the customer and start the applications: <C>terraform apply</C>, <C>npm run config</C>,{" "}
        <C>npm run dev</C> (portal), <C>npm run web</C> (web application{webAppUrl ? `, ${webAppUrl}` : ""}).
      </>
    ),
    beforeReset: (
      <>
        <B>Reset the test accounts</B>: <C>terraform apply</C> again puts back their password, roles and organizations
        and unblocks them, even after changes made during a previous demo.
      </>
    ),
    beforeLogout:
      "Log out of the portal, the web application, the Admin UI and the DAE; for a clean run, use a private browser window.",
    testAccounts: "Test accounts",
    passwordInfo: (password: N) => (
      <>
        Password: {password}. The <C>example.com</C> addresses receive nothing (password login only).
      </>
    ),
    givenByPresenter: "given by the presenter",
    thAccount: "Account",
    thOrganizations: "Organizations",
    thAppRole: "Application role",
    thUsedFor: "Used for",
    noOrganization: "none",
    noRole: "none",
    readingTokens: "Reading the tokens",
    tokensIntro: (action: N) => (
      <>
        The <B>Token / Profile</B> page decodes the tokens. The demo's claims, set by the {action} Action:
      </>
    ),
    thClaim: "Claim",
    thContent: "Content",
    claimAppRoles: "Application roles (application access)",
    claimOrgRoles: "Roles in the login organization (organization login only)",
    claimOrganizations: "The user's organizations",
    claimPermissions: "Permissions of the application role + the organization role",
    claimOrgId: "Organization of the login (organization login only)",
    claimAmr: "mfa after a second factor",

    // 1. Login methods
    loginTab: "1. Login methods",
    loginTitle: "1. Login methods",
    loginPoint: "One Auth0 tenant, several ways to log in, chosen per user and per situation.",
    loginTalkingPoint: "MFA when the operation needs it (payment, sensitive data), not at every login.",
    passwordTitle: "Password",
    passwordSteps: (email: N) => <>Email / password login, {email}</>,
    passwordExpected: (claim: N) => <>Logged in. {claim}</>,
    passwordlessTitle: "Passwordless",
    passwordlessSteps: (email: N) => <>Passwordless login, {email}, then the code received by email</>,
    passwordlessExpected: (
      <>
        Logged in to the same account as with its password (<C>sub</C> starts with <C>auth0|</C>): one account, two
        login methods
      </>
    ),
    unknownTitle: "Unknown address",
    unknownSteps: "Passwordless login with an address that has no account",
    unknownExpected:
      "Auth0 does not reveal it and sends nothing: no account is created (sign-ups are closed, accounts come from the administration)",
    stepUpTitle: "Step-up MFA",
    stepUpSteps: (email: N, button: N) => (
      <>
        Log in as {email} (no second factor asked), then {button}
      </>
    ),
    stepUpExpected: (
      <>
        The second factor is asked only now (enrollment the first time: authenticator app). ID token: <C>amr</C>{" "}
        contains <C>mfa</C>
      </>
    ),

    // 2. B2B organizations
    orgTab: "2. Organizations",
    orgTitle: "2. B2B organizations",
    orgPoint: "Each customer company is an organization, with its own branded login page, its members and their roles.",
    orgTalkingPoint:
      "The same person, a different role in each company they work with; the application receives the role of the organization they chose.",
    brandedTitle: "Branded login",
    brandedExpected: (org: string, roles: N) => (
      <>
        Login page with {org}'s logo and colors. <C>org_id</C> = {org}, {roles}
      </>
    ),
    orgAdminTitle: "Organization admin",
    orgAdminExpected: (roles: N) => <>{roles}, with the organization permissions of that role</>,
    severalTitle: "Several organizations",
    severalSteps: (email: N, first: N, second: N) => (
      <>
        {email} to <B>{first}</B>, log out, then to <B>{second}</B>
      </>
    ),
    severalExpected: (perOrganization: N, appRoles: N) => (
      <>
        {perOrganization}. {appRoles} in both
      </>
    ),
    notMemberTitle: "Not a member",
    notMemberExpected: <>Denied: "user … is not part of the org_… organization"</>,

    // 3. Access model
    accessTab: "3. Access model",
    accessTitle: "3. Access model: applications and organizations",
    accessPoint:
      "Two separate permission lists. An application role gives access to the application; an organization role gives permissions in the organization. Being a member of a company does not open the applications.",
    accessNote: (
      <>
        After a denied login, the portal offers <B>Log In Again</B>, which asks for the credentials again (the Auth0
        session survives a denied login).
      </>
    ),
    noOrgAppTitle: "Application without organization",
    noOrgAppExpected: (appRoles: N, organizations: N) => (
      <>
        Logged in: {appRoles}, {organizations}
      </>
    ),
    noOrgLoginTitle: "... but no organization login",
    deniedNotMember: "Denied: not a member",
    memberNoAppTitle: "Member without application",
    noAccessExpected: (app: string) => <>Denied: "You don't have access to {app}."</>,

    // 4. Single sign-on
    ssoTab: "4. Single sign-on",
    ssoTitle: "4. Single sign-on",
    ssoPoint:
      "Logged in once, the user opens the company's other applications without typing a password again; the access rules apply in every application.",
    ssoNote:
      "On localhost Auth0 asks the consent to the web application at each account's first login: accept it (no consent on a deployed application).",
    ssoStepTitle: "SSO",
    ssoSteps: (email: N) => <>Log in to the portal as {email}, then open the web application</>,
    ssoExpected: (name: string, roles: N) => (
      <>
        Logged in without password: "Hello, {name}", application roles {roles}
      </>
    ),
    deniedThereTitle: "Denied there too",
    deniedThereSteps: (email: N) => (
      <>
        On the web application, <B>Log out</B>, then <B>Log in</B> as {email}
      </>
    ),
    deniedThereExpected: (app: string) => <>"Access denied: You don't have access to {app}."</>,

    // 5. Admin UI
    adminTab: "5. Admin UI",
    adminTitle: "5. Administration: the Admin UI",
    adminPoint:
      "The customer's administrators manage their users, organizations and roles without the Auth0 Dashboard; the changes apply at the next login.",
    adminIntro: "Open the Admin UI with an Admin UI administrator account, make the change, then check it in the portal.",
    adminNote: (
      <>
        Run <C>terraform apply</C> afterwards: it puts the test accounts back.
      </>
    ),
    allowed: (claims: N) => <>Allowed: {claims}</>,
    denied: "Denied",
    giveAccessTitle: "Give an application access",
    giveAccessSteps: (email: N, app: string, role: string, button: N) => (
      <>
        Admin UI: Users, {email}, <B>Add application</B>: {app}, {role}. Then {button} as this account
      </>
    ),
    addOrgTitle: "Add to an organization",
    addOrgSteps: (email: N, org: string, button: N) => (
      <>
        Admin UI: Users, {email}, <B>Add organization</B>: {org}, member (no application). Then {button} as this
        account
      </>
    ),
    removeAccessTitle: "Remove an access",
    removeAccessSteps: (email: N, roles: N) => (
      <>
        Admin UI: Users, {email}, Applications card: remove {roles}. Then log in without organization as this account
      </>
    ),
    removeOrgTitle: "Remove from an organization",
    removeOrgSteps: (email: N, org: string, button: N) => (
      <>
        Admin UI: Users, {email}, Organizations card: <B>Delete</B> on {org}. Then {button} as this account
      </>
    ),
    createUserTitle: "Create a user",
    createUserSteps: (database: N) => (
      <>
        Admin UI: <B>Create user</B>, database {database}, an address of the presenter's mailbox (e.g.{" "}
        <C>firstname.lastname+new@…</C>), organization and application role. Choose the password from the email
        received, then log in
      </>
    ),
    createUserExpected: "The account follows the same rules",

    // 6. DAE
    daeTab: "6. DAE",
    daeTitle: "6. Delegated administration: the DAE",
    daePoint: (email: N) => (
      <>
        Auth0's Delegated Administration extension, next to the Admin UI: an administrator of a customer company manages
        only the users of their organizations. Log in as {email}.
      </>
    ),
    daeTalkingPoint:
      "The DAE does the job with Auth0's own tool (no success message, the list needs a refresh after a creation); the Admin UI covers the same needs with a richer experience (notifications, applications, invitations, logs).",
    scopedTitle: "Scoped list",
    scopedSteps: "DAE: Users",
    scopedExpected: (org: string | undefined) => (
      <>
        Only the members of {org ?? "the administrator's organizations"}, with their organizations and application
        roles.
      </>
    ),
    notListed: (accounts: N) => <>{accounts} are not listed</>,
    daeCreateSteps: (appRole: N) => (
      <>
        <B>Create User</B>: an <C>example.com</C> address, password, organization role <C>member</C>, application role{" "}
        {appRole}
      </>
    ),
    daeCreateExpected: (org: N, appRole: N, action: N) => (
      <>
        The dialog closes. After a few seconds and a refresh, the user is listed with {org} and {appRole} (completed by
        the {action} Action). Visible in the Admin UI too
      </>
    ),
    daeLoginTitle: "Its login",
    daeLoginSteps: (button: N) => <>Portal, {button} with the new account</>,
    changeRoleTitle: "Change a role",
    changeRoleSteps: (appRole: N) => (
      <>
        The user, <B>Actions &gt; Change Profile</B>: application role {appRole}
      </>
    ),
    changeRoleExpected: "The list shows the new role",
    deleteTitle: "Delete",
    deleteSteps: (
      <>
        The user, <B>Actions &gt; Delete</B>
      </>
    ),
    deleteExpected: "The user is gone",
    switchAccount: (email: N) => <>Log out of the DAE, then log in as {email}</>,
    perOrgTitle: "Rights per organization",
    perOrgSteps: (email: N, memberOrg: string, adminOrg: string) => (
      <>
        Log out of the DAE, then log in as {email} (member of {memberOrg}, admin of {adminOrg}). Open a user of each
        organization, try <B>Actions &gt; Block</B>, then <B>Create User</B>
      </>
    ),
    perOrgExpected: (memberOrg: string, adminOrg: string, adminSlug: string) => (
      <>
        Both organizations listed. {memberOrg}: read-only ("Read-only: you are not an admin of this user's
        organizations."). {adminOrg}: the actions work. <B>Create User</B>: no Organization field (a single organization
        managed), the field reads "Organization role in {adminSlug}", and the new user is listed in {adminSlug}
      </>
    ),
    rolesTitle: "DAE roles",
    rolesSteps: (user: N, operator: N, administrator: N) => (
      <>
        Log in to the DAE as {user}, then {operator}, then {administrator}
      </>
    ),
    rolesExpected: (
      <>
        <C>Delegated Admin - User</C>: users only. <C>Operator</C>: users and <B>Logs</B>. <C>Administrator</C>: also{" "}
        <B>Configuration</B> (hooks), in the menu under the name
      </>
    ),
    auditorTitle: "Auditor: read-only",
    auditorExpected: (
      <>
        The users of the organization are listed and can be opened, without <B>Create User</B>; any action is refused
        ("Auditors have read-only access.")
      </>
    ),
    daeRoleNote:
      "The rights inside an organization follow the organization role: a DAE role manages the users of the organizations where the account is admin, and only reads the ones where it is member.",

    // After the demo
    afterTab: "After the demo",
    afterReset: (
      <>
        <C>terraform apply</C>: test accounts back to their password, roles and organizations, unblocked.
      </>
    ),
    afterDelete: "Delete the accounts created during the demo (Admin UI or DAE): Terraform does not manage them.",
  },
  {
    // Page
    pageTitle: "Scénarios de démo",
    pageIntro: (customer) => (
      <>
        Scénarios pour présenter la démo à un prospect et pour la vérifier avant une session. Chacun donne son message
        clé (ce qu'il faut dire), les étapes et le résultat attendu, pour les comptes et organisations de {customer}.
      </>
    ),
    point: "Message clé :",
    colon: " :",
    talkingPoint: "Argument :",
    thSteps: "Étapes",
    thExpected: "Résultat attendu",

    // Actions
    logInTo: (org) => `Se connecter à ${org}`,
    passwordLogin: "Connexion e-mail / mot de passe",
    codeLogin: "Se connecter avec un code",
    mfaLogin: "Se connecter avec MFA (step-up)",
    openWebApp: "Ouvrir l'application web",
    openAdminUi: "Ouvrir l'Admin UI ↗",
    openDae: "Ouvrir la page DAE",
    loginWith: (button, email) => (
      <>
        {button} avec {email}
      </>
    ),

    // Before the demo
    beforeTab: "Avant la démo",
    beforePrepare: (webAppUrl) => (
      <>
        Préparer le client et démarrer les applications : <C>terraform apply</C>, <C>npm run config</C>,{" "}
        <C>npm run dev</C> (portail), <C>npm run web</C> (application web{webAppUrl ? `, ${webAppUrl}` : ""}).
      </>
    ),
    beforeReset: (
      <>
        <B>Réinitialiser les comptes de test</B> : relancer <C>terraform apply</C> leur rend leur mot de passe, leurs
        rôles et leurs organisations et les débloque, même après des modifications faites lors d'une démo précédente.
      </>
    ),
    beforeLogout:
      "Se déconnecter du portail, de l'application web, de l'Admin UI et de la DAE ; pour un déroulé propre, utiliser une fenêtre de navigation privée.",
    testAccounts: "Comptes de test",
    passwordInfo: (password) => (
      <>
        Mot de passe : {password}. Les adresses <C>example.com</C> ne reçoivent rien (connexion par mot de passe
        uniquement).
      </>
    ),
    givenByPresenter: "communiqué par le présentateur",
    thAccount: "Compte",
    thOrganizations: "Organisations",
    thAppRole: "Rôle d'application",
    thUsedFor: "Utilisé pour",
    noOrganization: "aucune",
    noRole: "aucun",
    readingTokens: "Lire les tokens",
    tokensIntro: (action) => (
      <>
        La page <B>Token / Profil</B> décode les tokens. Les claims de la démo, ajoutés par l'Action {action} :
      </>
    ),
    thClaim: "Claim",
    thContent: "Contenu",
    claimAppRoles: "Rôles d'application (accès à l'application)",
    claimOrgRoles: "Rôles dans l'organisation de connexion (connexion à une organisation uniquement)",
    claimOrganizations: "Les organisations de l'utilisateur",
    claimPermissions: "Permissions du rôle d'application + du rôle d'organisation",
    claimOrgId: "Organisation de la connexion (connexion à une organisation uniquement)",
    claimAmr: "mfa après un second facteur",

    // 1. Login methods
    loginTab: "1. Méthodes de connexion",
    loginTitle: "1. Méthodes de connexion",
    loginPoint: "Un seul tenant Auth0, plusieurs façons de se connecter, choisies selon l'utilisateur et la situation.",
    loginTalkingPoint: "Le MFA quand l'opération l'exige (paiement, données sensibles), pas à chaque connexion.",
    passwordTitle: "Mot de passe",
    passwordSteps: (email) => <>Connexion e-mail / mot de passe, {email}</>,
    passwordExpected: (claim) => <>Connecté. {claim}</>,
    passwordlessTitle: "Sans mot de passe",
    passwordlessSteps: (email) => <>Connexion sans mot de passe, {email}, puis le code reçu par e-mail</>,
    passwordlessExpected: (
      <>
        Connecté au même compte qu'avec son mot de passe (<C>sub</C> commence par <C>auth0|</C>) : un compte, deux
        méthodes de connexion
      </>
    ),
    unknownTitle: "Adresse inconnue",
    unknownSteps: "Connexion sans mot de passe avec une adresse qui n'a pas de compte",
    unknownExpected:
      "Auth0 ne le révèle pas et n'envoie rien : aucun compte n'est créé (les inscriptions sont fermées, les comptes viennent de l'administration)",
    stepUpTitle: "MFA step-up",
    stepUpSteps: (email, button) => (
      <>
        Se connecter en tant que {email} (aucun second facteur demandé), puis {button}
      </>
    ),
    stepUpExpected: (
      <>
        Le second facteur n'est demandé qu'à ce moment-là (enrôlement la première fois : application d'authentification).
        ID token : <C>amr</C> contient <C>mfa</C>
      </>
    ),

    // 2. B2B organizations
    orgTab: "2. Organisations",
    orgTitle: "2. Organisations B2B",
    orgPoint:
      "Chaque entreprise cliente est une organisation, avec sa propre page de connexion à ses couleurs, ses membres et leurs rôles.",
    orgTalkingPoint:
      "La même personne a un rôle différent dans chaque entreprise avec laquelle elle travaille ; l'application reçoit le rôle de l'organisation choisie.",
    brandedTitle: "Connexion à la marque",
    brandedExpected: (org, roles) => (
      <>
        Page de connexion avec le logo et les couleurs de {org}. <C>org_id</C> = {org}, {roles}
      </>
    ),
    orgAdminTitle: "Administrateur d'organisation",
    orgAdminExpected: (roles) => <>{roles}, avec les permissions d'organisation de ce rôle</>,
    severalTitle: "Plusieurs organisations",
    severalSteps: (email, first, second) => (
      <>
        {email} : connexion à <B>{first}</B>, déconnexion, puis connexion à <B>{second}</B>
      </>
    ),
    severalExpected: (perOrganization, appRoles) => (
      <>
        {perOrganization}. {appRoles} dans les deux
      </>
    ),
    notMemberTitle: "Non membre",
    notMemberExpected: <>Refusé : "user … is not part of the org_… organization"</>,

    // 3. Access model
    accessTab: "3. Modèle d'accès",
    accessTitle: "3. Modèle d'accès : applications et organisations",
    accessPoint:
      "Deux listes de permissions distinctes. Un rôle d'application donne accès à l'application ; un rôle d'organisation donne des permissions dans l'organisation. Être membre d'une entreprise n'ouvre pas l'accès aux applications.",
    accessNote: (
      <>
        Après une connexion refusée, le portail propose <B>Se reconnecter</B>, qui redemande les identifiants (la session
        Auth0 survit à une connexion refusée).
      </>
    ),
    noOrgAppTitle: "Application sans organisation",
    noOrgAppExpected: (appRoles, organizations) => (
      <>
        Connecté : {appRoles}, {organizations}
      </>
    ),
    noOrgLoginTitle: "... mais pas de connexion à une organisation",
    deniedNotMember: "Refusé : non membre",
    memberNoAppTitle: "Membre sans application",
    noAccessExpected: (app) => <>Refusé : "You don't have access to {app}."</>,

    // 4. Single sign-on
    ssoTab: "4. Authentification unique",
    ssoTitle: "4. Authentification unique (SSO)",
    ssoPoint:
      "Connecté une seule fois, l'utilisateur ouvre les autres applications de l'entreprise sans ressaisir de mot de passe ; les règles d'accès s'appliquent dans chaque application.",
    ssoNote:
      "En localhost, Auth0 demande le consentement pour l'application web à la première connexion de chaque compte : l'accepter (pas de consentement sur une application déployée).",
    ssoStepTitle: "SSO",
    ssoSteps: (email) => <>Se connecter au portail en tant que {email}, puis ouvrir l'application web</>,
    ssoExpected: (name, roles) => (
      <>
        Connecté sans mot de passe : "Hello, {name}", rôles d'application {roles}
      </>
    ),
    deniedThereTitle: "Refusé là aussi",
    deniedThereSteps: (email) => (
      <>
        Dans l'application web, <B>Log out</B>, puis <B>Log in</B> en tant que {email}
      </>
    ),
    deniedThereExpected: (app) => <>"Access denied: You don't have access to {app}."</>,

    // 5. Admin UI
    adminTab: "5. Admin UI",
    adminTitle: "5. Administration : l'Admin UI",
    adminPoint:
      "Les administrateurs du client gèrent leurs utilisateurs, organisations et rôles sans le Dashboard Auth0 ; les changements s'appliquent à la connexion suivante.",
    adminIntro:
      "Ouvrir l'Admin UI avec un compte administrateur de l'Admin UI, faire la modification, puis la vérifier dans le portail.",
    adminNote: (
      <>
        Lancer <C>terraform apply</C> ensuite : il remet les comptes de test en place.
      </>
    ),
    allowed: (claims) => <>Autorisé : {claims}</>,
    denied: "Refusé",
    giveAccessTitle: "Donner l'accès à une application",
    giveAccessSteps: (email, app, role, button) => (
      <>
        Admin UI : Utilisateurs, {email}, <B>Ajouter une application</B> : {app}, {role}. Puis {button} avec ce compte
      </>
    ),
    addOrgTitle: "Ajouter à une organisation",
    addOrgSteps: (email, org, button) => (
      <>
        Admin UI : Utilisateurs, {email}, <B>Ajouter une organisation</B> : {org}, member (sans application). Puis{" "}
        {button} avec ce compte
      </>
    ),
    removeAccessTitle: "Retirer un accès",
    removeAccessSteps: (email, roles) => (
      <>
        Admin UI : Utilisateurs, {email}, carte Applications : retirer {roles}. Puis se connecter sans organisation avec
        ce compte
      </>
    ),
    removeOrgTitle: "Retirer d'une organisation",
    removeOrgSteps: (email, org, button) => (
      <>
        Admin UI : Utilisateurs, {email}, carte Organisations : <B>Supprimer</B> sur {org}. Puis {button} avec ce compte
      </>
    ),
    createUserTitle: "Créer un utilisateur",
    createUserSteps: (database) => (
      <>
        Admin UI : <B>Créer un utilisateur</B>, base de données {database}, une adresse de la boîte mail du présentateur
        (par ex. <C>prenom.nom+nouveau@…</C>), organisation et rôle d'application. Choisir le mot de passe depuis
        l'e-mail reçu, puis se connecter
      </>
    ),
    createUserExpected: "Le compte suit les mêmes règles",

    // 6. DAE
    daeTab: "6. DAE",
    daeTitle: "6. Administration déléguée : l'extension DAE",
    daePoint: (email) => (
      <>
        La Delegated Administration extension d'Auth0, à côté de l'Admin UI : un administrateur d'une entreprise cliente
        ne gère que les utilisateurs de ses organisations. Se connecter en tant que {email}.
      </>
    ),
    daeTalkingPoint:
      "La DAE fait le travail avec l'outil d'Auth0 lui-même (pas de message de succès, la liste doit être rafraîchie après une création) ; l'Admin UI couvre les mêmes besoins avec une expérience plus riche (notifications, applications, invitations, journaux).",
    scopedTitle: "Liste restreinte",
    scopedSteps: "DAE : Users",
    scopedExpected: (org) => (
      <>
        Uniquement les membres {org ? <>de {org}</> : "des organisations de l'administrateur"}, avec leurs organisations
        et leurs rôles d'application.
      </>
    ),
    notListed: (accounts) => <>{accounts} n'apparaissent pas</>,
    daeCreateSteps: (appRole) => (
      <>
        <B>Create User</B> : une adresse <C>example.com</C>, un mot de passe, le rôle d'organisation <C>member</C>, le
        rôle d'application {appRole}
      </>
    ),
    daeCreateExpected: (org, appRole, action) => (
      <>
        La fenêtre se ferme. Après quelques secondes et un rafraîchissement, l'utilisateur apparaît avec {org} et{" "}
        {appRole} (complété par l'Action {action}). Visible aussi dans l'Admin UI
      </>
    ),
    daeLoginTitle: "Sa connexion",
    daeLoginSteps: (button) => <>Portail, {button} avec le nouveau compte</>,
    changeRoleTitle: "Changer un rôle",
    changeRoleSteps: (appRole) => (
      <>
        L'utilisateur, <B>Actions &gt; Change Profile</B> : rôle d'application {appRole}
      </>
    ),
    changeRoleExpected: "La liste affiche le nouveau rôle",
    deleteTitle: "Supprimer",
    deleteSteps: (
      <>
        L'utilisateur, <B>Actions &gt; Delete</B>
      </>
    ),
    deleteExpected: "L'utilisateur a disparu de la liste",
    switchAccount: (email) => <>Se déconnecter de la DAE, puis se connecter avec {email}</>,
    perOrgTitle: "Droits par organisation",
    perOrgSteps: (email, memberOrg, adminOrg) => (
      <>
        Se déconnecter de la DAE, puis se connecter avec {email} (membre de {memberOrg}, admin de {adminOrg}). Ouvrir
        un utilisateur de chaque organisation, essayer <B>Actions &gt; Block</B>, puis <B>Create User</B>
      </>
    ),
    perOrgExpected: (memberOrg, adminOrg, adminSlug) => (
      <>
        Les deux organisations sont listées. {memberOrg} : lecture seule (« Read-only: you are not an admin of this
        user's organizations. »). {adminOrg} : les actions fonctionnent. <B>Create User</B> : pas de champ
        Organization (une seule organisation gérée), le champ s'intitule « Organization role in {adminSlug} », et le
        nouvel utilisateur apparaît dans {adminSlug}
      </>
    ),
    rolesTitle: "Rôles DAE",
    rolesSteps: (user, operator, administrator) => (
      <>
        Se connecter à la DAE avec {user}, puis {operator}, puis {administrator}
      </>
    ),
    rolesExpected: (
      <>
        <C>Delegated Admin - User</C> : les utilisateurs seulement. <C>Operator</C> : les utilisateurs et les{" "}
        <B>Logs</B>. <C>Administrator</C> : en plus la <B>Configuration</B> (hooks), dans le menu sous le nom
      </>
    ),
    auditorTitle: "Auditor : lecture seule",
    auditorExpected: (
      <>
        Les utilisateurs de l'organisation sont listés et consultables, sans <B>Create User</B> ; toute action est
        refusée (« Auditors have read-only access. »)
      </>
    ),
    daeRoleNote:
      "Les droits dans une organisation suivent le rôle d'organisation : un rôle DAE gère les utilisateurs des organisations où le compte est admin, et ne fait que lire celles où il est membre.",

    // After the demo
    afterTab: "Après la démo",
    afterReset: (
      <>
        <C>terraform apply</C> : les comptes de test retrouvent leur mot de passe, leurs rôles et leurs organisations, et sont débloqués.
      </>
    ),
    afterDelete: "Supprimer les comptes créés pendant la démo (Admin UI ou DAE) : Terraform ne les gère pas.",
  }
);

const json = (values: string[]) => JSON.stringify(values);

const memberOf = (user: DemoTestUser, org: string) => user.memberships.some((m) => m.organization === org);
const roleIn = (user: DemoTestUser, org: string) => user.memberships.find((m) => m.organization === org)?.role;

const useScenarios = (): Scenario[] => {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const m = useMessages(MESSAGES);
  const { testUsers, organizations, connections, features, customer } = demoConfig;
  const redirectUri = window.location.origin + "/token";
  const appName = demoConfig.appName || `${customer.name} Portal`;
  const webAppUrl = demoConfig.webAppUrls[0];

  // Personas of the scenarios (terraform/customers/<customer>.tfvars)
  const admin = testUsers.find((u) => u.daeRole) ?? testUsers.find((u) => u.roles.includes("admin"));
  const customerUser = testUsers.find((u) => u !== admin && u.memberships.length === 1 && u.roles.length > 0);
  const multi = testUsers.find((u) => u.memberships.length > 1);
  const direct = testUsers.find((u) => u.memberships.length === 0 && u.roles.length > 0);
  const noApp = testUsers.find((u) => u.memberships.length > 0 && u.roles.length === 0);

  const orgByName = (name?: string) => organizations.find((o) => o.name === name);
  const mainOrg: DemoOrganization | undefined = orgByName(customerUser?.memberships[0]?.organization) ?? organizations[0];
  const otherOrg: DemoOrganization | undefined =
    orgByName(noApp?.memberships[0]?.organization) ?? organizations.find((o) => o !== mainOrg);

  const login = (params: Record<string, string>) => () =>
    loginWithRedirect({ authorizationParams: { redirect_uri: redirectUri, prompt: "login", ...params } });
  const loginOrg = (org: DemoOrganization): Action => ({
    label: m.logInTo(org.displayName),
    run: login({ organization: org.id }),
  });
  const loginPassword: Action = { label: m.passwordLogin, run: login({ connection: connections.database }) };
  const open = (url: string, label: string): Action => ({ label, run: () => window.open(url, "_blank", "noopener") });

  const appRoles = claimName("app_roles");
  const orgRoles = claimName("org_roles");
  const orgsClaim = claimName("organizations");
  const permissions = claimName("permissions");

  const scenarios: Scenario[] = [];

  // Before the demo
  scenarios.push({
    id: "before",
    tab: m.beforeTab,
    title: m.beforeTab,
    body: (
      <>
        <ol style={{ paddingLeft: 20, lineHeight: 1.7, marginTop: 0 }}>
          <li>{m.beforePrepare(webAppUrl)}</li>
          <li>{m.beforeReset}</li>
          <li>{m.beforeLogout}</li>
        </ol>

        <h3>{m.testAccounts}</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {m.passwordInfo(<C>{demoConfig.testUsersPassword || m.givenByPresenter}</C>)}
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{m.thAccount}</th>
              <th style={thStyle}>{m.thOrganizations}</th>
              <th style={thStyle}>{m.thAppRole}</th>
              <th style={thStyle}>{m.thUsedFor}</th>
            </tr>
          </thead>
          <tbody>
            {testUsers.map((u) => (
              <tr key={u.email}>
                <td style={tdStyle}>
                  <C>{u.email}</C>
                </td>
                <td style={tdStyle}>
                  {u.memberships
                    .map((ms) => `${orgByName(ms.organization)?.displayName ?? ms.organization} (${ms.role})`)
                    .join(", ") || m.noOrganization}
                </td>
                <td style={tdStyle}>{u.roles.join(", ") || m.noRole}</td>
                <td style={tdStyle}>{u.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>{m.readingTokens}</h3>
        <p style={{ color: "var(--text-secondary)" }}>{m.tokensIntro(<C>{customer.name} - Demo access</C>)}</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{m.thClaim}</th>
              <th style={thStyle}>{m.thContent}</th>
            </tr>
          </thead>
          <tbody>
            {[
              [appRoles, m.claimAppRoles],
              [orgRoles, m.claimOrgRoles],
              [orgsClaim, m.claimOrganizations],
              [permissions, m.claimPermissions],
              ["org_id", m.claimOrgId],
              ["amr (ID token)", m.claimAmr],
            ].map(([claim, content]) => (
              <tr key={claim}>
                <td style={tdStyle}>
                  <C>{claim}</C>
                </td>
                <td style={tdStyle}>{content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  });

  // 1. Login methods
  const loginSteps: Step[] = [];
  if (customerUser) {
    loginSteps.push({
      id: "1.1",
      title: m.passwordTitle,
      steps: m.passwordSteps(<C>{customerUser.email}</C>),
      expected: m.passwordExpected(<C>app_roles: {json(customerUser.roles)}</C>),
      action: loginPassword,
    });
  }
  if (features.passwordless && connections.passwordless && direct?.receivesEmails) {
    loginSteps.push({
      id: "1.2",
      title: m.passwordlessTitle,
      steps: m.passwordlessSteps(<C>{direct.email}</C>),
      expected: m.passwordlessExpected,
      action: { label: m.codeLogin, run: login({ connection: connections.passwordless }) },
    });
    loginSteps.push({
      id: "1.3",
      title: m.unknownTitle,
      steps: m.unknownSteps,
      expected: m.unknownExpected,
      action: { label: m.codeLogin, run: login({ connection: connections.passwordless }) },
    });
  }
  if (features.mfa === "step-up" && admin) {
    loginSteps.push({
      id: "1.4",
      title: m.stepUpTitle,
      steps: m.stepUpSteps(<C>{admin.email}</C>, <B>{m.mfaLogin}</B>),
      expected: m.stepUpExpected,
      action: {
        label: m.mfaLogin,
        run: login({ connection: connections.database, acr_values: MFA_POLICY }),
      },
    });
  }
  if (loginSteps.length > 0) {
    scenarios.push({
      id: "login",
      tab: m.loginTab,
      title: m.loginTitle,
      point: m.loginPoint,
      steps: loginSteps,
      talkingPoint: features.mfa === "step-up" ? m.loginTalkingPoint : undefined,
    });
  }

  // 2. B2B organizations
  const orgSteps: Step[] = [];
  if (mainOrg && customerUser && memberOf(customerUser, mainOrg.name)) {
    orgSteps.push({
      id: "2.1",
      title: m.brandedTitle,
      steps: (
        <>
          <B>{m.logInTo(mainOrg.displayName)}</B>, <C>{customerUser.email}</C>
        </>
      ),
      expected: m.brandedExpected(
        mainOrg.displayName,
        <C>org_roles: {json([roleIn(customerUser, mainOrg.name) ?? ""])}</C>
      ),
      action: loginOrg(mainOrg),
    });
  }
  if (mainOrg && admin && memberOf(admin, mainOrg.name)) {
    orgSteps.push({
      id: "2.2",
      title: m.orgAdminTitle,
      steps: (
        <>
          <B>{m.logInTo(mainOrg.displayName)}</B>, <C>{admin.email}</C>
        </>
      ),
      expected: m.orgAdminExpected(<C>org_roles: {json([roleIn(admin, mainOrg.name) ?? ""])}</C>),
      action: loginOrg(mainOrg),
    });
  }
  if (multi) {
    const [first, second] = multi.memberships.map((ms) => orgByName(ms.organization));
    orgSteps.push({
      id: "2.3",
      title: m.severalTitle,
      steps: m.severalSteps(<C>{multi.email}</C>, first?.displayName, second?.displayName),
      expected: m.severalExpected(
        multi.memberships.map((ms, i) => (
          <span key={ms.organization}>
            {i > 0 && "; "}
            {orgByName(ms.organization)?.displayName}{m.colon} <C>org_roles: {json([ms.role])}</C>
          </span>
        )),
        <C>app_roles: {json(multi.roles)}</C>
      ),
      action: first && loginOrg(first),
    });
  }
  if (otherOrg && customerUser && !memberOf(customerUser, otherOrg.name)) {
    orgSteps.push({
      id: "2.4",
      title: m.notMemberTitle,
      steps: m.loginWith(<B>{m.logInTo(otherOrg.displayName)}</B>, <C>{customerUser.email}</C>),
      expected: m.notMemberExpected,
      action: loginOrg(otherOrg),
    });
  }
  if (orgSteps.length > 0) {
    scenarios.push({
      id: "organizations",
      tab: m.orgTab,
      title: m.orgTitle,
      point: m.orgPoint,
      steps: orgSteps,
      talkingPoint: multi ? m.orgTalkingPoint : undefined,
    });
  }

  // 3. Access model
  const accessSteps: Step[] = [];
  if (direct) {
    accessSteps.push({
      id: "3.1",
      title: m.noOrgAppTitle,
      steps: m.passwordSteps(<C>{direct.email}</C>),
      expected: m.noOrgAppExpected(<C>app_roles: {json(direct.roles)}</C>, <C>organizations: []</C>),
      action: loginPassword,
    });
    if (mainOrg) {
      accessSteps.push({
        id: "3.2",
        title: m.noOrgLoginTitle,
        steps: m.loginWith(<B>{m.logInTo(mainOrg.displayName)}</B>, <C>{direct.email}</C>),
        expected: m.deniedNotMember,
        action: loginOrg(mainOrg),
      });
    }
  }
  if (noApp) {
    const org = orgByName(noApp.memberships[0]?.organization);
    accessSteps.push({
      id: "3.3",
      title: m.memberNoAppTitle,
      steps: m.loginWith(<B>{m.logInTo(org?.displayName ?? "")}</B>, <C>{noApp.email}</C>),
      expected: m.noAccessExpected(appName),
      action: org && loginOrg(org),
    });
  }
  if (accessSteps.length > 0) {
    scenarios.push({
      id: "access",
      tab: m.accessTab,
      title: m.accessTitle,
      point: m.accessPoint,
      steps: accessSteps,
      note: m.accessNote,
    });
  }

  // 4. Single sign-on
  if (webAppUrl && customerUser) {
    const ssoSteps: Step[] = [
      {
        id: "4.1",
        title: m.ssoStepTitle,
        steps: m.ssoSteps(<C>{customerUser.email}</C>),
        expected: m.ssoExpected(customerUser.name, <C>{customerUser.roles.join(", ")}</C>),
        action: open(webAppUrl, m.openWebApp),
      },
    ];
    if (noApp) {
      ssoSteps.push({
        id: "4.2",
        title: m.deniedThereTitle,
        steps: m.deniedThereSteps(<C>{noApp.email}</C>),
        expected: m.deniedThereExpected(appName),
        action: open(webAppUrl, m.openWebApp),
      });
    }
    scenarios.push({
      id: "sso",
      tab: m.ssoTab,
      title: m.ssoTitle,
      point: m.ssoPoint,
      steps: ssoSteps,
      note: m.ssoNote,
    });
  }

  // 5. Admin UI
  if (demoConfig.adminUiUrl) {
    const adminSteps: Step[] = [];
    if (noApp) {
      const org = orgByName(noApp.memberships[0]?.organization);
      const role = demoConfig.roles.find((r) => r.name !== "admin")?.name ?? "buyer";
      adminSteps.push({
        id: "5.1",
        title: m.giveAccessTitle,
        steps: m.giveAccessSteps(<C>{noApp.email}</C>, appName, role, <B>{m.logInTo(org?.displayName ?? "")}</B>),
        expected: m.allowed(
          <>
            <C>app_roles: {json([role])}</C>, <C>org_roles: {json([noApp.memberships[0]?.role ?? ""])}</C>
          </>
        ),
        action: org && loginOrg(org),
      });
    }
    if (direct && mainOrg) {
      adminSteps.push({
        id: "5.2",
        title: m.addOrgTitle,
        steps: m.addOrgSteps(<C>{direct.email}</C>, mainOrg.displayName, <B>{m.logInTo(mainOrg.displayName)}</B>),
        expected: m.allowed(<C>org_roles: ["member"]</C>),
        action: loginOrg(mainOrg),
      });
      adminSteps.push({
        id: "5.3",
        title: m.removeAccessTitle,
        steps: m.removeAccessSteps(<C>{direct.email}</C>, <C>{direct.roles.join(", ")}</C>),
        expected: m.denied,
        action: loginPassword,
      });
    }
    if (customerUser && mainOrg) {
      adminSteps.push({
        id: "5.4",
        title: m.removeOrgTitle,
        steps: m.removeOrgSteps(
          <C>{customerUser.email}</C>,
          mainOrg.displayName,
          <B>{m.logInTo(mainOrg.displayName)}</B>
        ),
        expected: m.deniedNotMember,
        action: loginOrg(mainOrg),
      });
    }
    adminSteps.push({
      id: "5.5",
      title: m.createUserTitle,
      steps: m.createUserSteps(<C>{connections.database}</C>),
      expected: m.createUserExpected,
      action: loginPassword,
    });
    scenarios.push({
      id: "admin-ui",
      tab: m.adminTab,
      title: m.adminTitle,
      point: m.adminPoint,
      intro: (
        <>
          <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>{m.adminIntro}</p>
          <button style={{ ...buttonStyle, marginTop: 0, marginBottom: 16 }} onClick={() => window.open(demoConfig.adminUiUrl, "_blank", "noopener")}>
            {m.openAdminUi}
          </button>
        </>
      ),
      steps: adminSteps,
      note: m.adminNote,
    });
  }

  // 6. DAE
  if (features.dae && demoConfig.daeUrl && admin) {
    const daeOrg = orgByName(admin.memberships[0]?.organization);
    const role = demoConfig.roles.find((r) => r.name !== "admin")?.name ?? "buyer";
    const otherRole = demoConfig.roles.find((r) => r.name !== "admin" && r.name !== role)?.name;
    const outside = testUsers.filter((u) => !daeOrg || !memberOf(u, daeOrg.name));
    const daeSteps: Step[] = [
      {
        id: "6.1",
        title: m.scopedTitle,
        steps: m.scopedSteps,
        expected: (
          <>
            {m.scopedExpected(daeOrg?.displayName)}
            {outside.length > 0 && (
              <>
                {" "}
                {m.notListed(
                  outside.map((u, i) => (
                    <span key={u.email}>
                      {i > 0 && ", "}
                      <C>{u.email}</C>
                    </span>
                  ))
                )}
              </>
            )}
          </>
        ),
        action: { label: m.openDae, run: () => navigate("/dae-extension") },
      },
      {
        id: "6.2",
        title: m.createUserTitle,
        steps: m.daeCreateSteps(
          <C>
            {appName}:{role}
          </C>
        ),
        expected: m.daeCreateExpected(
          <C>{daeOrg?.name}</C>,
          <C>
            {appName}:{role}
          </C>,
          <C>{customer.name} - DAE assignment</C>
        ),
      },
    ];
    if (daeOrg) {
      daeSteps.push({
        id: "6.3",
        title: m.daeLoginTitle,
        steps: m.daeLoginSteps(<B>{m.logInTo(daeOrg.displayName)}</B>),
        expected: (
          <>
            <C>app_roles: {json([role])}</C>, <C>org_roles: ["member"]</C>
          </>
        ),
        action: loginOrg(daeOrg),
      });
    }
    if (otherRole) {
      daeSteps.push({
        id: "6.4",
        title: m.changeRoleTitle,
        steps: m.changeRoleSteps(
          <C>
            {appName}:{otherRole}
          </C>
        ),
        expected: m.changeRoleExpected,
      });
    }
    daeSteps.push({
      id: "6.5",
      title: m.deleteTitle,
      steps: m.deleteSteps,
      expected: m.deleteExpected,
    });

    // Rights per organization and per DAE role (test accounts with a DAE role)
    const withDaeRole = (role: string) => testUsers.find((u) => u.daeRole === `Delegated Admin - ${role}`);
    const perOrg = testUsers.find(
      (u) => u.daeRole && u.memberships.some((ms) => ms.role === "admin") && u.memberships.some((ms) => ms.role !== "admin")
    );
    const memberOrg = perOrg && orgByName(perOrg.memberships.find((ms) => ms.role !== "admin")?.organization);
    const adminOrg = perOrg && orgByName(perOrg.memberships.find((ms) => ms.role === "admin")?.organization);
    if (perOrg && memberOrg && adminOrg) {
      daeSteps.push({
        id: "6.6",
        title: m.perOrgTitle,
        steps: m.perOrgSteps(<C>{perOrg.email}</C>, memberOrg.displayName, adminOrg.displayName),
        expected: m.perOrgExpected(memberOrg.displayName, adminOrg.displayName, adminOrg.name),
      });
    }
    const daeUser = withDaeRole("User");
    const operator = withDaeRole("Operator");
    const administrator = withDaeRole("Administrator");
    if (daeUser && operator && administrator) {
      daeSteps.push({
        id: "6.7",
        title: m.rolesTitle,
        steps: m.rolesSteps(<C>{daeUser.email}</C>, <C>{operator.email}</C>, <C>{administrator.email}</C>),
        expected: m.rolesExpected,
      });
    }
    const auditor = withDaeRole("Auditor");
    if (auditor) {
      daeSteps.push({
        id: "6.8",
        title: m.auditorTitle,
        steps: m.switchAccount(<C>{auditor.email}</C>),
        expected: m.auditorExpected,
      });
    }
    scenarios.push({
      id: "dae",
      tab: m.daeTab,
      title: m.daeTitle,
      point: m.daePoint(<C>{admin.email}</C>),
      steps: daeSteps,
      talkingPoint: m.daeTalkingPoint,
      note: m.daeRoleNote,
    });
  }

  // After the demo
  scenarios.push({
    id: "after",
    tab: m.afterTab,
    title: m.afterTab,
    body: (
      <ul style={{ paddingLeft: 20, lineHeight: 1.7, marginTop: 0 }}>
        <li>{m.afterReset}</li>
        <li>{m.afterDelete}</li>
      </ul>
    ),
  });

  return scenarios;
};

const StepsTable = ({ steps }: { steps: Step[] }) => {
  const m = useMessages(MESSAGES);
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={{ ...thStyle, width: "22%" }}>#</th>
          <th style={{ ...thStyle, width: "40%" }}>{m.thSteps}</th>
          <th style={thStyle}>{m.thExpected}</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step) => (
          <tr key={step.id}>
            <td style={tdStyle}>
              <div style={{ fontWeight: 600 }}>
                {step.id} {step.title}
              </div>
              {step.action && (
                <button style={buttonStyle} onClick={step.action.run}>
                  {step.action.label}
                </button>
              )}
            </td>
            <td style={tdStyle}>{step.steps}</td>
            <td style={tdStyle}>{step.expected}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ScenariosPage: React.FC = () => {
  const scenarios = useScenarios();
  const m = useMessages(MESSAGES);
  const [searchParams, setSearchParams] = useSearchParams();
  // The tab is kept in the URL (?s=…): a link opens a given scenario
  const active = scenarios.find((s) => s.id === searchParams.get("s")) ?? scenarios[0];

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <h1>{m.pageTitle}</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{m.pageIntro(demoConfig.customer.name)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {scenarios.map((s) => (
          <button key={s.id} style={tabStyle(s.id === active.id)} onClick={() => setSearchParams({ s: s.id })}>
            {s.tab}
          </button>
        ))}
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>{active.title}</h2>
        {active.point && (
          <p style={{ color: "var(--text-primary)" }}>
            <B>{m.point}</B> {active.point}
          </p>
        )}
        {active.intro}
        {active.steps && <StepsTable steps={active.steps} />}
        {active.body}
        {active.talkingPoint && (
          <p
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              borderLeft: "3px solid var(--primary-color)",
              background: "var(--bg-primary)",
              borderRadius: 6,
              color: "var(--text-secondary)",
            }}
          >
            <B>{m.talkingPoint}</B> {active.talkingPoint}
          </p>
        )}
        {active.note && <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "1rem" }}>{active.note}</p>}
      </div>
    </div>
  );
};

export default ScenariosPage;
