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

  # Cache of the role assignments read by the Admin UI (application members,
  # Applications column), the access Action and the applications, in the
  # format the Admin UI's syncUserRoleMetadata() builds:
  # roles[app]["_direct"] = [{ name, permission }] (application roles are held
  # directly; organization roles have no application and are not listed)
  test_users_role_metadata = {
    for alias, user in var.test_users : alias => {
      roles = {
        for app in(length(user.roles) > 0 ? [local.app_name] : []) : app => {
          _direct = [for role in user.roles : { name = "${local.role_prefix}${role}", permission = var.roles[role].description }]
        }
      }
      apps          = length(user.roles) == 0 ? [] : [local.app_name]
      organizations = keys(user.organizations)
    }
  }

  # Passwordless logins are separate users of the "email" connection, outside
  # any organization: each test account with an application role gets one,
  # with the same roles
  passwordless_test_users = var.enable_passwordless_email ? { for alias, user in var.test_users : alias => user if length(user.roles) > 0 } : {}
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

  # Reset at every apply with the memberships, like the password
  app_metadata = jsonencode(merge(each.value.app_metadata, local.test_users_role_metadata[each.key]))

  lifecycle {
    ignore_changes = [user_metadata]
  }
}

# Application access: the application roles, held directly
resource "auth0_user_roles" "test" {
  for_each = { for alias, user in var.test_users : alias => user if length(user.roles) > 0 }

  user_id = auth0_user.test[each.key].id
  roles   = [for role in each.value.roles : auth0_role.app[role].id]
}

# Organizations: membership with the organization role (member or admin)
resource "auth0_organization_member" "test" {
  for_each = local.memberships

  organization_id = auth0_organization.this[each.value.org].id
  user_id         = auth0_user.test[each.value.alias].id
}

resource "auth0_organization_member_roles" "test" {
  for_each = local.memberships

  organization_id = auth0_organization.this[each.value.org].id
  user_id         = auth0_user.test[each.value.alias].id
  roles           = [data.auth0_role.organization[each.value.role].id]

  depends_on = [auth0_organization_member.test]
}

resource "auth0_user" "passwordless" {
  for_each = local.passwordless_test_users

  connection_name = data.auth0_connection.email[0].name
  email           = local.test_user_emails[each.key]
  name            = each.value.name
  email_verified  = true
  app_metadata = jsonencode(merge(each.value.app_metadata, local.test_users_role_metadata[each.key], {
    organizations = []
  }))

  lifecycle {
    ignore_changes = [user_metadata]
  }
}

resource "auth0_user_roles" "passwordless" {
  for_each = local.passwordless_test_users

  user_id = auth0_user.passwordless[each.key].id
  roles   = [for role in each.value.roles : auth0_role.app[role].id]
}
