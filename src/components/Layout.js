import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__main" style={{ display: "flex" }}>
        <Sidebar />
        <main className="dashboard-content" style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
