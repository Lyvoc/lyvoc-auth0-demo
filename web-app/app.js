// Regular web application of the demo (Express): single sign-on with the
// portal. Its settings come from Terraform: `npm run config` (repository root)
// writes web-app/.env.
require('dotenv').config();
const express = require('express');
const { auth } = require('express-openid-connect');
const escape = require('escape-html');

const {
  PORT = 3000,
  BASE_URL,
  ISSUER_BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  SESSION_SECRET,
  CUSTOMER_NAME = 'Demo',
  PRIMARY_COLOR = '#2563eb',
  CLAIMS_NAMESPACE = '',
  PORTAL_URL = '',
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing web-app/.env: run `npm run config` at the repository root.');
  process.exit(1);
}

const app = express();

// Authorization code flow, with the client secret Terraform generates
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: SESSION_SECRET,
    baseURL: BASE_URL,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    issuerBaseURL: ISSUER_BASE_URL,
    authorizationParams: { response_type: 'code', scope: 'openid profile email' },
  })
);

const page = (body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(CUSTOMER_NAME)} - Web application</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: #f5f6f8; color: #111827;
    }
    .card {
      width: min(92vw, 420px); padding: 40px 32px; text-align: center;
      background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;
      box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
    }
    .card.wide { width: min(92vw, 640px); text-align: left; }
    .badge {
      display: inline-block; margin: 0 0 16px; padding: 4px 10px;
      border-radius: 999px; background: ${PRIMARY_COLOR}1a; color: ${PRIMARY_COLOR};
      font-size: 12px; font-weight: 600; letter-spacing: .02em;
    }
    h1 { margin: 0 0 8px; font-size: 24px; font-weight: 650; }
    p { margin: 0 0 24px; color: #6b7280; font-size: 15px; }
    dl { margin: 0 0 24px; display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: 14px; }
    dt { color: #6b7280; }
    dd { margin: 0; font-weight: 600; }
    .actions { display: flex; flex-direction: column; gap: 12px; }
    .btn {
      display: block; padding: 12px 20px; border-radius: 10px; text-align: center;
      font-size: 15px; font-weight: 600; text-decoration: none;
    }
    .btn-primary { background: ${PRIMARY_COLOR}; color: #fff; border: 1px solid ${PRIMARY_COLOR}; }
    .btn-secondary { background: #fff; color: #111827; border: 1px solid #d1d5db; }
    details { margin: 0 0 24px; font-size: 13px; }
    pre {
      margin: 8px 0 0; padding: 16px; overflow: auto;
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
    }
  </style>
</head>
<body>${body}</body>
</html>`;

const badge = `<span class="badge">${escape(CUSTOMER_NAME)} - Web application</span>`;
const portalLink = PORTAL_URL
  ? `<a class="btn btn-secondary" href="${escape(PORTAL_URL)}">Back to the portal</a>`
  : '';

// Claim set by the "Demo access" Action (CLAIMS_NAMESPACE prefix)
const claim = (user, name) => user[`${CLAIMS_NAMESPACE}${name}`];
const list = (value) => (Array.isArray(value) && value.length ? value.join(', ') : 'none');

// "Log in with another account": ignore the Auth0 session
app.get('/switch', (req, res) =>
  res.oidc.login({ returnTo: '/', authorizationParams: { prompt: 'login' } })
);

// SSO check: on the first visit of the browser session, ask Auth0 for a silent
// login (prompt=none). With an Auth0 session (logged in through the portal),
// the user lands here authenticated without typing a password; otherwise Auth0
// answers login_required and the buttons below show. The short-lived cookie
// prevents a redirect loop while still picking up a session created later.
const SSO_CHECK_COOKIE = 'sso_checked';
const SSO_CHECK_TTL_MS = 30 * 1000;
const hasCookie = (req, name) =>
  (req.headers.cookie || '').split(/;\s*/).some((c) => c.startsWith(`${name}=`));

app.get('/', (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    if (!hasCookie(req, SSO_CHECK_COOKIE)) {
      res.cookie(SSO_CHECK_COOKIE, '1', { httpOnly: true, sameSite: 'lax', maxAge: SSO_CHECK_TTL_MS });
      return res.oidc.login({ returnTo: '/', authorizationParams: { prompt: 'none' } });
    }
    return res.type('html').send(page(`
      <main class="card">
        ${badge}
        <h1>Welcome</h1>
        <p>No Auth0 session: log in here, or log in to the portal first and come back (single sign-on).</p>
        <div class="actions">
          <a class="btn btn-primary" href="/login">Log in</a>
          ${portalLink}
        </div>
      </main>
    `));
  }

  const user = req.oidc.user;
  res.type('html').send(page(`
    <main class="card wide">
      ${badge}
      <h1>Hello, ${escape(user.name)}</h1>
      <p>Logged in to this application with the same Auth0 session as the portal.</p>
      <dl>
        <dt>Email</dt><dd>${escape(user.email || '')}</dd>
        <dt>Application roles</dt><dd>${escape(list(claim(user, 'app_roles')))}</dd>
        <dt>Organizations</dt><dd>${escape(list(claim(user, 'organizations')))}</dd>
        <dt>Permissions</dt><dd>${escape(list(claim(user, 'permissions')))}</dd>
      </dl>
      <details>
        <summary>ID token claims</summary>
        <pre>${escape(JSON.stringify(user, null, 2))}</pre>
      </details>
      <div class="actions">
        ${portalLink}
        <a class="btn btn-secondary" href="/logout">Log out</a>
      </div>
    </main>
  `));
});

// Errors of the login callback
app.use((err, req, res, next) => {
  // Silent SSO check without Auth0 session: expected, show the logged-out
  // home page
  if (err.error === 'login_required') return res.redirect('/');
  // Silent SSO check with an Auth0 session, but the user must act first
  // (consent to this application, always asked on localhost): interactive
  // login, which still asks no password
  if (err.error === 'consent_required' || err.error === 'interaction_required') {
    return res.oidc.login({ returnTo: '/' });
  }
  // Denied by an Action (e.g. no role of the application)
  if (err.error === 'access_denied') {
    return res.status(403).type('html').send(page(`
      <main class="card">
        ${badge}
        <h1>Access denied</h1>
        <p>${escape(err.error_description || 'You do not have access to this application.')}</p>
        <div class="actions">
          <a class="btn btn-primary" href="/switch">Log in with another account</a>
          ${portalLink}
        </div>
      </main>
    `));
  }
  return next(err);
});

app.listen(PORT, () => console.log(`Listening on ${BASE_URL || `http://localhost:${PORT}`}`));
