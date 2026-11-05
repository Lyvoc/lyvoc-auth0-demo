"""Links (or unlinks) a passwordless identity of a test account (run by Terraform).

One account, two ways to log in: the passwordless "email" identity is linked
to the account of the users database, which keeps its roles and
organizations. A passwordless login then opens that same account.

  link-passwordless.py link    idempotent: an account already linked is left
                               as it is, an unlinked passwordless user with the
                               same email is linked instead of a new one
  link-passwordless.py unlink  unlinks the passwordless identity and deletes it
                               (the code login stops); nothing to do when the
                               account or the identity is already gone

Environment: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (Terraform's
credentials), PRIMARY_USER_ID, EMAIL, CONNECTION (passwordless connection).
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

mode = sys.argv[1] if len(sys.argv) > 1 else "link"
domain = os.environ["AUTH0_DOMAIN"]
primary_id = os.environ["PRIMARY_USER_ID"]
email = os.environ["EMAIL"]
connection = os.environ["CONNECTION"]

if not primary_id:
    # Nothing recorded (resource created before the unlink support)
    raise SystemExit(0)


def request(method, path, body=None, token=None, allow_404=False):
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
        if allow_404 and error.code == 404:
            return None
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

primary_path = f"/api/v2/users/{urllib.parse.quote(primary_id, safe='')}"
primary = request("GET", primary_path, token=token, allow_404=mode == "unlink")

if mode == "unlink":
    linked = next(
        (i for i in (primary or {}).get("identities", [])[1:] if i["connection"] == connection),
        None,
    )
    if linked is None:
        print(f"{email}: no passwordless identity linked")
        raise SystemExit(0)
    request("DELETE", f"{primary_path}/identities/{linked['provider']}/{linked['user_id']}", token=token)
    request(
        "DELETE",
        f"/api/v2/users/{urllib.parse.quote(linked['provider'] + '|' + linked['user_id'], safe='')}",
        token=token,
        allow_404=True,
    )
    print(f"{email}: passwordless identity unlinked and deleted")
    raise SystemExit(0)

if any(identity["connection"] == connection for identity in primary["identities"]):
    print(f"{email}: passwordless identity already linked")
    raise SystemExit(0)

users = request("GET", f"/api/v2/users-by-email?email={urllib.parse.quote(email)}", token=token)
secondary = next(
    (u for u in users if u["user_id"] != primary_id and u["identities"][0]["connection"] == connection),
    None,
)
if secondary is None:
    secondary = request(
        "POST",
        "/api/v2/users",
        {"connection": connection, "email": email, "email_verified": True},
        token=token,
    )

identity = secondary["identities"][0]
request(
    "POST",
    f"/api/v2/users/{urllib.parse.quote(primary_id, safe='')}/identities",
    {"provider": identity["provider"], "user_id": identity["user_id"]},
    token=token,
)
print(f"{email}: passwordless identity linked")
