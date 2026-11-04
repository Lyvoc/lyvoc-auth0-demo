# One customer (prospect) per Terraform workspace and tfvars file:
#   terraform workspace select <slug>
#   terraform plan -var-file=customers/<slug>.tfvars
# The tenant is shared with other demos: every object created here is
# prefixed with the customer, and tenant-wide settings (theme, MFA factors,
# prompts, email provider, tenant settings) are left untouched.

variable "terraform_client_id" {
  description = "Client ID of the Terraform M2M application (TF_VAR_terraform_client_id=$AUTH0_CLIENT_ID): the demo database is enabled for it, which the Management API requires to create the test users."
  type        = string
}

variable "customer" {
  description = "Customer the demo is branded for."
  type = object({
    slug                  = string
    name                  = string
    logo_url              = optional(string, "")
    primary_color         = optional(string, "#0059d6")
    secondary_color       = optional(string, "#00a3e0")
    page_background_color = optional(string, "#ffffff")
  })

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,20}$", var.customer.slug))
    error_message = "customer.slug: 2 to 21 lowercase letters, digits or hyphens."
  }
}

variable "app_name" {
  description = "Name of the demo SPA, also the prefix of its roles (\"<app_name>:<role>\", the Admin UI convention). Defaults to \"<customer name> Portal\"."
  type        = string
  default     = null
}

variable "spa_urls" {
  description = "Origins of the demo SPA (no trailing slash). The first https one is the application login URI (invitations)."
  type        = list(string)
  default     = ["http://localhost:8080"]
}

variable "web_app_urls" {
  description = "Origins of the demo regular web application (SSO with the SPA)."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "api_identifier" {
  description = "Audience of the demo API. Defaults to \"https://<slug>.demo/api\"."
  type        = string
  default     = null
}

variable "claims_namespace" {
  description = "Namespace of the custom claims read by the demo app (trailing slash included). Defaults to \"https://<slug>.demo/\"."
  type        = string
  default     = null
}

variable "roles" {
  description = "Business roles of the demo application (key = role name without the application prefix), with their API permissions."
  type = map(object({
    description = string
    permissions = optional(list(string), [])
  }))
  default = {
    admin = {
      description = "Administrator"
      permissions = ["read:data", "write:data"]
    }
    b2b_customer = {
      description = "B2B customer"
      permissions = ["read:data"]
    }
    buyer = {
      description = "Buyer"
      permissions = ["read:data"]
    }
  }

  validation {
    condition = alltrue(flatten([
      for role in values(var.roles) : [for p in role.permissions : contains(["read:data", "write:data"], p)]
    ]))
    error_message = "roles: permissions must be API scopes (read:data, write:data)."
  }
}

variable "organizations" {
  description = "B2B organizations (key = organization name, lowercase). Branding falls back to the customer's."
  type = map(object({
    display_name          = string
    logo_url              = optional(string)
    primary_color         = optional(string)
    page_background_color = optional(string)
  }))

  validation {
    condition     = alltrue([for name in keys(var.organizations) : can(regex("^[a-z0-9][a-z0-9_-]{0,49}$", name))])
    error_message = "organizations: names are lowercase letters, digits, hyphens or underscores (50 max)."
  }
}

variable "applications" {
  description = "Applications of the customer portal shown in the demo app (tiles, key = ID), with the roles giving access to them."
  type = map(object({
    name        = string
    description = string
    icon        = string
    roles       = list(string)
  }))
  default = {
    orders = {
      name        = "Orders"
      description = "Order management"
      icon        = "🛒"
      roles       = ["buyer", "admin"]
    }
    documents = {
      name        = "Documents"
      description = "Product documentation and marketing material"
      icon        = "📚"
      roles       = ["b2b_customer", "admin"]
    }
    training = {
      name        = "Training"
      description = "Courses and certifications"
      icon        = "🎓"
      roles       = ["b2b_customer", "admin"]
    }
    support = {
      name        = "Support"
      description = "Tickets and field service"
      icon        = "🛠️"
      roles       = ["admin"]
    }
  }

  validation {
    condition     = alltrue(flatten([for app in values(var.applications) : [for role in app.roles : contains(keys(var.roles), role)]]))
    error_message = "applications: roles must be declared in roles."
  }
}

variable "test_users" {
  description = "Test accounts (key = alias, see test_users_email_template) with their organization memberships (organization name => roles)."
  type = map(object({
    name         = string
    description  = optional(string, "")
    memberships  = optional(map(list(string)), {})
    app_metadata = optional(map(string), {})
  }))
  default = {}

  validation {
    condition = alltrue(flatten([
      for user in values(var.test_users) : [
        for org, roles in user.memberships : concat(
          [contains(keys(var.organizations), org)],
          [for role in roles : contains(keys(var.roles), role)]
        )
      ]
    ]))
    error_message = "test_users: memberships must use organizations and roles declared in this file."
  }
}

variable "test_users_email_template" {
  description = "Email of the test accounts, %s being the alias: a mailbox of the person running the demo, to receive the passwordless and MFA codes (e.g. \"firstname.lastname+%s@lyvoc.com\", set in the git-ignored credentials file). Empty: <alias>@example.com, which receives nothing."
  type        = string
  default     = ""

  validation {
    condition     = var.test_users_email_template == "" || can(regex("^[^@%]*%s[^@%]*@[^@%]+$", var.test_users_email_template))
    error_message = "test_users_email_template: an email address with a single %s before the @."
  }
}

variable "allow_public_signup" {
  description = "Whether users can sign up to the demo database (self-service registration demo)."
  type        = bool
  default     = true
}

variable "mfa" {
  description = "MFA of the demo database users (post-login Action): \"step-up\" only when the demo app asks for it (acr_values), \"always\" at every login, \"off\". The tenant must have at least one MFA factor enabled."
  type        = string
  default     = "step-up"

  validation {
    condition     = contains(["step-up", "always", "off"], var.mfa)
    error_message = "mfa: \"step-up\", \"always\" or \"off\"."
  }
}

variable "enable_passwordless_email" {
  description = "Enable the tenant's passwordless \"email\" connection (one per tenant, not managed here) on the demo applications and organizations."
  type        = bool
  default     = true
}

variable "enable_dae" {
  description = "Create the Management API application used by the Delegated Administration extension hooks (the extension itself and its roles are tenant-wide, installed manually)."
  type        = bool
  default     = true
}

variable "dae_url" {
  description = "URL of the Delegated Administration extension. Defaults to https://<tenant>.<region>.webtask.run/auth0-delegated-admin."
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Custom domain the demo app uses as its Auth0 domain (empty: the tenant domain)."
  type        = string
  default     = ""
}

variable "admin_ui_url" {
  description = "URL of the Admin UI deployed on this tenant, linked from the demo."
  type        = string
  default     = ""
}
