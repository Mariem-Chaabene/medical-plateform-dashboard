import { useState, useRef, useEffect } from "react";

export default function Dropdown({
  value,           
  options,          
  onChange,        
  pillLabel,        
  pillColor,        
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
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 999,
          backgroundColor: pillColor,
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {pillLabel}
      </span>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          fontSize: 12,
          padding: "4px 10px",
          background: "#fff",
          color: "#4b5563",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <span>{current?.label || "Changer"}</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            minWidth: 140,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            padding: "6px 0",
            zIndex: 20,
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
                padding: "6px 12px",
                border: "none",
                background: opt.value === value ? "#f3f4f6" : "transparent",
                color: "#374151",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: opt.color,
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
