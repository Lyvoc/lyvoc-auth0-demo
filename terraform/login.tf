# Tenant-wide login settings (var.tenant_login), managed by a single workspace
# of the tenant: the other customers' workspaces leave tenant_login unset.
#
# Domain detection: identifier-first login (the email first, then the
# password), and email domains sent straight to a connection (home realm
# discovery), e.g. @lyvoc.com to the Admin UI's Okta, created from the Admin
# UI (Admin team > SSO). Only that connection's domains are managed, never its
# other options (client secret): a script reads them and sends them back.
# forward_login_hint: the login_hint of the login request (the invitee's
# email, added by the Admin UI) is forwarded to the identity provider, which
# pre-fills it.

resource "auth0_prompt" "login" {
  count = var.tenant_login != null ? 1 : 0

  universal_login_experience = "new"
  identifier_first           = var.tenant_login.identifier_first
}

resource "terraform_data" "connection_domains" {
  for_each = var.tenant_login != null ? var.tenant_login.domain_connections : {}

  # Replaced (the script runs again) when the domains change. Removed from
  # tenant_login: the connection keeps its domains
  triggers_replace = {
    connection         = each.key
    domains            = each.value
    forward_login_hint = var.tenant_login.forward_login_hint
  }

  provisioner "local-exec" {
    command = "python3 ${path.module}/scripts/connection-domains.py"
    environment = {
      CONNECTION         = each.key
      DOMAINS            = jsonencode(each.value)
      FORWARD_LOGIN_HINT = tostring(var.tenant_login.forward_login_hint)
    }
  }
}
