import React from "react";

export default function Dialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmColor = "#ef4444", 
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: "24px",
          maxWidth: 400,
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
          animation: "slideIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: confirmColor + "20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke={confirmColor}
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              {title}
            </h3>
          </div>
        </div>

        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: 14,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              color: "#6b7280",
              borderRadius: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              !isLoading && (e.target.style.backgroundColor = "#f3f4f6")
            }
            onMouseLeave={(e) =>
              !isLoading && (e.target.style.backgroundColor = "#f9fafb")
            }
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              backgroundColor: confirmColor,
              color: "#fff",
              borderRadius: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              !isLoading && (e.target.style.opacity = "0.9")
            }
            onMouseLeave={(e) =>
              !isLoading && (e.target.style.opacity = "1")
            }
          >
            {isLoading ? "En cours..." : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
