import "./Sidebar.css";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__title">Menu</div>
      <nav className="sidebar__nav">
        <NavLink to="/home" className={({ isActive }) => isActive ? "sidebar__link active" : "sidebar__link"}>Dashboard</NavLink>
        <NavLink to="/users" className="sidebar__link">Utilisateurs</NavLink>
        <NavLink to="/roles" className="sidebar__link">Rôles</NavLink>
        <NavLink to="/patients" className="sidebar__link">Patients</NavLink>
        {/* Ajoute d'autres liens ici */}
      </nav>
    </aside>
  );
}
