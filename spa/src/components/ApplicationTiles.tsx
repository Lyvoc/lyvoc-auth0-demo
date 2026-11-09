import React from "react";
import {
  APPLICATIONS,
  ApplicationAccess,
  getAccessibleApplications,
  OrganizationBranding,
} from "../config/organizationBranding";

interface ApplicationTilesProps {
  /** User's roles in current organization */
  roles: string[];
  /** Current organization branding (for theming) */
  branding?: OrganizationBranding | null;
  /** Show all apps (locked ones grayed out) vs only accessible */
  showAllApps?: boolean;
  /** Click handler for app tiles */
  onAppClick?: (app: ApplicationAccess) => void;
  /** Compact mode for sidebar */
  compact?: boolean;
}

const ApplicationTiles: React.FC<ApplicationTilesProps> = ({
  roles,
  branding,
  showAllApps = true,
  onAppClick,
  compact = false,
}) => {
  const accessibleApps = getAccessibleApplications(roles);
  const accessibleIds = new Set(accessibleApps.map((a) => a.id));
  const allApps = Object.values(APPLICATIONS);
  
  const primaryColor = branding?.theme.primaryColor || "var(--primary-color)";

  const appsToShow = showAllApps ? allApps : accessibleApps;

  const containerStyle: React.CSSProperties = compact
    ? {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem",
      };

  const tileStyle = (isAccessible: boolean): React.CSSProperties =>
    compact
      ? {
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.6rem 0.75rem",
          background: isAccessible ? "var(--bg-secondary)" : "var(--bg-primary)",
          borderRadius: "8px",
          cursor: isAccessible ? "pointer" : "not-allowed",
          opacity: isAccessible ? 1 : 0.5,
          border: `1px solid ${isAccessible ? primaryColor + "30" : "transparent"}`,
          transition: "all 0.2s ease",
        }
      : {
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          padding: "1.25rem",
          cursor: isAccessible ? "pointer" : "not-allowed",
          opacity: isAccessible ? 1 : 0.5,
          border: `2px solid ${isAccessible ? primaryColor + "40" : "transparent"}`,
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        };

  const iconStyle = (isAccessible: boolean): React.CSSProperties => ({
    fontSize: compact ? "1.25rem" : "2rem",
    marginBottom: compact ? 0 : "0.75rem",
    filter: isAccessible ? "none" : "grayscale(100%)",
  });

  const nameStyle: React.CSSProperties = compact
    ? {
        fontSize: "0.85rem",
        fontWeight: 500,
        color: "var(--text-primary)",
      }
    : {
        fontSize: "1.1rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "0.5rem",
      };

  const lockedBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: "var(--bg-primary)",
    color: "var(--text-muted)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 500,
  };

  const accessBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: primaryColor + "20",
    color: primaryColor,
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 500,
  };

  const handleTileClick = (app: ApplicationAccess, isAccessible: boolean) => {
    if (isAccessible && onAppClick) {
      onAppClick(app);
    }
  };

  const handleTileHover = (e: React.MouseEvent, isAccessible: boolean, entering: boolean) => {
    if (!isAccessible) return;
    const target = e.currentTarget as HTMLElement;
    target.style.transform = entering ? "translateY(-2px)" : "translateY(0)";
    target.style.borderColor = entering ? primaryColor : primaryColor + "40";
  };

  if (appsToShow.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
        No applications available for your role.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {appsToShow.map((app) => {
        const isAccessible = accessibleIds.has(app.id);
        return (
          <div
            key={app.id}
            style={tileStyle(isAccessible)}
            onClick={() => handleTileClick(app, isAccessible)}
            onMouseEnter={(e) => handleTileHover(e, isAccessible, true)}
            onMouseLeave={(e) => handleTileHover(e, isAccessible, false)}
            title={isAccessible ? `Open ${app.name}` : `No access to ${app.name}`}
          >
            {compact ? (
              <>
                <span style={iconStyle(isAccessible)}>{app.icon}</span>
                <span style={nameStyle}>{app.name}</span>
                {!isAccessible && (
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    🔒
                  </span>
                )}
              </>
            ) : (
              <>
                <div style={iconStyle(isAccessible)}>{app.icon}</div>
                <div style={nameStyle}>{app.name}</div>
                {showAllApps && !isAccessible && <div style={lockedBadgeStyle}>🔒 Locked</div>}
                {isAccessible && <div style={accessBadgeStyle}>✓ Access</div>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Role-based application access summary
 */
export const RoleAccessSummary: React.FC<{
  roles: string[];
  primaryColor?: string;
}> = ({ roles, primaryColor = "var(--primary-color)" }) => {
  const accessibleApps = getAccessibleApplications(roles);

  const containerStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    borderRadius: "8px",
    padding: "1rem",
  };

  const headerStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.75rem",
  };

  const roleTagStyle: React.CSSProperties = {
    display: "inline-block",
    background: primaryColor + "20",
    color: primaryColor,
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
    marginRight: "0.5rem",
    marginBottom: "0.5rem",
  };

  const appListStyle: React.CSSProperties = {
    marginTop: "0.75rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid var(--bg-primary)",
  };

  const appItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    marginBottom: "0.25rem",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Your Roles</div>
      <div>
        {roles.length > 0 ? (
          roles.map((role) => (
            <span key={role} style={roleTagStyle}>
              {role}
            </span>
          ))
        ) : (
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No roles assigned</span>
        )}
      </div>

      <div style={appListStyle}>
        <div style={{ ...headerStyle, marginBottom: "0.5rem" }}>
          Application Access ({accessibleApps.length}/{Object.keys(APPLICATIONS).length})
        </div>
        {accessibleApps.map((app) => (
          <div key={app.id} style={appItemStyle}>
            <span>{app.icon}</span>
            <span>{app.name}</span>
          </div>
        ))}
        {accessibleApps.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No applications accessible with current roles
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationTiles;
