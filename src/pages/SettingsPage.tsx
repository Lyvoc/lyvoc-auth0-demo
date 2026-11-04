import React, { useState, useEffect } from "react";
import { useTheme, DEFAULT_THEME } from "../context/ThemeContext";

const SettingsPage: React.FC = () => {
  const { theme, updateTheme, resetTheme, isCustomized } = useTheme();
  
  // Local state for form fields
  const [formValues, setFormValues] = useState(theme);
  const [saved, setSaved] = useState(false);

  // Sync form with theme when it changes externally
  useEffect(() => {
    setFormValues(theme);
  }, [theme]);

  const handleChange = (key: keyof typeof theme, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateTheme(formValues);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetTheme();
    setSaved(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem",
    borderRadius: 6,
    border: "1px solid var(--text-muted)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    marginBottom: 4,
    display: "block",
  };

  const colorInputStyle: React.CSSProperties = {
    width: 50,
    height: 36,
    padding: 2,
    border: "1px solid var(--text-muted)",
    borderRadius: 6,
    cursor: "pointer",
    background: "transparent",
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    borderRadius: 12,
    padding: "1.5rem",
    marginBottom: "1.5rem",
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <h2 style={{ color: "var(--primary-color)", marginBottom: 8 }}>Theme Settings</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Customize the appearance of this demo app for customer presentations.
        {isCustomized && (
          <span style={{ color: "var(--secondary-color)", marginLeft: 8 }}>
            (Custom theme active)
          </span>
        )}
      </p>

      {/* Branding Section */}
      <div style={sectionStyle}>
        <h3 style={{ color: "var(--text-primary)", marginTop: 0, marginBottom: 16 }}>
          Branding
        </h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Customer Name</label>
          <input
            type="text"
            value={formValues.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            placeholder="e.g., Acme Corp"
            style={inputStyle}
          />
          <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            Appears in browser tab and sidebar header
          </small>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Logo URL</label>
          <input
            type="text"
            value={formValues.logoUrl}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
            placeholder="https://example.com/logo.png"
            style={inputStyle}
          />
          <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            Public URL to customer logo (PNG, SVG, or WebP recommended)
          </small>
        </div>

        {formValues.logoUrl && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--bg-sidebar)", borderRadius: 8, textAlign: "center" }}>
            <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Logo Preview:</small>
            <img 
              src={formValues.logoUrl} 
              alt="Logo preview" 
              style={{ maxWidth: 140, maxHeight: 60, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      {/* Colors Section */}
      <div style={sectionStyle}>
        <h3 style={{ color: "var(--text-primary)", marginTop: 0, marginBottom: 16 }}>
          Colors
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {/* Primary Color */}
          <div>
            <label style={labelStyle}>Primary Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Links, active states</small>
          </div>

          {/* Secondary Color */}
          <div>
            <label style={labelStyle}>Secondary Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Accents, highlights</small>
          </div>

          {/* Background Primary */}
          <div>
            <label style={labelStyle}>Background (Primary)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.bgPrimary}
                onChange={(e) => handleChange("bgPrimary", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.bgPrimary}
                onChange={(e) => handleChange("bgPrimary", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Main page background</small>
          </div>

          {/* Background Secondary */}
          <div>
            <label style={labelStyle}>Background (Cards)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.bgSecondary}
                onChange={(e) => handleChange("bgSecondary", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.bgSecondary}
                onChange={(e) => handleChange("bgSecondary", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Card backgrounds</small>
          </div>

          {/* Sidebar Background */}
          <div>
            <label style={labelStyle}>Sidebar Background</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.bgSidebar}
                onChange={(e) => handleChange("bgSidebar", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.bgSidebar}
                onChange={(e) => handleChange("bgSidebar", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Navigation sidebar</small>
          </div>

          {/* Text Primary */}
          <div>
            <label style={labelStyle}>Text (Primary)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={formValues.textPrimary}
                onChange={(e) => handleChange("textPrimary", e.target.value)}
                style={colorInputStyle}
              />
              <input
                type="text"
                value={formValues.textPrimary}
                onChange={(e) => handleChange("textPrimary", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Headings, titles</small>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div style={sectionStyle}>
        <h3 style={{ color: "var(--text-primary)", marginTop: 0, marginBottom: 16 }}>
          Preview
        </h3>
        <div style={{ 
          display: "flex", 
          gap: 16, 
          alignItems: "center",
          padding: 16,
          background: formValues.bgPrimary,
          borderRadius: 8,
          border: `1px solid ${formValues.textMuted}`
        }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            background: formValues.bgSidebar, 
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {formValues.logoUrl ? (
              <img src={formValues.logoUrl} alt="" style={{ maxWidth: 50, maxHeight: 40, objectFit: "contain" }} />
            ) : (
              <span style={{ color: formValues.textMuted, fontSize: 10 }}>Logo</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: formValues.textPrimary, fontWeight: 600, marginBottom: 4 }}>
              {formValues.customerName && formValues.customerName.trim() ? formValues.customerName : DEFAULT_THEME.customerName} CIC Demo
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: formValues.primaryColor, fontWeight: 500 }}>Active Link</span>
              <span style={{ color: formValues.textSecondary }}>Normal Link</span>
            </div>
          </div>
          <div style={{ 
            background: formValues.bgSecondary, 
            padding: "8px 16px", 
            borderRadius: 6,
            color: formValues.textMuted,
            fontSize: "0.85rem"
          }}>
            Card
          </div>
          <button style={{
            background: formValues.primaryColor,
            color: formValues.bgPrimary,
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer"
          }}>
            Button
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--text-muted)",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          style={{
            background: "var(--primary-color)",
            color: "var(--bg-primary)",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {saved ? "✓ Saved!" : "Save Theme"}
        </button>
      </div>

      {/* Defaults Reference */}
      <div style={{ ...sectionStyle, marginTop: 32, opacity: 0.8 }}>
        <h4 style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: 12 }}>
          Default Theme Reference
        </h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(DEFAULT_THEME).filter(([k]) => k.includes("Color") || k.includes("bg") || k.includes("text")).map(([key, value]) => (
            <div 
              key={key}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                background: "var(--bg-primary)",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: "0.75rem"
              }}
            >
              <div style={{ 
                width: 14, 
                height: 14, 
                background: value, 
                borderRadius: 3,
                border: "1px solid var(--text-muted)"
              }} />
              <span style={{ color: "var(--text-muted)" }}>{key}:</span>
              <code style={{ color: "var(--text-secondary)" }}>{value}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
