/**
 * Demo MFA (post-login), for database users of the demo applications:
 * - MFA_MODE "step-up": only when the app asks for it (acr_values with the
 *   multi-factor policy), e.g. the demo's MFA step
 * - MFA_MODE "always": at every login ("remember this browser" allowed)
 * Needs at least one MFA factor enabled on the tenant.
 *
 * Secrets: DEMO_CLIENT_IDS (comma-separated), DATABASE_CONNECTION, MFA_MODE.
 */
const MFA_POLICY = "http://schemas.openid.net/pape/policies/2007/06/multi-factor"

exports.onExecutePostLogin = async (event, api) => {
  const clientIds = (event.secrets.DEMO_CLIENT_IDS || "").split(",")
  if (!clientIds.includes(event.client.client_id)) return
  if (event.connection.name !== event.secrets.DATABASE_CONNECTION) return

  const always = event.secrets.MFA_MODE === "always"
  const requested = (event.transaction?.acr_values || []).includes(MFA_POLICY)
  if (!always && !requested) return

  api.multifactor.enable("any", { allowRememberBrowser: always })
}
