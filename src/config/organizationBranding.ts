/**
 * Organization Branding Configuration
 *
 * Built from the demo configuration (src/config/demo.ts): one Auth0
 * organization = one brand, with its logo and colors, and the customer
 * portal applications a user can open depending on their organization roles.
 */
import { demoConfig, findOrganization, DemoOrganization } from "./demo";

export interface OrganizationBranding {
  brandId: string;
  brandName: string;
  displayName: string;
  country: string;
  language: string;
  logoUrl: string;
  supportUrl: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    bgPrimary: string;
    bgSecondary: string;
    bgSidebar: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  applications: ApplicationAccess[];
}

export interface ApplicationAccess {
  id: string;
  name: string;
  description: string;
  icon: string;
  url?: string;
}

// Customer portal applications
export const APPLICATIONS: Record<string, ApplicationAccess> = Object.fromEntries(
  demoConfig.applications.map(({ id, name, description, icon }) => [id, { id, name, description, icon }])
);

// Role to application access mapping
export const ROLE_APP_ACCESS: Record<string, string[]> = Object.fromEntries(
  demoConfig.roles.map((role) => [
    role.name,
    demoConfig.applications.filter((app) => app.roles.includes(role.name)).map((app) => app.id),
  ])
);

const BG_PRIMARY = "#1a1e27";

/** Mix a #rrggbb color with another one (weight of the first color: 0 to 1) */
function mixColors(color: string, other: string, weight: number): string {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [channels(color), channels(other)];
  if ([...a, ...b].some(Number.isNaN)) return other;
  return (
    "#" +
    a.map((value, i) => Math.round(value * weight + b[i] * (1 - weight)).toString(16).padStart(2, "0")).join("")
  );
}

function createOrgBranding(org: DemoOrganization): OrganizationBranding {
  return {
    brandId: org.name,
    brandName: org.displayName,
    displayName: org.displayName,
    country: "",
    language: "",
    logoUrl: org.logoUrl,
    supportUrl: "",
    theme: {
      primaryColor: org.primaryColor,
      secondaryColor: demoConfig.customer.secondaryColor,
      bgPrimary: BG_PRIMARY,
      bgSecondary: "#262a33",
      // Dark sidebar tinted with the organization color
      bgSidebar: mixColors(org.primaryColor, BG_PRIMARY, 0.2),
      textPrimary: "#f7fafc",
      textSecondary: "#e2e8f0",
      textMuted: "#a0aec0",
    },
    applications: Object.values(APPLICATIONS),
  };
}

/**
 * Auth0 Organization ID mappings (org name => org_id)
 */
export const ORG_IDS: Record<string, string> = Object.fromEntries(
  demoConfig.organizations.map((org) => [org.name, org.id])
);

/**
 * Get the Auth0 org_id for a given org name
 */
export function getOrgId(orgName: string): string {
  return ORG_IDS[orgName] || orgName;
}

/**
 * Organization branding lookup, by org_id or org name
 */
export const ORGANIZATION_BRANDING: Record<string, OrganizationBranding> = Object.fromEntries(
  demoConfig.organizations.flatMap((org) => {
    const branding = createOrgBranding(org);
    return [
      [org.name, branding],
      [org.id, branding],
    ];
  })
);

/**
 * Get branding for an organization by ID or name
 */
export function getOrganizationBranding(orgIdentifier: string): OrganizationBranding | null {
  const org = findOrganization(orgIdentifier);
  return org ? ORGANIZATION_BRANDING[org.name] : null;
}

/**
 * Brands for the organization picker (one organization each)
 */
export function getAvailableBrands() {
  return demoConfig.organizations.map((org) => ({
    id: org.name,
    name: org.displayName,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    countries: [{ code: org.name, name: org.displayName, orgName: org.name, orgId: org.id }],
  }));
}

/**
 * Get applications a user can access based on their roles
 */
export function getAccessibleApplications(roles: string[]): ApplicationAccess[] {
  const accessibleAppIds = new Set<string>();

  for (const role of roles) {
    const apps = ROLE_APP_ACCESS[role.toLowerCase()] || [];
    apps.forEach((appId) => accessibleAppIds.add(appId));
  }

  return Array.from(accessibleAppIds).map((appId) => APPLICATIONS[appId]).filter(Boolean);
}
