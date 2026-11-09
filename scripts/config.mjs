// Writes the demo configuration from Terraform's outputs (terraform/, current
// workspace = current customer):
// - spa/src/config/demo.json: the portal's configuration (no secret but the test
//   accounts' password, shown on the portal)
// - web-app/.env: the web application's settings, with its client secret
// - dae-hooks/generated/: the Delegated Administration extension hooks to
//   paste, with the Management API credentials of their M2M application
// All git-ignored.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const PORTAL_CONFIG = "spa/src/config/demo.json";
const WEB_APP_ENV = "web-app/.env";
const DAE_HOOKS = "dae-hooks";
const DAE_HOOKS_GENERATED = "dae-hooks/generated";

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
    ? readFileSync(WEB_APP_ENV, "utf8").match(/^SESSION_SECRET="?([0-9a-f]+)"?$/m)?.[1]
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
  // Quoted: dotenv reads an unquoted "#" (colors) as a comment
  writeFileSync(
    WEB_APP_ENV,
    Object.entries(env).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n") + "\n",
    { mode: 0o600 }
  );
  console.log(`${WEB_APP_ENV}: ${webAppUrl}`);
}

const dae = outputs.dae?.value;
if (!dae) {
  console.log(`${DAE_HOOKS_GENERATED}: skipped (enable_dae = false)`);
} else {
  const values = {
    __MANAGEMENT_DOMAIN__: dae.management_domain,
    __CLIENT_ID__: dae.management_client_id,
    __CLIENT_SECRET__: outputs.dae_management_client_secret.value,
    __USERS_CONNECTION__: dae.users_connection,
  };
  mkdirSync(DAE_HOOKS_GENERATED, { recursive: true, mode: 0o700 });
  const hooks = readdirSync(DAE_HOOKS).filter((name) => name.endsWith(".js"));
  for (const name of hooks) {
    // Without the header comment: the DAE evaluates the hook as an expression
    // ("return <hook>"), and a comment spanning lines after "return" ends it
    const source = readFileSync(`${DAE_HOOKS}/${name}`, "utf8").replace(/^\/\*[\s\S]*?\*\/\s*/, "");
    const hook = Object.entries(values).reduce((text, [key, value]) => text.replaceAll(key, value), source);
    writeFileSync(`${DAE_HOOKS_GENERATED}/${name}`, hook, { mode: 0o600 });
  }
  console.log(`${DAE_HOOKS_GENERATED}: ${hooks.length} hooks`);
}
