import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  OrganizationBranding,
  getOrganizationBranding,
  getAccessibleApplications,
  ApplicationAccess,
  getOrgId,
} from "../config/organizationBranding";
import { claimName } from "../config/demo";

/**
 * Organization claims from Auth0 ID token
 */
interface OrganizationClaims {
  org_id?: string;
  org_name?: string;
  permissions?: string[];
}

/**
 * User's organization membership info
 */
export interface UserOrganization {
  orgId: string;
  orgName: string;
  displayName: string;
  roles: string[];
  branding: OrganizationBranding | null;
}

interface OrganizationContextType {
  // Current organization context (from token)
  currentOrg: UserOrganization | null;
  
  // Whether user belongs to multiple organizations
  isMultiOrg: boolean;
  
  // All organizations user belongs to (if available)
  userOrganizations: UserOrganization[];
  
  // Applications accessible to current user in current org
  accessibleApps: ApplicationAccess[];
  
  // User's roles in current organization
  orgRoles: string[];
  
  // Loading state
  isLoading: boolean;
  
  // Login to a specific organization
  loginToOrganization: (orgName: string) => void;
  
  // Switch organization (re-authenticate with different org)
  switchOrganization: (orgName: string) => void;
  
  // Refresh organization context from token
  refreshOrgContext: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ORG_STORAGE_KEY = "auth0-cic-demo-last-org";

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    getIdTokenClaims, 
    loginWithRedirect,
    user 
  } = useAuth0();

  const [currentOrg, setCurrentOrg] = useState<UserOrganization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Extract organization info from ID token claims
   */
  const extractOrgFromToken = useCallback(async (): Promise<UserOrganization | null> => {
    try {
      const claims = await getIdTokenClaims();
      if (!claims) return null;

      const orgClaims = claims as unknown as OrganizationClaims;
      
      // Check for organization claims
      const orgId = orgClaims.org_id;
      const orgName = orgClaims.org_name;

      if (!orgId && !orgName) {
        return null;
      }

      // Get branding configuration
      const branding = getOrganizationBranding(orgName || orgId || "");

      // Extract roles from various possible claim locations
      const roles = extractRolesFromClaims(claims);

      return {
        orgId: orgId || "",
        orgName: orgName || "",
        displayName: branding?.displayName || orgName || orgId || "Unknown Organization",
        roles,
        branding,
      };
    } catch (error) {
      console.error("Failed to extract organization from token:", error);
      return null;
    }
  }, [getIdTokenClaims]);

  /**
   * Extract roles from various claim locations
   */
  const extractRolesFromClaims = (claims: Record<string, unknown>): string[] => {
    const roles: string[] = [];

    // Standard permissions claim
    if (Array.isArray(claims.permissions)) {
      roles.push(...claims.permissions);
    }

    // Organization roles (custom namespace, set by the "Demo claims" Action)
    const orgRolesClaim = claims[claimName("org_roles")] ||
                          claims["org_roles"] ||
                          claims["roles"];
    if (Array.isArray(orgRolesClaim)) {
      roles.push(...orgRolesClaim);
    }

    // App metadata roles
    const appMetadata = claims[claimName("app_metadata")] || claims["app_metadata"];
    if (appMetadata && typeof appMetadata === "object" && "roles" in appMetadata) {
      const metaRoles = (appMetadata as { roles?: string[] }).roles;
      if (Array.isArray(metaRoles)) {
        roles.push(...metaRoles);
      }
    }

    // Deduplicate
    return [...new Set(roles)];
  };

  /**
   * Refresh organization context from token
   */
  const refreshOrgContext = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentOrg(null);
      setUserOrganizations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const org = await extractOrgFromToken();
      setCurrentOrg(org);

      // Store last org for returning users
      if (org?.orgName) {
        localStorage.setItem(ORG_STORAGE_KEY, org.orgName);
      }

      // If user object has org memberships, populate them
      if (user && (user as Record<string, unknown>)[claimName("organizations")]) {
        const orgs = (user as Record<string, unknown>)[claimName("organizations")] as string[];
        const orgList: UserOrganization[] = orgs.map((orgName) => {
          const branding = getOrganizationBranding(orgName);
          return {
            orgId: "",
            orgName,
            displayName: branding?.displayName || orgName,
            roles: [],
            branding,
          };
        });
        setUserOrganizations(orgList);
      } else if (org) {
        // At minimum, current org is in the list
        setUserOrganizations([org]);
      }
    } catch (error) {
      console.error("Failed to refresh org context:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, extractOrgFromToken, user]);

  /**
   * Login to a specific organization
   */
  const loginToOrganization = useCallback((orgName: string) => {
    // Convert org name to org ID (Auth0 requires org_id)
    const orgId = getOrgId(orgName);
    loginWithRedirect({
      authorizationParams: {
        organization: orgId,
        redirect_uri: window.location.origin + "/token",
        scope: "openid profile email",
      },
    });
  }, [loginWithRedirect]);

  /**
   * Switch to a different organization (re-authenticate)
   */
  const switchOrganization = useCallback((orgName: string) => {
    // Convert org name to org ID (Auth0 requires org_id)
    const orgId = getOrgId(orgName);
    // Clear current session and re-authenticate with new org
    loginWithRedirect({
      authorizationParams: {
        organization: orgId,
        redirect_uri: window.location.origin + "/token",
        scope: "openid profile email",
        prompt: "login", // Force re-authentication
      },
    });
  }, [loginWithRedirect]);

  // Load org context when auth state changes
  useEffect(() => {
    if (!authLoading) {
      refreshOrgContext();
    }
  }, [authLoading, isAuthenticated, refreshOrgContext]);

  // Compute derived values
  const isMultiOrg = userOrganizations.length > 1;
  const orgRoles = currentOrg?.roles || [];
  const accessibleApps = getAccessibleApplications(orgRoles);

  const value: OrganizationContextType = {
    currentOrg,
    isMultiOrg,
    userOrganizations,
    accessibleApps,
    orgRoles,
    isLoading: isLoading || authLoading,
    loginToOrganization,
    switchOrganization,
    refreshOrgContext,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * Hook to access organization context
 */
export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};

/**
 * Hook to get current organization's branding
 */
export const useOrgBranding = (): OrganizationBranding | null => {
  const { currentOrg } = useOrganization();
  return currentOrg?.branding || null;
};

/**
 * Hook to check if user has specific role in current org
 */
export const useHasOrgRole = (role: string): boolean => {
  const { orgRoles } = useOrganization();
  return orgRoles.some((r) => r.toLowerCase() === role.toLowerCase());
};

/**
 * Hook to get last organization user was logged into
 */
export const getLastOrganization = (): string | null => {
  return localStorage.getItem(ORG_STORAGE_KEY);
};
