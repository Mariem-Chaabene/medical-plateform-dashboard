import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_CONFIG = {
  admin: [
    { label: "Utilisateurs", path: "/users" },
    { label: "Rôles", path: "/roles" },
    {
      type: "group",
      label: "Paramétrages",
      children: [
        { label: "Type Analyses", path: "/type_analyses" },
        { label: "Type Examens", path: "/type_examens" },
        { label: "Type Antécédents", path: "/type_antecedants" },
      ],
    },
  ],
  medecin: [
    { label: "Accueil", path: "/medecin" },
    { label: "Patients", path: "/patients" },
    { label: "Messagerie", path: "/messagerie" },
    { label: "Rendez-Vous", path: "/rendez-vous" },
    { label: "Salle D'attente", path: "/salle-attente" },
  ],
  infirmier: [
    { label: "Patients", path: "/patients" },
    { label: "Messagerie", path: "/messagerie" },
    { label: "Rendez-Vous", path: "/rendez-vous" },
    { label: "Salle D'attente", path: "/salle-attente" },
  ],
  patient: [
    { label: "Mon dossier médical", path: "/mon-dme" },
    { label: "Mes rendez-vous", path: "/mes-rendezvous" },
  ],
};

export default function Sidebar({ unreadCount = 0 }) {
  const { role } = useAuth();
  const links = MENU_CONFIG[role] || [];

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {links.map((item) => {
          if (item.type === "group") {
            return (
              <div key={item.label} className="sidebar__group">
                <div className="sidebar__groupLabel" role="button" tabIndex={0}>
                  {item.label}
                </div>

                <div className="sidebar__submenu">
                  {item.children.map(({ label, path }) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        isActive
                          ? "sidebar__sublink active"
                          : "sidebar__sublink"
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }

          const isMessaging = item.path === "/messagerie";

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar__link active" : "sidebar__link"
              }
            >
              <span>{item.label}</span>

              {isMessaging && unreadCount > 0 ? (
                <span className="sidebar__badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}