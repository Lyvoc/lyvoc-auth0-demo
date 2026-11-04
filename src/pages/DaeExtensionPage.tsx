import React from 'react';
import { demoConfig } from '../config/demo';

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

const DaeExtensionPage: React.FC = () => (
  <div style={{ padding: '2rem', maxWidth: '900px' }}>
    <h1>Delegated Administration Extension (DAE)</h1>
    <p style={{ color: 'var(--text-secondary)' }}>
      The <strong>DAE</strong> allows a {customer.name} admin to manage users across organizations — creating accounts,
      updating profiles, and setting custom attributes — without requiring full Auth0 Dashboard access.
    </p>

    <div style={{ marginBottom: '1.5rem' }}>
      <a
        href="https://auth0.com/docs/customize/extensions/delegated-administration-extension"
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...buttonStyle, background: '#4a5568', color: '#fff' }}
      >
        Auth0 Documentation
      </a>
      {daeUrl && (
        <a
          href={daeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...buttonStyle, background: 'var(--primary-color)', color: '#fff' }}
        >
          Open DAE App
        </a>
      )}
    </div>

    <h2>Use Cases</h2>

    {/* Create User */}
    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>Create a User via Invitation</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Log in to the DAE as a {customer.name} admin. Create a new user — the write hook automatically sends them an
        organization invitation email instead of setting a password directly. The user clicks the link in the
        email to set their own password and join the organization.
      </p>
      {daeAdmin && (
        <div style={credentialStyle}>
          <span style={{ color: '#a78bfa' }}>Log in as:</span> {daeAdmin.email}
        </div>
      )}
      <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        In the DAE: click <strong>Create User</strong> → fill in email, connection, select a <strong>Business Role</strong> → click <strong>Create</strong>.<br />
        The new user receives an invitation email → clicks the link → sets their password → joins the organization.
      </p>
    </div>

    <hr style={dividerStyle} />

    {/* Custom Attributes */}
    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>Set Custom Attributes</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Log in as the {customer.name} admin and set <code>user_metadata</code> on another user, demonstrating that the
        admin manages users without Auth0 Dashboard access.
      </p>
      <div style={credentialStyle}>
        {daeAdmin && <><span style={{ color: '#a78bfa' }}>Log in as:</span> {daeAdmin.email}<br /></>}
        {otherUser && <><span style={{ color: '#a78bfa' }}>Target user:</span> {otherUser.email}</>}
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
        Click on the target user → click <strong>Change Profile</strong> → fill in the custom fields → click <strong>Update</strong>.
      </p>
    </div>

    <hr style={dividerStyle} />

    {/* How Hooks Work */}
    <h2 style={{ marginTop: '1.5rem' }}>How It Works — DAE Hooks</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
      The DAE behavior is controlled by three hooks that run at different stages of the admin workflow.
    </p>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>Filter Hook</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Runs when the admin opens the user list. Returns a Lucene query that limits which users are visible,
        based on the organizations of the admin (<code>app_metadata.organizations</code>).
      </p>
    </div>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>Settings Query</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Runs when the Create or Edit user form loads. Defines what custom fields appear — a <strong>DAE Role</strong>{' '}
        dropdown, a <strong>Business Role</strong> dropdown, and custom <code>user_metadata</code> fields.
        The role options shown depend on which organization the logged-in admin belongs to.
      </p>
    </div>

    <div style={sectionStyle}>
      <h3 style={{ marginTop: 0 }}>Write Hook</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Runs when a user is created or updated. Maps the selected Business Role to an organization and sets{' '}
        <code>app_metadata.organizations</code> on the user. On <strong>create</strong>, it sends an organization
        invitation email via the Management API instead of setting a password directly. On <strong>update</strong>,
        it syncs Auth0 RBAC roles via the Management API.
      </p>
      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <strong>Flow when creating a user:</strong>
        <div style={{ ...credentialStyle, marginTop: '0.5rem' }}>
          Admin fills form → Settings Query builds the fields<br />
          Admin clicks Create → Write Hook runs<br />
          Business Role mapped to org → Management API called<br />
          Org invitation email sent to new user<br />
          User clicks link → sets password → joins organization
        </div>
      </div>
    </div>

    <hr style={dividerStyle} />

    {/* Test Accounts */}
    <h2 style={{ marginTop: '1.5rem' }}>DAE Administrators</h2>
    {daeAdmins.length === 0 && (
      <p style={{ color: 'var(--text-secondary)' }}>No test account with a DAE role in the demo configuration.</p>
    )}
    {daeAdmins.map((user) => (
      <div key={user.email} style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>{user.name}</h3>
        {user.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.description}</p>}
        <div style={credentialStyle}>
          <span style={{ color: '#a78bfa' }}>Username:</span> {user.email}<br />
          <span style={{ color: '#a78bfa' }}>Password:</span> given by the presenter<br />
          <span style={{ color: '#a78bfa' }}>Org:</span> {user.memberships.map((m) => m.organization).join(', ') || '—'} · Role: {user.daeRole}
        </div>
      </div>
    ))}
  </div>
);

export default DaeExtensionPage;
