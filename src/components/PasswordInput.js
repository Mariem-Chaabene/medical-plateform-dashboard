import { useState } from "react";
import './Input/PasswordInput.css';

export default function PasswordInput({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="custom-input"
        {...props}
      />
      <button
        type="button"
        className="pass-toggle-btn"
        tabIndex={-1}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? (
          // œil ouvert
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#48c6ef" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2.8" fill="#48c6ef" />
          </svg>
        ) : (
          // œil barré
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#888" strokeWidth="2"/>
            <line x1="5" y1="5" x2="19" y2="19" stroke="#888" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2.8" fill="#888" />
          </svg>
        )}
      </button>
    </div>
  );
}
