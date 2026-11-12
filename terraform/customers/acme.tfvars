# Fictitious customer, to test the configuration on a tenant shared with
# other demos (no name collides with existing objects)
customer = {
  slug                  = "acme"
  name                  = "Acme"
  primary_color         = "#6b21a8"
  secondary_color       = "#a855f7"
  page_background_color = "#f5f3ff"
}

spa_urls     = ["http://localhost:8080"]
web_app_urls = ["http://localhost:3000"]

admin_ui_url = "https://admin-ui-demo.lyvoc.com"

# MFA is shown on demand (demo step), not required at every login
mfa = "step-up"

organizations = {
  acme-france = {
    display_name  = "Acme France"
    primary_color = "#1d4ed8"
  }
  acme-spain = {
    display_name  = "Acme Spain"
    primary_color = "#c2410c"
  }
}

# Emails: <alias>@example.com (receives nothing), or the mailbox of
# test_users_email_template for the accounts with receives_emails.
# Two separate permission lists: organizations (organization => member or
# admin) and roles (application roles, held directly: application access).
test_users = {
  acme-admin = {
    description   = "Organization admin, application admin"
    name          = "Acme Admin"
    organizations = { acme-france = "admin" }
    roles         = ["admin"]
    app_metadata  = { dae_role = "Delegated Admin - Administrator" }
  }
  acme-customer = {
    description   = "Organization member, B2B customer of the application, DAE auditor (read-only)"
    name          = "Acme Customer"
    organizations = { acme-france = "member" }
    roles         = ["b2b_customer"]
    app_metadata  = { dae_role = "Delegated Admin - Auditor" }
  }
  # DAE: manages the users of Acme France (organization admin), the users
  # section only (no logs, no configuration)
  acme-dae-user = {
    description   = "Organization admin, B2B customer of the application, DAE user (users only)"
    name          = "Acme DAE User"
    organizations = { acme-france = "admin" }
    roles         = ["b2b_customer"]
    app_metadata  = { dae_role = "Delegated Admin - User" }
  }
  acme-multi = {
    description   = "Two organizations with different roles, buyer of the application, DAE operator: manages Acme Spain, reads Acme France"
    name          = "Acme Multi-organization Buyer"
    organizations = { acme-france = "member", acme-spain = "admin" }
    roles         = ["buyer"]
    app_metadata  = { dae_role = "Delegated Admin - Operator" }
    # Interface language (the others: test_users_locale, "en" by default)
    locale = "fr"
  }
  acme-direct = {
    description = "No organization, buyer of the application, passwordless login (code by email)"
    name        = "Acme Direct Buyer"
    roles       = ["buyer"]
    # Real mailbox: receives the passwordless codes
    receives_emails = true
  }
  acme-no-app = {
    description   = "Organization member without application access: denied"
    name          = "Acme No Application"
    organizations = { acme-spain = "member" }
  }
}
