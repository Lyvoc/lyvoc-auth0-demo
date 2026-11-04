# Test accounts, all with the same password: test_users_password, or a
# generated one (terraform output -raw test_users_password)
resource "random_password" "test_users" {
  length           = 20
  special          = true
  override_special = "!#%*-_=+?"
  min_lower        = 2
  min_upper        = 2
  min_numeric      = 2
  min_special      = 2
}

locals {
  test_users_password = var.test_users_password != "" ? var.test_users_password : random_password.test_users.result
}

# The Management API only creates users in a database enabled for the caller
resource "auth0_connection_client" "terraform" {
  connection_id = auth0_connection.users.id
  client_id     = var.terraform_client_id
}

resource "auth0_user" "test" {
  for_each = var.test_users

  depends_on = [auth0_connection_client.terraform]

  connection_name = auth0_connection.users.name
  email           = local.test_user_emails[each.key]
  name            = each.value.name
  email_verified  = true
  # Reset to the shared password at every apply, even if changed during a demo
  password = local.test_users_password

  # organizations: names, read by the DAE hooks
  app_metadata = jsonencode(merge(each.value.app_metadata, { organizations = keys(each.value.memberships) }))

  # Edited afterwards by the demo itself (Admin UI, DAE)
  lifecycle {
    ignore_changes = [app_metadata, user_metadata]
  }
}

resource "auth0_organization_member" "test" {
  for_each = local.memberships

  organization_id = auth0_organization.this[each.value.org].id
  user_id         = auth0_user.test[each.value.alias].id
}

resource "auth0_organization_member_roles" "test" {
  for_each = { for key, m in local.memberships : key => m if length(m.roles) > 0 }

  organization_id = auth0_organization.this[each.value.org].id
  user_id         = auth0_user.test[each.value.alias].id
  roles           = [for role in each.value.roles : auth0_role.app[role].id]

  depends_on = [auth0_organization_member.test]
}
