# Application roles, named "<application>:<role>" like the roles the Admin UI
# manages, so the Admin UI shows them under the demo application. Held
# directly by the users: they give access to the application.
resource "auth0_role" "app" {
  for_each = var.roles

  name        = "${local.role_prefix}${each.key}"
  description = each.value.description
}

resource "auth0_role_permissions" "app" {
  for_each = { for name, role in var.roles : name => role if length(role.permissions) > 0 }

  role_id = auth0_role.app[each.key].id

  dynamic "permissions" {
    for_each = toset(each.value.permissions)

    content {
      name                       = permissions.value
      resource_server_identifier = auth0_resource_server.api.identifier
    }
  }

  depends_on = [auth0_resource_server_scopes.api]
}

# Organization roles (member, admin): the Admin UI's tenant-wide roles, shared
# by every customer, so only looked up. This demo adds its API's permissions to
# them one by one (auth0_role_permission, singular: other customers' remain).
data "auth0_role" "organization" {
  for_each = var.organization_roles

  name             = each.key
  skip_users       = true
  skip_permissions = true
}

resource "auth0_role_permission" "organization" {
  for_each = {
    for p in flatten([
      for role, permissions in var.organization_roles : [for permission in permissions : { role = role, permission = permission }]
    ]) : "${p.role}/${p.permission}" => p
  }

  role_id                    = data.auth0_role.organization[each.value.role].id
  resource_server_identifier = auth0_resource_server.api.identifier
  permission                 = each.value.permission

  depends_on = [auth0_resource_server_scopes.api]
}

# Roles of the Delegated Administration extension: their names are fixed by
# the extension and shared by the whole tenant, so they are only looked up
# (their IDs go to the DAE hooks)
locals {
  dae_role_names = [
    "Delegated Admin - Administrator",
    "Delegated Admin - Operator",
    "Delegated Admin - Auditor",
    "Delegated Admin - User",
  ]
}

data "auth0_role" "dae" {
  for_each = var.enable_dae ? toset(local.dae_role_names) : toset([])

  name             = each.key
  skip_users       = true
  skip_permissions = true
}
