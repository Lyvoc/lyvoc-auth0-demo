/**
 * Demo access and claims (post-login), for the demo applications only.
 *
 * Organizations and applications are two separate permission lists:
 * - application access: a role of the demo application ("<application>:<role>"),
 *   held directly. Users without one are denied, organization member or not.
 * - organizations: membership (checked by Auth0 on an organization login),
 *   with an organization role ("member", "admin").
 *
 * On an organization login the token only holds the organization's roles: the
 * application roles are then read from app_metadata.roles[<application>]._direct,
 * the cache the Admin UI keeps in sync (Terraform for the test accounts).
 *
 * Claims (<namespace>...), ID and access tokens:
 * - app_roles: application roles, without the "<application>:" prefix
 * - org_roles: roles in the login organization (organization login only)
 * - organizations: names of the user's organizations
 * - permissions: permissions of the application and organization roles
 * - app_metadata (ID token only)
 *
 * Secrets: DEMO_CLIENT_IDS (comma-separated), CLAIMS_NAMESPACE, ROLE_PREFIX,
 * ROLE_PERMISSIONS (JSON: role name => permissions).
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientIds = (event.secrets.DEMO_CLIENT_IDS || "").split(",")
  if (!clientIds.includes(event.client.client_id)) return

  const namespace = event.secrets.CLAIMS_NAMESPACE
  const prefix = event.secrets.ROLE_PREFIX
  const appName = prefix.slice(0, -1)
  const permissionsByRole = JSON.parse(event.secrets.ROLE_PERMISSIONS || "{}")
  const appMetadata = event.user.app_metadata || {}
  const tokenRoles = event.authorization?.roles || []

  const appRoles = (
    event.organization
      ? (appMetadata.roles?.[appName]?._direct || []).map((role) => role.name)
      : tokenRoles
  ).filter((role) => role.startsWith(prefix))

  if (appRoles.length === 0) {
    api.access.deny(`You don't have access to ${appName}.`)
    return
  }

  const orgRoles = event.organization ? tokenRoles.filter((role) => !role.includes(":")) : []
  const permissions = [
    ...new Set([...appRoles, ...orgRoles].flatMap((role) => permissionsByRole[role] || [])),
  ]

  const claims = {
    app_roles: appRoles.map((role) => role.slice(prefix.length)),
    org_roles: orgRoles,
    organizations: Array.isArray(appMetadata.organizations) ? appMetadata.organizations : [],
    permissions,
  }
  for (const [name, value] of Object.entries(claims)) {
    api.idToken.setCustomClaim(`${namespace}${name}`, value)
    api.accessToken.setCustomClaim(`${namespace}${name}`, value)
  }
  api.idToken.setCustomClaim(`${namespace}app_metadata`, appMetadata)
}
