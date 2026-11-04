import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { OrganizationBranding, getOrganizationBranding } from "../config/organizationBranding";
import { demoConfig } from "../config/demo";

// Default theme values: the customer of the demo configuration, then :root in index.css
const DEFAULT_THEME = {
  customerName: demoConfig.customer.name,
  logoUrl: demoConfig.customer.logoUrl,
  primaryColor: demoConfig.customer.primaryColor,
  secondaryColor: demoConfig.customer.secondaryColor,
  bgPrimary: "#1a1e27",
  bgSecondary: "#262a33",
  bgSidebar: "#23263a",
  textPrimary: "#f7fafc",
  textSecondary: "#e2e8f0",
  textMuted: "#a0aec0",
};

export type ThemeConfig = typeof DEFAULT_THEME;

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  isCustomized: boolean;
  // Organization theming
  currentOrgBranding: OrganizationBranding | null;
  applyOrganizationTheme: (orgIdentifier: string) => void;
  clearOrganizationTheme: () => void;
}

const STORAGE_KEY = "auth0-cic-demo-theme";

// Get env var values as fallback
const getEnvTheme = (): Partial<ThemeConfig> => ({
  customerName: import.meta.env.VITE_CUSTOMER_NAME || "",
  logoUrl: import.meta.env.VITE_LOGO_URL || "",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "",
  secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || "",
  bgPrimary: import.meta.env.VITE_BG_PRIMARY || "",
  bgSecondary: import.meta.env.VITE_BG_SECONDARY || "",
  bgSidebar: import.meta.env.VITE_BG_SIDEBAR || "",
  textPrimary: import.meta.env.VITE_TEXT_PRIMARY || "",
  textSecondary: import.meta.env.VITE_TEXT_SECONDARY || "",
  textMuted: import.meta.env.VITE_TEXT_MUTED || "",
});

// Merge themes: localStorage > env vars > defaults
const loadTheme = (): ThemeConfig => {
  const envTheme = getEnvTheme();
  let storedTheme: Partial<ThemeConfig> = {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      storedTheme = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load theme from localStorage:", e);
  }

  // Merge: stored values > env values > defaults (only if value is non-empty)
  const merged: ThemeConfig = { ...DEFAULT_THEME };
  for (const key of Object.keys(DEFAULT_THEME) as (keyof ThemeConfig)[]) {
    if (storedTheme[key] && storedTheme[key] !== "") {
      merged[key] = storedTheme[key]!;
    } else if (envTheme[key] && envTheme[key] !== "") {
      merged[key] = envTheme[key]!;
    }
  }
  
  return merged;
};

// Apply theme to CSS custom properties
const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;
  root.style.setProperty("--primary-color", theme.primaryColor);
  root.style.setProperty("--secondary-color", theme.secondaryColor);
  root.style.setProperty("--bg-primary", theme.bgPrimary);
  root.style.setProperty("--bg-secondary", theme.bgSecondary);
  root.style.setProperty("--bg-sidebar", theme.bgSidebar);
  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty("--text-muted", theme.textMuted);
  
  // Update document title (fallback to the configured customer)
  const customerName = theme.customerName && theme.customerName.trim() ? theme.customerName : demoConfig.customer.name;
  document.title = `${customerName} CIC Demo`;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ORG_THEME_STORAGE_KEY = "auth0-cic-demo-org-theme";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(loadTheme);
  const [isCustomized, setIsCustomized] = useState(false);
  const [currentOrgBranding, setCurrentOrgBranding] = useState<OrganizationBranding | null>(null);

  // Check if theme has been customized (stored in localStorage)
  useEffect(() => {
    setIsCustomized(localStorage.getItem(STORAGE_KEY) !== null);
    
    // Check for stored org theme on mount
    const storedOrgId = localStorage.getItem(ORG_THEME_STORAGE_KEY);
    if (storedOrgId) {
      const branding = getOrganizationBranding(storedOrgId);
      if (branding) {
        setCurrentOrgBranding(branding);
      }
    }
  }, []);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
    setIsCustomized(true);
  };

  const resetTheme = () => {
    localStorage.removeItem(STORAGE_KEY);
    const envTheme = getEnvTheme();
    const merged: ThemeConfig = { ...DEFAULT_THEME };
    for (const key of Object.keys(DEFAULT_THEME) as (keyof ThemeConfig)[]) {
      if (envTheme[key]) {
        merged[key] = envTheme[key]!;
      }
    }
    setTheme(merged);
    setIsCustomized(false);
  };

  /**
   * Apply organization-specific theming
   */
  const applyOrganizationTheme = useCallback((orgIdentifier: string) => {
    const branding = getOrganizationBranding(orgIdentifier);
    if (!branding) {
      console.warn(`No branding found for organization: ${orgIdentifier}`);
      return;
    }

    setCurrentOrgBranding(branding);
    localStorage.setItem(ORG_THEME_STORAGE_KEY, orgIdentifier);

    // Apply organization theme
    const orgTheme: Partial<ThemeConfig> = {
      customerName: branding.displayName,
      logoUrl: branding.logoUrl,
      ...branding.theme,
    };

    setTheme((prev) => ({ ...prev, ...orgTheme }));
  }, []);

  /**
   * Clear organization theme and revert to default/custom theme
   */
  const clearOrganizationTheme = useCallback(() => {
    setCurrentOrgBranding(null);
    localStorage.removeItem(ORG_THEME_STORAGE_KEY);
    
    // Reload base theme
    setTheme(loadTheme());
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      updateTheme, 
      resetTheme, 
      isCustomized,
      currentOrgBranding,
      applyOrganizationTheme,
      clearOrganizationTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export { DEFAULT_THEME };
