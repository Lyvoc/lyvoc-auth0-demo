terraform {
  # Cross-variable validation (variables.tf) needs 1.9
  required_version = ">= 1.9"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }

  # Local state for now (terraform.tfstate.d/<workspace>/, git-ignored).
  # The S3 backend comes with the GitHub pipeline.
}

# Credentials of the Terraform M2M application, read from the environment:
# AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (see README.md)
provider "auth0" {}
