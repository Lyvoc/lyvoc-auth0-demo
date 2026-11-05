# Values for the demo app and the DAE hooks

# Configuration of the demo app (no secret but the test accounts' password,
# shown on the demo site): written to src/config/demo.json by `npm run config`
# (scripts/config.mjs, at the repository root), with the web application's
# settings (web-app/.env)
output "demo_config" {
  description = "Configuration of the demo app (src/config/demo.json)."
  value = {
    customer = {
      name                = var.customer.name
      slug                = local.slug
      logoUrl             = var.customer.logo_url
      primaryColor        = var.customer.primary_color
      secondaryColor      = var.customer.secondary_color
      pageBackgroundColor = var.customer.page_background_color
    }
    auth0 = {
      domain   = local.auth0_domain
      clientId = auth0_client.spa.client_id
      audience = auth0_resource_server.api.identifier
    }
    claimsNamespace = local.claims_namespace
    connections = {
      database     = data.auth0_connection.users.name
      passwordless = var.enable_passwordless_email ? "email" : null
    }
    organizations = [
      for name, org in var.organizations : {
        id                  = auth0_organization.this[name].id
        name                = name
        displayName         = org.display_name
        logoUrl             = local.organization_branding[name].logo_url
        primaryColor        = local.organization_branding[name].primary_color
        pageBackgroundColor = local.organization_branding[name].page_background_color
      }
    ]
    roles = [for name, role in var.roles : { name = name, description = role.description }]
    applications = [
      for id, app in var.applications : {
        id          = id
        name        = app.name
        description = app.description
        icon        = app.icon
        roles       = app.roles
      }
    ]
    testUsers = [
      for alias, user in var.test_users : {
        email       = local.test_user_emails[alias]
        name        = user.name
        description = user.description
        memberships = [for org, role in user.organizations : { organization = org, role = role }]
        roles       = user.roles
        daeRole     = lookup(user.app_metadata, "dae_role", "")
        # Real mailbox: passwordless login
        receivesEmails = user.receives_emails
      }
    ]
    testUsersPassword = nonsensitive(local.test_users_password)
    portalUrls        = var.spa_urls
    webAppUrls        = var.web_app_urls
    adminUiUrl        = var.admin_ui_url
    daeUrl            = var.enable_dae ? local.dae_url : ""
    features = {
      passwordless = var.enable_passwordless_email
      dae          = var.enable_dae
      mfa          = var.mfa
    }
  }
}

output "spa_env" {
  description = "Variables of the demo SPA (.env)."
  value = {
    VITE_AUTH0_DOMAIN    = local.auth0_domain
    VITE_AUTH0_CLIENT_ID = auth0_client.spa.client_id
    VITE_AUTH0_AUDIENCE  = auth0_resource_server.api.identifier
    VITE_CUSTOMER_NAME   = var.customer.name
    VITE_LOGO_URL        = var.customer.logo_url
    VITE_PRIMARY_COLOR   = var.customer.primary_color
    VITE_SECONDARY_COLOR = var.customer.secondary_color
  }
}

output "claims_namespace" {
  value = local.claims_namespace
}

output "organizations" {
  description = "Organization IDs by name."
  value       = { for name, org in auth0_organization.this : name => org.id }
}

output "roles" {
  description = "Role IDs by role (without the application prefix)."
  value       = { for name, role in auth0_role.app : name => role.id }
}

output "web_app" {
  description = "Regular web application (SSO demo)."
  value = {
    domain    = local.auth0_domain
    client_id = auth0_client.web.client_id
  }
}

output "web_app_client_secret" {
  value     = auth0_client_credentials.web.client_secret
  sensitive = true
}

output "dae" {
  description = "Values for the Delegated Administration extension hooks."
  value = var.enable_dae ? {
    management_client_id = auth0_client.dae_hooks[0].client_id
    app_client_id        = auth0_client.spa.client_id
    role_ids             = { for name, role in data.auth0_role.dae : name => role.id }
  } : null
}

output "dae_management_client_secret" {
  value     = var.enable_dae ? auth0_client_credentials.dae_hooks[0].client_secret : null
  sensitive = true
}

output "test_users" {
  description = "Test accounts (password: terraform output -raw test_users_password)."
  value = {
    for alias, user in var.test_users : local.test_user_emails[alias] => {
      organizations = user.organizations
      roles         = user.roles
    }
  }
}

output "test_users_password" {
  value     = local.test_users_password
  sensitive = true
}

output "admin_ui_url" {
  value = var.admin_ui_url
}
