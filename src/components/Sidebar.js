import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_CONFIG = {
  admin: [
    { label: "Utilisateurs", path: "/users" },
    { label: "Rôles", path: "/roles" },
    { label: "Patients", path: "/patients" },
  ],
  medecin: [
    { label: "Mes patients", path: "/patients" },
    { label: "Consultations", path: "/consultations" },
    { label: "Prescriptions", path: "/prescriptions" },
  ],
  infirmier: [
    { label: "Patients", path: "/patients" },
    { label: "Rendez-Vous", path: "/rendez-vous" },
    { label: "Salle D'attente", path: "/salle-attente" }
  ],
  patient: [
    { label: "Mon dossier médical", path: "/mon-dme" },
    { label: "Mes rendez-vous", path: "/mes-rendezvous" },
  ],
};

export default function Sidebar() {

  const { role } = useAuth();    
  const links = MENU_CONFIG[role] || []; 

  return (
    <aside className="sidebar">
      <div className="sidebar__title">Menu</div>
     <nav className="sidebar__nav">
        {links.map(({label, path}) => (
          <NavLink key={path}
            to={path}
            className={({ isActive }) => isActive ? "sidebar__link active" : "sidebar__link"}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
