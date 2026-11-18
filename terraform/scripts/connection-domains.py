"""Sets the email domains of a connection for domain detection (run by Terraform).

Home realm discovery: with identifier-first login, an email of one of these
domains is sent straight to the connection (e.g. @lyvoc.com to the Admin UI's
Okta). Only `options.domain_aliases` changes: the connection's other options
(its client secret included) are read and sent back as they are, never stored
in Terraform. Nothing is written when the domains are already set.

Environment: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (Terraform's
credentials), CONNECTION (connection name), DOMAINS (JSON list of domains).
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request

domain = os.environ["AUTH0_DOMAIN"]
connection_name = os.environ["CONNECTION"]
domains = json.loads(os.environ["DOMAINS"])


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
if sorted(options.get("domain_aliases") or []) == sorted(domains):
    print(f'{connection_name}: domains already set ({", ".join(domains) or "none"})')
    raise SystemExit(0)

options["domain_aliases"] = domains
request("PATCH", f"/api/v2/connections/{connection['id']}", {"options": options}, token=token)
print(f'{connection_name}: domains set ({", ".join(domains) or "none"})')
