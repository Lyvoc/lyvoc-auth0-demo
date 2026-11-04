# Fluidra demo (brands of src/config/organizationBranding.ts). The
# organizations fluidra-es, grepool-es and astralpool-es were created by hand
# on demo-lyvoc: apply only once they have been removed (or imported).
customer = {
  slug            = "fluidra"
  name            = "Fluidra"
  logo_url        = "https://www.fluidra.com/wp-content/uploads/2024/07/Logo.webp"
  primary_color   = "#005BAC"
  secondary_color = "#00A3E0"
}

# Claim namespace the current demo app reads (src/context/OrganizationContext.tsx)
claims_namespace = "https://fluidra.com/"

spa_urls     = ["http://localhost:8080", "https://auth0-cte-demo.pages.dev"]
web_app_urls = ["http://localhost:3000"]

admin_ui_url = "https://admin-ui-demo.lyvoc.com"

organizations = {
  fluidra-es = {
    display_name = "Fluidra Spain"
  }
  grepool-es = {
    display_name  = "Grepool Spain"
    logo_url      = "https://www.depozitpiscine.ro/ProducerContentFileHandler/600/600/gre-48.jpeg"
    primary_color = "#ED8936"
  }
  astralpool-es = {
    display_name  = "AstralPool Spain"
    logo_url      = "https://www.astralpool.com/content/dam/astralpool/logo/logo-astralpool.svg"
    primary_color = "#00875A"
  }
}

# Emails: test_users_email_template (<alias>@example.com by default), never the
# prospect's real addresses (passwordless codes and MFA emails are sent to them)
test_users = {
  fluidra-admin = {
    name         = "Fluidra Admin"
    memberships  = { fluidra-es = ["admin"] }
    app_metadata = { dae_role = "Delegated Admin - Administrator", business_role = "admin" }
  }
  fluidra-customer = {
    name         = "Fluidra Customer"
    memberships  = { fluidra-es = ["b2b_customer"] }
    app_metadata = { business_role = "b2b_customer" }
  }
  fluidra-multi = {
    name         = "Multi-brand Buyer"
    memberships  = { fluidra-es = ["buyer"], grepool-es = ["buyer"], astralpool-es = ["buyer"] }
    app_metadata = { business_role = "buyer" }
  }
  grepool-buyer = {
    name         = "Grepool Buyer"
    memberships  = { grepool-es = ["buyer"] }
    app_metadata = { business_role = "buyer" }
  }
  grepool-admin = {
    name         = "Grepool Admin"
    memberships  = { grepool-es = ["admin"] }
    app_metadata = { dae_role = "Delegated Admin - Administrator", business_role = "admin" }
  }
}
