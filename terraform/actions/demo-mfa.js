/**
 * Demo MFA (post-login): database users of the demo applications must use a
 * second factor; "remember this browser" skips it for a while.
 * Needs at least one MFA factor enabled on the tenant.
 *
 * Secrets: DEMO_CLIENT_IDS (comma-separated), DATABASE_CONNECTION.
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientIds = (event.secrets.DEMO_CLIENT_IDS || "").split(",")
  if (!clientIds.includes(event.client.client_id)) return
  if (event.connection.name !== event.secrets.DATABASE_CONNECTION) return

  api.multifactor.enable("any", { allowRememberBrowser: true })
}
