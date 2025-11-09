import "./Navbar.css";
import Avatar from "./ui/Avatar/Avatar";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__title">Plateforme Médicale</div>
      <div className="navbar__actions">
        <Avatar
          src={
            user?.avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${
              user?.name || "A"
            }`
          }
          alt="Avatar"
          onClick={() => setOpen((o) => !o)}
        />
        {open && (
          <div className="navbar__dropdown">
            <div className="navbar__dropdown__top">
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${
                    user?.name || "A"
                  }&backgroundType=solid&backgroundColor=ecedef`
                }
                className="navbar__dropdown__avatar"
                alt=""
              />

              <div>
                <div className="navbar__dropdown__name">
                  {user?.name || "Utilisateur"}
                </div>
                <div className="navbar__dropdown__email">
                  {user?.email || ""}
                </div>
              </div>
            </div>
            <hr className="navbar__dropdown__hr" />
            <div className="navbar__dropdown__list">
              <button className="navbar__dropdown__item">
                <span className="navbar__dropdown__icon">
                  {/* Profile icon */}
                  <svg
                    width="20"
                    height="20"
                    fill="#909090"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-2.8 3.7-5 8-5s8 2.2 8 5" />
                  </svg>
                </span>
                Profile
              </button>
            </div>
            <hr className="navbar__dropdown__hr" />
            <button
              className="navbar__dropdown__item navbar__dropdown__signout"
              onClick={logout}
            >
              <span className="navbar__dropdown__icon">
                {/* Sign out icon */}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#48c6ef"
                  strokeWidth="2"
                >
                  <path d="M16 17v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
                  <polyline points="7 12 16 12" />
                  <polyline points="12 8 16 12 12 16" />
                </svg>
              </span>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
