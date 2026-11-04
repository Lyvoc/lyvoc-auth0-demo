# Demo SPA (the React app of this repository)
resource "auth0_client" "spa" {
  name                = local.app_name
  description         = "${var.customer.name} demo single-page application. ${local.managed_by}"
  app_type            = "spa"
  logo_uri            = var.customer.logo_url != "" ? var.customer.logo_url : null
  is_first_party      = true
  oidc_conformant     = true
  callbacks           = distinct(concat([for url in var.spa_urls : "${url}/token"], var.spa_urls))
  allowed_logout_urls = var.spa_urls
  web_origins         = var.spa_urls
  initiate_login_uri  = length(local.https_spa_urls) > 0 ? "${local.https_spa_urls[0]}/" : null
  grant_types         = ["authorization_code", "refresh_token"]
  organization_usage  = "allow"

  jwt_configuration {
    alg = "RS256"
  }

  refresh_token {
    rotation_type       = "rotating"
    expiration_type     = "expiring"
    token_lifetime      = 2592000
    idle_token_lifetime = 1296000
    leeway              = 0
  }
}

resource "auth0_client_credentials" "spa" {
  client_id             = auth0_client.spa.id
  authentication_method = "none"
}

# Regular web application, for the SSO demo between two applications
resource "auth0_client" "web" {
  name                = "${local.app_name} Web"
  description         = "${var.customer.name} demo regular web application (SSO with the SPA). ${local.managed_by}"
  app_type            = "regular_web"
  logo_uri            = var.customer.logo_url != "" ? var.customer.logo_url : null
  is_first_party      = true
  oidc_conformant     = true
  callbacks           = [for url in var.web_app_urls : "${url}/callback"]
  allowed_logout_urls = var.web_app_urls
  initiate_login_uri  = length(local.https_web_urls) > 0 ? "${local.https_web_urls[0]}/login" : null
  grant_types         = ["authorization_code", "refresh_token"]
  organization_usage  = "allow"

  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_client_credentials" "web" {
  client_id             = auth0_client.web.id
  authentication_method = "client_secret_post"
}

# Management API application of the Delegated Administration extension hooks
# (invitations, user and role updates)
resource "auth0_client" "dae_hooks" {
  count = var.enable_dae ? 1 : 0

  name        = "${var.customer.name} - DAE hooks"
  description = "Management API access for the Delegated Administration extension hooks of the ${var.customer.name} demo. ${local.managed_by}"
  app_type    = "non_interactive"
  grant_types = ["client_credentials"]

  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_client_credentials" "dae_hooks" {
  count = var.enable_dae ? 1 : 0

  client_id             = auth0_client.dae_hooks[0].id
  authentication_method = "client_secret_post"
}

resource "auth0_client_grant" "dae_hooks" {
  count = var.enable_dae ? 1 : 0

  client_id = auth0_client.dae_hooks[0].id
  audience  = data.auth0_tenant.current.management_api_identifier
  scopes = [
    "read:users",
    "update:users",
    "read:roles",
    "create:role_members",
    "delete:role_members",
    "read:organizations",
    "read:organization_members",
    "create:organization_members",
    "read:organization_member_roles",
    "create:organization_member_roles",
    "delete:organization_member_roles",
    "create:organization_invitations",
  ]
}
