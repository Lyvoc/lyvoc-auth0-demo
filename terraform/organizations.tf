# B2B organizations, each with its own login page branding
resource "auth0_organization" "this" {
  for_each = var.organizations

  name         = each.key
  display_name = each.value.display_name
  metadata = {
    customer = local.slug
  }

  branding {
    logo_url = local.organization_branding[each.key].logo_url
    colors = {
      primary         = local.organization_branding[each.key].primary_color
      page_background = local.organization_branding[each.key].page_background_color
    }
  }
}

# Connections available in each organization (members only: no
# auto-membership, sign-up through invitations)
resource "auth0_organization_connection" "this" {
  for_each = {
    for pair in setproduct(keys(var.organizations), keys(local.connection_ids)) :
    "${pair[0]}/${pair[1]}" => { org = pair[0], connection_id = local.connection_ids[pair[1]] }
  }

  organization_id            = auth0_organization.this[each.value.org].id
  connection_id              = each.value.connection_id
  assign_membership_on_login = false
}
