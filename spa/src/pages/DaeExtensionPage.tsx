import React from 'react';
import { demoConfig } from '../config/demo';
import { defineMessages, useMessages } from '../i18n';

const MESSAGES = defineMessages(
  {
    title: 'Delegated Administration Extension (DAE)',
    intro: (customer: string) => (
      <>
        The <strong>DAE</strong> allows a {customer} admin to manage users across organizations — creating accounts,
        updating profiles, and setting custom attributes — without requiring full Auth0 Dashboard access.
      </>
    ),
    documentation: 'Auth0 Documentation',
    openDae: 'Open DAE App',
    useCases: 'Use Cases',
    createTitle: 'Create a User via Invitation',
    createIntro: (customer: string) => (
      <>
        Log in to the DAE as a {customer} admin. Create a new user — the write hook automatically sends them an
        organization invitation email instead of setting a password directly. The user clicks the link in the
        email to set their own password and join the organization.
      </>
    ),
    logInAs: 'Log in as:',
    createSteps: (
      <>
        In the DAE: click <strong>Create User</strong> → fill in email, connection, select a <strong>Business Role</strong> → click <strong>Create</strong>.<br />
        The new user receives an invitation email → clicks the link → sets their password → joins the organization.
      </>
    ),
    attributesTitle: 'Set Custom Attributes',
    attributesIntro: (customer: string) => (
      <>
        Log in as the {customer} admin and set <code>user_metadata</code> on another user, demonstrating that the
        admin manages users without Auth0 Dashboard access.
      </>
    ),
    targetUser: 'Target user:',
    attributesSteps: (
      <>
        Click on the target user → click <strong>Change Profile</strong> → fill in the custom fields → click <strong>Update</strong>.
      </>
    ),
    hooksTitle: 'How It Works — DAE Hooks',
    hooksIntro: 'The DAE behavior is controlled by three hooks that run at different stages of the admin workflow.',
    filterHook: 'Filter Hook',
    filterHookText: (
      <>
        Runs when the admin opens the user list. Returns a Lucene query that limits which users are visible,
        based on the organizations of the admin (<code>app_metadata.organizations</code>).
      </>
    ),
    settingsQuery: 'Settings Query',
    settingsQueryText: (
      <>
        Runs when the Create or Edit user form loads. Defines what custom fields appear — a <strong>DAE Role</strong>{' '}
        dropdown, a <strong>Business Role</strong> dropdown, and custom <code>user_metadata</code> fields.
        The role options shown depend on which organization the logged-in admin belongs to.
      </>
    ),
    writeHook: 'Write Hook',
    writeHookText: (
      <>
        Runs when a user is created or updated. Maps the selected Business Role to an organization and sets{' '}
        <code>app_metadata.organizations</code> on the user. On <strong>create</strong>, it sends an organization
        invitation email via the Management API instead of setting a password directly. On <strong>update</strong>,
        it syncs Auth0 RBAC roles via the Management API.
      </>
    ),
    createFlowTitle: 'Flow when creating a user:',
    createFlow: (
      <>
        Admin fills form → Settings Query builds the fields<br />
        Admin clicks Create → Write Hook runs<br />
        Business Role mapped to org → Management API called<br />
        Org invitation email sent to new user<br />
        User clicks link → sets password → joins organization
      </>
    ),
    daeAdministrators: 'DAE Administrators',
    noDaeAdmin: 'No test account with a DAE role in the demo configuration.',
    username: 'Username:',
    password: 'Password:',
    passwordFromPresenter: 'given by the presenter',
    org: 'Org:',
    role: 'Role:',
  },
  {
    title: 'Delegated Administration Extension (DAE)',
    intro: (customer) => (
      <>
        La <strong>DAE</strong> permet à un administrateur {customer} de gérer les utilisateurs de plusieurs organisations (création
        de comptes, mise à jour des profils, attributs personnalisés) sans accès complet au Dashboard Auth0.
      </>
    ),
    documentation: 'Documentation Auth0',
    openDae: "Ouvrir l'application DAE",
    useCases: "Cas d'usage",
    createTitle: 'Créer un utilisateur par invitation',
    createIntro: (customer) => (
      <>
        Connectez-vous à la DAE en tant qu'administrateur {customer}. Créez un nouvel utilisateur : au lieu de définir
        directement un mot de passe, le write hook lui envoie automatiquement un e-mail d'invitation à l'organisation.
        L'utilisateur clique sur le lien de l'e-mail pour choisir son mot de passe et rejoindre l'organisation.
      </>
    ),
    logInAs: 'Se connecter en tant que :',
    createSteps: (
      <>
        Dans la DAE : cliquez sur <strong>Create User</strong> → renseignez l'e-mail et la connexion, choisissez un <strong>Business Role</strong> → cliquez sur <strong>Create</strong>.<br />
        Le nouvel utilisateur reçoit un e-mail d'invitation → clique sur le lien → choisit son mot de passe → rejoint l'organisation.
      </>
    ),
    attributesTitle: 'Définir des attributs personnalisés',
    attributesIntro: (customer) => (
      <>
        Connectez-vous en tant qu'administrateur {customer} et renseignez les <code>user_metadata</code> d'un autre utilisateur :
        l'administrateur gère les utilisateurs sans accès au Dashboard Auth0.
      </>
    ),
    targetUser: 'Utilisateur cible :',
    attributesSteps: (
      <>
        Cliquez sur l'utilisateur cible → cliquez sur <strong>Change Profile</strong> → renseignez les champs personnalisés → cliquez sur <strong>Update</strong>.
      </>
    ),
    hooksTitle: 'Fonctionnement : les hooks de la DAE',
    hooksIntro: "Le comportement de la DAE est piloté par trois hooks, exécutés à différentes étapes du parcours de l'administrateur.",
    filterHook: 'Filter Hook',
    filterHookText: (
      <>
        S'exécute quand l'administrateur ouvre la liste des utilisateurs. Renvoie une requête Lucene qui limite les utilisateurs visibles
        selon les organisations de l'administrateur (<code>app_metadata.organizations</code>).
      </>
    ),
    settingsQuery: 'Settings Query',
    settingsQueryText: (
      <>
        S'exécute au chargement du formulaire de création ou de modification d'un utilisateur. Définit les champs personnalisés affichés : une liste{' '}
        <strong>DAE Role</strong>, une liste <strong>Business Role</strong> et des champs <code>user_metadata</code> personnalisés.
        Les rôles proposés dépendent de l'organisation de l'administrateur connecté.
      </>
    ),
    writeHook: 'Write Hook',
    writeHookText: (
      <>
        S'exécute à la création ou à la mise à jour d'un utilisateur. Associe le Business Role choisi à une organisation et renseigne{' '}
        <code>app_metadata.organizations</code> sur l'utilisateur. À la <strong>création</strong>, il envoie un e-mail
        d'invitation à l'organisation via la Management API au lieu de définir directement un mot de passe. À la{' '}
        <strong>mise à jour</strong>, il synchronise les rôles RBAC Auth0 via la Management API.
      </>
    ),
    createFlowTitle: "Déroulé lors de la création d'un utilisateur :",
    createFlow: (
      <>
        L'administrateur remplit le formulaire → la Settings Query construit les champs<br />
        L'administrateur clique sur Create → le Write Hook s'exécute<br />
        Business Role associé à l'organisation → appel de la Management API<br />
        E-mail d'invitation à l'organisation envoyé au nouvel utilisateur<br />
        L'utilisateur clique sur le lien → choisit son mot de passe → rejoint l'organisation
      </>
    ),
    daeAdministrators: 'Administrateurs DAE',
    noDaeAdmin: 'Aucun compte de test avec un rôle DAE dans la configuration de la démo.',
    username: 'Identifiant :',
    password: 'Mot de passe :',
    passwordFromPresenter: 'communiqué par le présentateur',
    org: 'Organisation :',
    role: 'Rôle :',
  }
);

const sectionStyle: React.CSSProperties = {
  background: '#2d313c',
  borderRadius: '10px',
  padding: '1.25rem 1.5rem',
  marginBottom: '1rem',
};

const credentialStyle: React.CSSProperties = {
  background: '#1a1e27',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginTop: '0.5rem',
  fontFamily: 'monospace',
  fontSize: '0.88rem',
  lineHeight: 1.7,
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  textDecoration: 'none',
  marginRight: '0.75rem',
  marginTop: '0.5rem',
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #3a3f50',
  margin: '0.85rem 0',
};

const { customer, testUsers, daeUrl } = demoConfig;
const daeAdmins = testUsers.filter((user) => user.daeRole);
const daeAdmin = daeAdmins[0];
const otherUser = testUsers.find((user) => !user.daeRole);

const DaeExtensionPage: React.FC = () => {
  const m = useMessages(MESSAGES);

  return (
  <div style={{ padding: '2rem', maxWidth: '900px' }}>
    <h1>{m.title}</h1>
    <p style={{ color: 'var(--text-secondary)' }}>
      {m.intro(customer.name)}
    </p>

    <div style={{ marginBottom: '1.5rem' }}>
      <a
        href="https://auth0.com/docs/customize/extensions/delegated-administration-extension"
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...buttonStyle, background: '#4a5568', color: '#fff' }}
      >
        {m.documentation}
      </a>
      {daeUrl && (
        <a
          href={daeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...buttonStyle, background: 'var(--primary-color)', color: '#fff' }}
        >
          {m.openDae}
        </a>
      )}
    </div>

    <h2>{m.useCases}</h2>

    {/* Create User */}
    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{m.createTitle}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {m.createIntro(customer.name)}
      </p>
      {daeAdmin && (
        <div style={credentialStyle}>
          <span style={{ color: '#a78bfa' }}>{m.logInAs}</span> {daeAdmin.email}
        </div>
      )}
      <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        {m.createSteps}
      </p>
    </div>

    <hr style={dividerStyle} />

    {/* Custom Attributes */}
    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{m.attributesTitle}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {m.attributesIntro(customer.name)}
      </p>
      <div style={credentialStyle}>
        {daeAdmin && <><span style={{ color: '#a78bfa' }}>{m.logInAs}</span> {daeAdmin.email}<br /></>}
        {otherUser && <><span style={{ color: '#a78bfa' }}>{m.targetUser}</span> {otherUser.email}</>}
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        {m.attributesSteps}
      </p>
    </div>

    <hr style={dividerStyle} />

    {/* How Hooks Work */}
    <h2 style={{ marginTop: '1.5rem' }}>{m.hooksTitle}</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
      {m.hooksIntro}
    </p>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{m.filterHook}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {m.filterHookText}
      </p>
    </div>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{m.settingsQuery}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {m.settingsQueryText}
      </p>
    </div>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>{m.writeHook}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {m.writeHookText}
      </p>
      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <strong>{m.createFlowTitle}</strong>
        <div style={{ ...credentialStyle, marginTop: '0.5rem' }}>
          {m.createFlow}
        </div>
      </div>
    </div>

    <hr style={dividerStyle} />

    {/* Test Accounts */}
    <h2 style={{ marginTop: '1.5rem' }}>{m.daeAdministrators}</h2>
    {daeAdmins.length === 0 && (
      <p style={{ color: 'var(--text-secondary)' }}>{m.noDaeAdmin}</p>
    )}
    {daeAdmins.map((user) => (
      <div key={user.email} style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>{user.name}</h3>
        {user.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.description}</p>}
        <div style={credentialStyle}>
          <span style={{ color: '#a78bfa' }}>{m.username}</span> {user.email}<br />
          <span style={{ color: '#a78bfa' }}>{m.password}</span> {demoConfig.testUsersPassword || m.passwordFromPresenter}<br />
          <span style={{ color: '#a78bfa' }}>{m.org}</span> {user.memberships.map((ms) => ms.organization).join(', ') || '—'} · {m.role} {user.daeRole}
        </div>
      </div>
    ))}
  </div>
  );
};

export default DaeExtensionPage;
