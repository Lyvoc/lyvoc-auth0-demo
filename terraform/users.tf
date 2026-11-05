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

  # Test accounts that can also log in with a passwordless code
  passwordless_test_users = var.enable_passwordless_email ? var.test_users : {}
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

# Application access: the application roles, held directly. Every account,
# even without role: a role given during a demo is removed at the next apply.
resource "auth0_user_roles" "test" {
  for_each = var.test_users

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

# Passwordless login: the passwordless identity is linked to the account (one
# account, two ways to log in, same roles and organizations). The provider has
# no account linking resource: a script calls the Management API, with
# Terraform's credentials. Linking again after the account is recreated.
resource "terraform_data" "passwordless_link" {
  for_each = local.passwordless_test_users

  triggers_replace = [auth0_user.test[each.key].id, local.test_user_emails[each.key]]

  provisioner "local-exec" {
    command = "python3 ${path.module}/scripts/link-passwordless.py"
    environment = {
      PRIMARY_USER_ID = auth0_user.test[each.key].id
      EMAIL           = local.test_user_emails[each.key]
      CONNECTION      = data.auth0_connection.email[0].name
    }
  }
}

# Former separate passwordless users: forgotten, not deleted (the link script
# links them to their account)
removed {
  from = auth0_user.passwordless

  lifecycle {
    destroy = false
  }
}

removed {
  from = auth0_user_roles.passwordless

  lifecycle {
    destroy = false
  }
}
