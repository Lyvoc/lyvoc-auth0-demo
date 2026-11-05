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

# Accounts are created by the Admin UI or Terraform only: a self-registered
# account would hold no application role (denied anyway)
allow_public_signup = false

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

# Emails: test_users_email_template (<alias>@example.com by default).
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
    description   = "Organization member, B2B customer of the application"
    name          = "Acme Customer"
    organizations = { acme-france = "member" }
    roles         = ["b2b_customer"]
  }
  acme-multi = {
    description   = "Two organizations with different roles, buyer of the application"
    name          = "Acme Multi-organization Buyer"
    organizations = { acme-france = "member", acme-spain = "admin" }
    roles         = ["buyer"]
  }
  acme-direct = {
    description = "No organization, buyer of the application"
    name        = "Acme Direct Buyer"
    roles       = ["buyer"]
  }
  acme-no-app = {
    description   = "Organization member without application access: denied"
    name          = "Acme No Application"
    organizations = { acme-spain = "member" }
  }
}
