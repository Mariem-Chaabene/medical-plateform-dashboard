export default function Toast({ type = "success", title, message, onClose }) {
  if (!message && !title) return null;

  const bg = "#fff";
  const borderLeft =
    type === "success"
      ? "4px solid #16a34a"
      : type === "error"
      ? "4px solid #dc2626"
      : "4px solid #f59e0b";

  const iconColor =
    type === "success"
      ? "#16a34a"
      : type === "error"
      ? "#dc2626"
      : "#f59e0b";

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        background: bg,
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
        padding: "12px 18px 12px 14px",
        minWidth: 260,
        maxWidth: 360,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        borderLeft,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#ecfdf5",
          border: `2px solid ${iconColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <span style={{ color: iconColor, fontSize: 14 }}>✓</span>
      </div>

      <div style={{ flex: 1 }}>
        {title && (
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 2,
              color: "#111827",
            }}
          >
            {title}
          </div>
        )}
        {message && (
          <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.4 }}>
            {message}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 18,
          color: "#9ca3af",
          padding: 0,
          marginLeft: 6,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
