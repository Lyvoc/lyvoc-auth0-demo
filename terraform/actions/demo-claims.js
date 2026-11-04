/**
 * Demo claims (post-login), for the demo applications only:
 * - <namespace>org_roles: the user's roles (organization roles in an
 *   organization login), without the "<application>:" prefix
 * - <namespace>organizations: organization names (app_metadata)
 * - <namespace>app_metadata: the user's app_metadata
 *
 * Secrets: DEMO_CLIENT_IDS (comma-separated), CLAIMS_NAMESPACE, ROLE_PREFIX.
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientIds = (event.secrets.DEMO_CLIENT_IDS || "").split(",")
  if (!clientIds.includes(event.client.client_id)) return

  const namespace = event.secrets.CLAIMS_NAMESPACE
  const prefix = event.secrets.ROLE_PREFIX
  const roles = (event.authorization?.roles || [])
    .filter((role) => role.startsWith(prefix))
    .map((role) => role.slice(prefix.length))
  const appMetadata = event.user.app_metadata || {}

  api.idToken.setCustomClaim(`${namespace}org_roles`, roles)
  api.accessToken.setCustomClaim(`${namespace}org_roles`, roles)
  api.idToken.setCustomClaim(
    `${namespace}organizations`,
    Array.isArray(appMetadata.organizations) ? appMetadata.organizations : []
  )
  api.idToken.setCustomClaim(`${namespace}app_metadata`, appMetadata)
}
