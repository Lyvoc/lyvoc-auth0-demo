# Values for the demo app (.env) and the DAE hooks

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
  value       = { for alias, user in var.test_users : local.test_user_emails[alias] => user.memberships }
}

output "test_users_password" {
  value     = random_password.test_users.result
  sensitive = true
}

output "admin_ui_url" {
  value = var.admin_ui_url
}
