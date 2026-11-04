# Demo API (audience of the SPA access tokens). RBAC on: the roles'
# permissions are added to the access token.
resource "auth0_resource_server" "api" {
  name                                            = "${var.customer.name} - Demo API"
  identifier                                      = local.api_identifier
  signing_alg                                     = "RS256"
  allow_offline_access                            = true
  skip_consent_for_verifiable_first_party_clients = true
  enforce_policies                                = true
  token_dialect                                   = "access_token_authz"
  token_lifetime                                  = 86400
}

resource "auth0_resource_server_scopes" "api" {
  resource_server_identifier = auth0_resource_server.api.identifier

  scopes {
    name        = "read:data"
    description = "Read data"
  }

  scopes {
    name        = "write:data"
    description = "Write data"
  }
}
