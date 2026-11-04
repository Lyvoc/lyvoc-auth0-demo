# Users database of the demo (username/password)
resource "auth0_connection" "users" {
  name     = "${local.slug}-users"
  strategy = "auth0"

  options {
    disable_signup         = !var.allow_public_signup
    requires_username      = false
    brute_force_protection = true
    password_policy        = "good"

    password_history {
      enable = true
      size   = 5
    }

    password_no_personal_info {
      enable = true
    }
  }
}

# Tenant's passwordless email connection: one per tenant, shared with the
# other demos, so it is only looked up (enabled on the demo applications)
data "auth0_connection" "email" {
  count = var.enable_passwordless_email ? 1 : 0

  name = "email"
}

locals {
  connection_ids = merge(
    { users = auth0_connection.users.id },
    var.enable_passwordless_email ? { email = data.auth0_connection.email[0].id } : {}
  )
  application_ids = {
    spa = auth0_client.spa.id
    web = auth0_client.web.id
  }
}

# auth0_connection_client (singular) adds one application to a connection
# without touching the other demos' applications
resource "auth0_connection_client" "apps" {
  for_each = {
    for pair in setproduct(keys(local.connection_ids), keys(local.application_ids)) :
    "${pair[0]}/${pair[1]}" => { connection_id = local.connection_ids[pair[0]], client_id = local.application_ids[pair[1]] }
  }

  connection_id = each.value.connection_id
  client_id     = each.value.client_id
}
