// src/components/ui/BackButton.js
import { useNavigate } from "react-router-dom";

export default function BackButton({ className = "", style = {}, children = "Retour" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`back-btn ${className}`}
      style={style}
      onClick={() => navigate(-1)}
    >
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="#666"
        strokeWidth="2"
        viewBox="0 0 24 24"
        style={{ marginRight: 6 }}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </button>
  );
}
