import { useState, useRef, useEffect } from "react";

export default function DropdownField({
  value,
  options,
  onChange,
  placeholder = "Sélectionner...",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((opt) => opt.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          color: current ? "#1f2937" : "#9ca3af",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span>{current?.label || placeholder}</span>
        <span style={{ fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            padding: "6px 0",
            zIndex: 20,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (opt.value !== value) {
                  onChange?.(opt.value);
                }
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: opt.value === value ? "#f3f4f6" : "transparent",
                color: "#374151",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => !open && (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = opt.value === value ? "#f3f4f6" : "transparent")}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: opt.color || "#60a5fa",
                }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
