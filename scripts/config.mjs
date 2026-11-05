// Writes the demo configuration from Terraform's outputs (terraform/, current
// workspace = current customer):
// - src/config/demo.json: the portal's configuration (no secret but the test
//   accounts' password, shown on the portal)
// - web-app/.env: the web application's settings, with its client secret
// Both files are git-ignored.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PORTAL_CONFIG = "src/config/demo.json";
const WEB_APP_ENV = "web-app/.env";

const outputs = JSON.parse(
  execFileSync("terraform", ["-chdir=terraform", "output", "-json"], { encoding: "utf8" })
);
const config = outputs.demo_config.value;

writeFileSync(PORTAL_CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log(`${PORTAL_CONFIG}: ${config.customer.name}`);

const webAppUrl = config.webAppUrls[0];
if (!webAppUrl) {
  console.log(`${WEB_APP_ENV}: skipped (no web_app_urls)`);
} else {
  // Kept across runs: a new configuration does not end the open sessions
  const previousSecret = existsSync(WEB_APP_ENV)
    ? readFileSync(WEB_APP_ENV, "utf8").match(/^SESSION_SECRET=(.+)$/m)?.[1]
    : undefined;
  const env = {
    PORT: new URL(webAppUrl).port || "3000",
    BASE_URL: webAppUrl,
    ISSUER_BASE_URL: `https://${config.auth0.domain}`,
    CLIENT_ID: outputs.web_app.value.client_id,
    CLIENT_SECRET: outputs.web_app_client_secret.value,
    SESSION_SECRET: previousSecret ?? randomBytes(32).toString("hex"),
    CUSTOMER_NAME: config.customer.name,
    PRIMARY_COLOR: config.customer.primaryColor,
    CLAIMS_NAMESPACE: config.claimsNamespace,
    PORTAL_URL: config.portalUrls?.[0] ?? "",
  };
  writeFileSync(
    WEB_APP_ENV,
    Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n") + "\n",
    { mode: 0o600 }
  );
  console.log(`${WEB_APP_ENV}: ${webAppUrl}`);
}
