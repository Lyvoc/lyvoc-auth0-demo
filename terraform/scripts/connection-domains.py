"""Sets the email domains of a connection for domain detection (run by Terraform).

Home realm discovery: with identifier-first login, an email of one of these
domains is sent straight to the connection (e.g. @lyvoc.com to the Admin UI's
Okta). With FORWARD_LOGIN_HINT, the `login_hint` of the login request (e.g.
the invitee's email, added by the Admin UI) is forwarded to the identity
provider, which pre-fills it (upstream_params).

Only `options.domain_aliases` and `options.upstream_params.login_hint`
change: the connection's other options (its client secret included) are read
and sent back as they are, never stored in Terraform. Nothing is written
when they are already set.

Environment: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (Terraform's
credentials), CONNECTION (connection name), DOMAINS (JSON list of domains),
FORWARD_LOGIN_HINT ("true" / "false").
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request

domain = os.environ["AUTH0_DOMAIN"]
connection_name = os.environ["CONNECTION"]
domains = json.loads(os.environ["DOMAINS"])
forward_login_hint = os.environ.get("FORWARD_LOGIN_HINT", "false") == "true"


def request(method, path, body=None, token=None):
    req = urllib.request.Request(
        f"https://{domain}{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "content-type": "application/json",
            **({"authorization": f"Bearer {token}"} if token else {}),
        },
    )
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
            return json.loads(content) if content else None
    except urllib.error.HTTPError as error:
        raise SystemExit(f"{method} {path.split('?')[0]}: {error.code} {error.read()[:300].decode()}")


token = request(
    "POST",
    "/oauth/token",
    {
        "grant_type": "client_credentials",
        "client_id": os.environ["AUTH0_CLIENT_ID"],
        "client_secret": os.environ["AUTH0_CLIENT_SECRET"],
        "audience": f"https://{domain}/api/v2/",
    },
)["access_token"]

matches = request(
    "GET",
    f"/api/v2/connections?name={urllib.parse.quote(connection_name)}",
    token=token,
)
connection = next((c for c in matches or [] if c["name"] == connection_name), None)
if connection is None:
    raise SystemExit(f'Connection "{connection_name}" not found (create it first, e.g. Admin UI > Admin team > SSO).')

options = connection.get("options") or {}
upstream = dict(options.get("upstream_params") or {})
if forward_login_hint:
    upstream["login_hint"] = {"alias": "login_hint"}
else:
    upstream.pop("login_hint", None)

summary = f'domains {", ".join(domains) or "none"}, login_hint {"forwarded" if forward_login_hint else "not forwarded"}'
if sorted(options.get("domain_aliases") or []) == sorted(domains) and upstream == (
    options.get("upstream_params") or {}
):
    print(f"{connection_name}: already set ({summary})")
    raise SystemExit(0)

options["domain_aliases"] = domains
if upstream:
    options["upstream_params"] = upstream
else:
    options.pop("upstream_params", None)
request("PATCH", f"/api/v2/connections/{connection['id']}", {"options": options}, token=token)
print(f"{connection_name}: set ({summary})")
