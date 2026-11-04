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

# Emails: test_users_email_template (<alias>@example.com by default)
test_users = {
  acme-admin = {
    name         = "Acme Admin"
    memberships  = { acme-france = ["admin"] }
    app_metadata = { dae_role = "Delegated Admin - Administrator", business_role = "admin" }
  }
  acme-customer = {
    name         = "Acme Customer"
    memberships  = { acme-france = ["b2b_customer"] }
    app_metadata = { business_role = "b2b_customer" }
  }
  acme-multi = {
    name         = "Acme Multi-organization Buyer"
    memberships  = { acme-france = ["buyer"], acme-spain = ["buyer"] }
    app_metadata = { business_role = "buyer" }
  }
}
