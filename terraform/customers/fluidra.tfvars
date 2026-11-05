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

# PRO AREA applications and the roles giving access to them
applications = {
  esales = {
    name        = "eSales"
    description = "Order management and ERP integration"
    icon        = "🛒"
    roles       = ["buyer", "admin"]
  }
  mediaCenter = {
    name        = "Media Center"
    description = "Marketing materials and product documentation"
    icon        = "📚"
    roles       = ["b2b_customer", "admin"]
  }
  proAcademy = {
    name        = "Pro Academy"
    description = "Training courses and certifications"
    icon        = "🎓"
    roles       = ["b2b_customer", "admin"]
  }
  proLab = {
    name        = "Pro Lab"
    description = "Technical tools and diagnostics"
    icon        = "🔬"
    roles       = ["b2b_customer", "admin"]
  }
  proApp = {
    name        = "Pro App"
    description = "Mobile field service application"
    icon        = "📱"
    roles       = ["admin"]
  }
}

# Emails: test_users_email_template (<alias>@example.com by default), never the
# prospect's real addresses (passwordless codes and MFA emails are sent to them)
test_users = {
  fluidra-admin = {
    description   = "Fluidra admin, full access (DAE administrator)"
    name          = "Fluidra Admin"
    organizations = { fluidra-es = "admin" }
    roles         = ["admin"]
    app_metadata  = { dae_role = "Delegated Admin - Administrator" }
  }
  fluidra-customer = {
    description   = "B2B customer persona"
    name          = "Fluidra Customer"
    organizations = { fluidra-es = "member" }
    roles         = ["b2b_customer"]
  }
  fluidra-multi = {
    description   = "Buyer of the three brands"
    name          = "Multi-brand Buyer"
    organizations = { fluidra-es = "member", grepool-es = "member", astralpool-es = "member" }
    roles         = ["buyer"]
  }
  grepool-buyer = {
    description   = "Single-brand buyer"
    name          = "Grepool Buyer"
    organizations = { grepool-es = "member" }
    roles         = ["buyer"]
  }
  grepool-admin = {
    description   = "Grepool admin, scoped DAE administrator"
    name          = "Grepool Admin"
    organizations = { grepool-es = "admin" }
    roles         = ["admin"]
    app_metadata  = { dae_role = "Delegated Admin - Administrator" }
  }
}
