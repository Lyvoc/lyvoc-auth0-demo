/**
 * Demo configuration, generated from the Terraform outputs of the customer
 * (npm run config: terraform output -json demo_config > src/config/demo.json).
 * Without demo.json, a neutral configuration is used and the Auth0 values come
 * from the VITE_AUTH0_* environment variables only.
 */

export interface DemoOrganization {
  id: string;
  name: string;
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  pageBackgroundColor: string;
}

export interface DemoApplication {
  id: string;
  name: string;
  description: string;
  icon: string;
  roles: string[];
}

export interface DemoTestUser {
  email: string;
  name: string;
  description: string;
  // Two separate permission lists: organizations (with the organization role)
  // and the application roles, held directly (application access)
  memberships: { organization: string; role: string }[];
  roles: string[];
  daeRole: string;
  // Real mailbox: the account also logs in with a code by email
  receivesEmails: boolean;
}

export interface DemoConfig {
  customer: {
    name: string;
    slug: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    pageBackgroundColor: string;
  };
  auth0: { domain: string; clientId: string; audience: string };
  claimsNamespace: string;
  connections: { database: string; passwordless: string | null };
  organizations: DemoOrganization[];
  roles: { name: string; description: string }[];
  applications: DemoApplication[];
  testUsers: DemoTestUser[];
  testUsersPassword: string;
  portalUrls?: string[];
  webAppUrls: string[];
  adminUiUrl: string;
  daeUrl: string;
  features: {
    passwordless: boolean;
    dae: boolean;
    mfa: "step-up" | "always" | "off";
    // Not configured by Terraform yet: pages hidden unless set
    tokenExchange?: boolean;
    logStreams?: boolean;
    forms?: boolean;
    saml?: boolean;
    oktaWorkforce?: boolean;
  };
}

const DEFAULT_CONFIG: DemoConfig = {
  customer: {
    name: "Lyvoc",
    slug: "demo",
    logoUrl: "",
    primaryColor: "#63b3ed",
    secondaryColor: "#ed8936",
    pageBackgroundColor: "#ffffff",
  },
  auth0: { domain: "", clientId: "", audience: "" },
  claimsNamespace: "",
  connections: { database: "", passwordless: null },
  organizations: [],
  roles: [],
  applications: [],
  testUsers: [],
  testUsersPassword: "",
  webAppUrls: [],
  adminUiUrl: "",
  daeUrl: "",
  features: { passwordless: false, dae: false, mfa: "off" },
};

// Optional file: an empty match when it has not been generated
const generated = Object.values(
  import.meta.glob<DemoConfig>("./demo.json", { eager: true, import: "default" })
)[0];

export const demoConfig: DemoConfig = generated ?? DEFAULT_CONFIG;

/** Organization by Auth0 ID or name */
export function findOrganization(identifier: string): DemoOrganization | undefined {
  return demoConfig.organizations.find((org) => org.id === identifier || org.name === identifier);
}

/** Custom claim name (namespace + name), as set by the "Demo claims" Action */
export function claimName(name: string): string {
  return `${demoConfig.claimsNamespace}${name}`;
}
