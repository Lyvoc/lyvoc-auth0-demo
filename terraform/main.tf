data "auth0_tenant" "current" {}

locals {
  slug             = var.customer.slug
  app_name         = coalesce(var.app_name, "${var.customer.name} Portal")
  role_prefix      = "${local.app_name}:"
  api_identifier   = coalesce(var.api_identifier, "https://${local.slug}.demo/api")
  claims_namespace = coalesce(var.claims_namespace, "https://${local.slug}.demo/")
  auth0_domain     = var.custom_domain != "" ? var.custom_domain : data.auth0_tenant.current.domain
  managed_by       = "Managed by Terraform (lyvoc-auth0-demo, ${local.slug})"

  # Application login URI: the first https origin (Auth0 rejects http ones)
  https_spa_urls = [for url in var.spa_urls : url if startswith(url, "https://")]
  https_web_urls = [for url in var.web_app_urls : url if startswith(url, "https://")]

  test_user_emails = {
    for alias in keys(var.test_users) :
    alias => var.test_users_email_template != "" ? format(var.test_users_email_template, alias) : "${alias}@example.com"
  }

  # One entry per (user, organization)
  memberships = {
    for m in flatten([
      for alias, user in var.test_users : [
        for org, roles in user.memberships : { alias = alias, org = org, roles = roles }
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
