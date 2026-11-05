data "auth0_tenant" "current" {}

locals {
  slug             = var.customer.slug
  app_name         = coalesce(var.app_name, "${var.customer.name} Portal")
  role_prefix      = "${local.app_name}:"
  api_identifier   = coalesce(var.api_identifier, "https://${local.slug}.demo/api")
  claims_namespace = coalesce(var.claims_namespace, "https://${local.slug}.demo/")
  auth0_domain     = var.custom_domain != "" ? var.custom_domain : data.auth0_tenant.current.domain
  managed_by       = "Managed by Terraform (lyvoc-auth0-demo, ${local.slug})"

  # Organization branding, falling back to the customer's
  organization_branding = {
    for name, org in var.organizations : name => {
      logo_url              = coalesce(org.logo_url, var.customer.logo_url, "https://cdn.auth0.com/styleguide/components/1.0.8/media/logos/img/badge.png")
      primary_color         = coalesce(org.primary_color, var.customer.primary_color)
      page_background_color = coalesce(org.page_background_color, var.customer.page_background_color)
    }
  }

  # <tenant>.<region>.auth0.com -> https://<tenant>.<region>.webtask.run/auth0-delegated-admin
  tenant_parts = split(".", data.auth0_tenant.current.domain)
  dae_url = var.dae_url != "" ? var.dae_url : format(
    "https://%s.%s.webtask.run/auth0-delegated-admin",
    local.tenant_parts[0],
    length(local.tenant_parts) == 4 ? local.tenant_parts[1] : "us"
  )

  # Application login URI: the first https origin (Auth0 rejects http ones)
  https_spa_urls = [for url in var.spa_urls : url if startswith(url, "https://")]
  https_web_urls = [for url in var.web_app_urls : url if startswith(url, "https://")]

  # Generic addresses (example.com: reserved, receives nothing), except the
  # accounts that receive emails (passwordless codes): a real mailbox
  test_user_emails = {
    for alias, user in var.test_users :
    alias => user.receives_emails && var.test_users_email_template != "" ? format(var.test_users_email_template, alias) : "${alias}@example.com"
  }

  # One entry per (user, organization), with the organization role
  memberships = {
    for m in flatten([
      for alias, user in var.test_users : [
        for org, role in user.organizations : { alias = alias, org = org, role = role }
      ]
    ]) : "${m.alias}/${m.org}" => m
  }
}

# A customer's tfvars applied to another customer's state would replace all
# of its objects: the workspace must be named after the customer.
resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == local.slug
      error_message = "Run \"terraform workspace select ${local.slug}\" (or \"terraform workspace new ${local.slug}\") before using this tfvars file."
    }
  }
}
