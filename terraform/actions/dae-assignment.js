/**
 * DAE assignment (post-user-registration), for the users created through the
 * Delegated Administration extension.
 *
 * The DAE's Write Hook runs before the user exists, so it cannot add the
 * organization membership: it lets the DAE create the user and leaves the
 * assignment in app_metadata.dae_pending ({ organization, org_role, app_role,
 * dae_role }). This Action completes it: membership with the organization
 * role, application and DAE roles held directly, then the app_metadata role
 * cache (as the Admin UI builds it), and removes dae_pending.
 *
 * Only for this customer's organizations (several customers on the tenant).
 * Runs asynchronously: the user may show without roles for a few seconds.
 *
 * Secrets: DOMAIN (tenant domain), CLIENT_ID, CLIENT_SECRET (Management API
 * application of the DAE hooks), ORGANIZATIONS (JSON: organization names).
 */
exports.onExecutePostUserRegistration = async (event) => {
  const pending = event.user.app_metadata?.dae_pending
  if (!pending) return
  const organizations = JSON.parse(event.secrets.ORGANIZATIONS || "[]")
  if (!organizations.includes(pending.organization)) return

  const base = `https://${event.secrets.DOMAIN}`
  const tokenResponse = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: event.secrets.CLIENT_ID,
      client_secret: event.secrets.CLIENT_SECRET,
      audience: `${base}/api/v2/`,
    }),
  })
  const { access_token: token } = await tokenResponse.json()

  const api = async (method, path, body) => {
    const response = await fetch(`${base}/api/v2${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`)
    return response.status === 204 ? null : response.json()
  }
  const findRole = async (name) => {
    const roles = await api("GET", `/roles?per_page=100&name_filter=${encodeURIComponent(name)}`)
    const role = roles.find((r) => r.name === name)
    if (!role) throw new Error(`Unknown role: ${name}`)
    return role
  }

  const id = encodeURIComponent(event.user.user_id)
  const org = await api("GET", `/organizations/name/${encodeURIComponent(pending.organization)}`)
  await api("POST", `/organizations/${org.id}/members`, { members: [event.user.user_id] })
  const orgRole = await findRole(pending.org_role || "member")
  await api("POST", `/organizations/${org.id}/members/${id}/roles`, { roles: [orgRole.id] })

  const direct = await Promise.all([pending.app_role, pending.dae_role].filter(Boolean).map(findRole))
  if (direct.length) await api("POST", `/users/${id}/roles`, { roles: direct.map((r) => r.id) })

  // app_metadata cache, rebuilt from Auth0: roles[app][organization | "_direct"]
  const roles = {}
  const add = (scope, role) => {
    const [app, name] = role.name.split(":")
    if (!name) return // organization and DAE roles: no application
    roles[app] ??= {}
    roles[app][scope] ??= []
    roles[app][scope].push({ name: role.name, permission: role.description || "" })
  }
  ;(await api("GET", `/users/${id}/roles?per_page=100`)).forEach((role) => add("_direct", role))
  const userOrgs = await api("GET", `/users/${id}/organizations?per_page=100`)
  for (const userOrg of userOrgs) {
    const orgRoles = await api("GET", `/organizations/${userOrg.id}/members/${id}/roles?per_page=100`)
    orgRoles.forEach((role) => add(userOrg.name, role))
  }
  await api("PATCH", `/users/${id}`, {
    app_metadata: {
      roles,
      apps: Object.keys(roles),
      organizations: userOrgs.map((o) => o.name),
      dae_pending: null,
    },
  })
}
