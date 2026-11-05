# Users database shared by every customer of the tenant (the Admin UI's users
# database): only looked up. Its settings (password policy, sign-up disabled)
# are the tenant's, set once.
data "auth0_connection" "users" {
  name = var.users_connection
}

# Tenant's passwordless email connection: one per tenant, shared with the
# other demos, so it is only looked up (enabled on the demo applications)
data "auth0_connection" "email" {
  count = var.enable_passwordless_email ? 1 : 0

  name = "email"
}

locals {
  connection_ids = merge(
    { users = data.auth0_connection.users.id },
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
