import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getAvailableBrands, ORGANIZATION_BRANDING, getOrgId } from "../config/organizationBranding";
import { demoConfig } from "../config/demo";

interface OrganizationPickerProps {
  /** Show as full-page picker vs inline component */
  fullPage?: boolean;
  /** Callback after organization is selected */
  onSelect?: (orgName: string) => void;
  /** Show country selector for each brand */
  showCountries?: boolean;
}

const OrganizationPicker: React.FC<OrganizationPickerProps> = ({
  fullPage = false,
  onSelect,
  showCountries = true,
}) => {
  const { loginWithRedirect } = useAuth0();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);

  const brands = getAvailableBrands();

  const handleBrandSelect = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;

    if (showCountries && brand.countries.length > 1) {
      // Show country selector
      setSelectedBrand(brandId);
    } else {
      // Direct login to first/only country using org ID
      const country = brand.countries[0];
      handleOrgLogin(country?.orgName || brandId, country?.orgId);
    }
  };

  const handleOrgLogin = (orgName: string, orgId?: string) => {
    onSelect?.(orgName);
    // Use org ID for Auth0 login (required by Auth0)
    const organizationId = orgId || getOrgId(orgName);
    loginWithRedirect({
      authorizationParams: {
        organization: organizationId,
        redirect_uri: window.location.origin + "/token",
        scope: "openid profile email",
      },
    });
  };

  const containerStyle: React.CSSProperties = fullPage
    ? {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--bg-primary)",
      }
    : {
        padding: "1.5rem",
      };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "2rem",
  };

  const brandsGridStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    justifyContent: "center",
    maxWidth: "900px",
  };

  const brandCardStyle = (brandId: string, primaryColor: string): React.CSSProperties => ({
    background: "var(--bg-secondary)",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "260px",
    cursor: "pointer",
    border: `2px solid ${
      selectedBrand === brandId || hoveredBrand === brandId
        ? primaryColor
        : "transparent"
    }`,
    transition: "all 0.2s ease",
    textAlign: "center",
  });

  const logoStyle: React.CSSProperties = {
    height: "50px",
    maxWidth: "180px",
    objectFit: "contain",
    marginBottom: "1rem",
  };

  const brandNameStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
  };

  const countryBadgeStyle = (primaryColor: string): React.CSSProperties => ({
    display: "inline-block",
    background: primaryColor + "20",
    color: primaryColor,
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
  });

  const countrySelectorStyle: React.CSSProperties = {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "var(--bg-secondary)",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "100%",
  };

  const countryGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  };

  const countryButtonStyle = (primaryColor: string): React.CSSProperties => ({
    background: "var(--bg-primary)",
    border: `1px solid ${primaryColor}40`,
    borderRadius: "8px",
    padding: "0.75rem",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "all 0.2s ease",
  });

  const backButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--text-muted)",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "0.85rem",
    marginTop: "1rem",
  };

  const selectedBrandData = brands.find((b) => b.id === selectedBrand);

  return (
    <div style={containerStyle}>
      {fullPage && (
        <div style={headerStyle}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Welcome to the {demoConfig.customer.name} portal
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Select your organization to continue
          </p>
        </div>
      )}

      {!selectedBrand ? (
        <div style={brandsGridStyle}>
          {brands.map((brand) => (
            <div
              key={brand.id}
              style={brandCardStyle(brand.id, brand.primaryColor)}
              onClick={() => handleBrandSelect(brand.id)}
              onMouseEnter={() => setHoveredBrand(brand.id)}
              onMouseLeave={() => setHoveredBrand(null)}
            >
              <img
                src={brand.logoUrl}
                alt={brand.name}
                style={logoStyle}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div style={brandNameStyle}>{brand.name}</div>
              {brand.countries.length > 1 && (
                <div style={countryBadgeStyle(brand.primaryColor)}>
                  {brand.countries.length} countries
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={countrySelectorStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src={selectedBrandData?.logoUrl}
              alt={selectedBrandData?.name}
              style={{ height: "40px", objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                {selectedBrandData?.name}
              </h2>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Select your country
              </p>
            </div>
          </div>

          <div style={countryGridStyle}>
            {selectedBrandData?.countries.map((country) => (
              <button
                key={country.code}
                style={countryButtonStyle(selectedBrandData.primaryColor)}
                onClick={() => handleOrgLogin(country.orgName, country.orgId)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = selectedBrandData.primaryColor + "20";
                  e.currentTarget.style.borderColor = selectedBrandData.primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-primary)";
                  e.currentTarget.style.borderColor = selectedBrandData.primaryColor + "40";
                }}
              >
                {country.name}
              </button>
            ))}
          </div>

          <button style={backButtonStyle} onClick={() => setSelectedBrand(null)}>
            ← Back to brands
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Compact organization badge showing current org
 */
export const OrganizationBadge: React.FC<{
  orgName: string;
  displayName?: string;
  logoUrl?: string;
  primaryColor?: string;
  onSwitch?: () => void;
}> = ({ orgName, displayName, logoUrl, primaryColor = "#63b3ed", onSwitch }) => {
  const branding = ORGANIZATION_BRANDING[orgName];
  const name = displayName || branding?.displayName || orgName;
  const logo = logoUrl || branding?.logoUrl;
  const color = primaryColor || branding?.theme.primaryColor || "#63b3ed";

  const badgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: color + "15",
    borderRadius: "8px",
    border: `1px solid ${color}30`,
  };

  const logoImgStyle: React.CSSProperties = {
    height: "24px",
    width: "auto",
    objectFit: "contain",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "var(--text-primary)",
  };

  const switchBtnStyle: React.CSSProperties = {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: color,
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: "0.25rem",
  };

  return (
    <div style={badgeStyle}>
      {logo && (
        <img
          src={logo}
          alt={name}
          style={logoImgStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span style={nameStyle}>{name}</span>
      {onSwitch && (
        <button style={switchBtnStyle} onClick={onSwitch} title="Switch organization">
          ⇄
        </button>
      )}
    </div>
  );
};

export default OrganizationPicker;
