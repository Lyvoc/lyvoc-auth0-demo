# B2B organizations, each with its own login page branding
resource "auth0_organization" "this" {
  for_each = var.organizations

  name         = each.key
  display_name = each.value.display_name
  metadata = {
    customer = local.slug
  }

  branding {
    logo_url = coalesce(each.value.logo_url, var.customer.logo_url, "https://cdn.auth0.com/styleguide/components/1.0.8/media/logos/img/badge.png")
    colors = {
      primary         = coalesce(each.value.primary_color, var.customer.primary_color)
      page_background = coalesce(each.value.page_background_color, var.customer.page_background_color)
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
