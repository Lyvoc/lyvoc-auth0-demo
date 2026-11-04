# Post-login Actions of the demo. Each one is bound on its own
# (auth0_trigger_action, singular): auth0_trigger_actions would replace the
# whole post-login flow, unbinding the other demos' and the Admin UI's Actions.
# The Actions only run for the demo applications (DEMO_CLIENT_IDS).

locals {
  demo_client_ids = join(",", [auth0_client.spa.id, auth0_client.web.id])
}

resource "auth0_action" "claims" {
  name    = "${var.customer.name} - Demo claims"
  runtime = "node22"
  deploy  = true
  code    = file("${path.module}/actions/demo-claims.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "DEMO_CLIENT_IDS"
    value = local.demo_client_ids
  }

  secrets {
    name  = "CLAIMS_NAMESPACE"
    value = local.claims_namespace
  }

  secrets {
    name  = "ROLE_PREFIX"
    value = local.role_prefix
  }
}

resource "auth0_trigger_action" "claims" {
  trigger      = "post-login"
  action_id    = auth0_action.claims.id
  display_name = auth0_action.claims.name
}

resource "auth0_action" "mfa" {
  count = var.mfa != "off" ? 1 : 0

  name    = "${var.customer.name} - Demo MFA"
  runtime = "node22"
  deploy  = true
  code    = file("${path.module}/actions/demo-mfa.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "DEMO_CLIENT_IDS"
    value = local.demo_client_ids
  }

  secrets {
    name  = "DATABASE_CONNECTION"
    value = auth0_connection.users.name
  }

  secrets {
    name  = "MFA_MODE"
    value = var.mfa
  }
}

resource "auth0_trigger_action" "mfa" {
  count = var.mfa != "off" ? 1 : 0

  trigger      = "post-login"
  action_id    = auth0_action.mfa[0].id
  display_name = auth0_action.mfa[0].name

  # Bindings of a trigger are locked while one is being changed: one at a time
  depends_on = [auth0_trigger_action.claims]
}
