import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/ui/Table/Table";
import Avatar from "../components/ui/Avatar/Avatar";
import Filter from "../components/ui/Filter/Filter";
import Checkbox from "../components/ui/Checkbox/Checkbox";
import Pagination from "../components/ui/Pagination/Pagination";

const iconEdit = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const iconShow = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
  </svg>
);


export function PrivateRoute({ children, requiredRole }) {
  const { token, role } = useAuth();
  if (!token || role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function Users() {
  const { token, role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
    const filteredUsers = users.filter((u) =>
    (u.name + " " + (u.surname || "") + " " + (u.email || ""))
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const totalItems = filteredUsers.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );


  useEffect(() => {
    if (role !== "admin") {
      setError("Accès réservé à l’admin.");
      setLoading(false);
      return;
    }
    fetch("http://127.0.0.1:8000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les utilisateurs.");
        setLoading(false);
      });
  }, [token, role]);

  const columns = [
    {
      label: "",
      key: "select",
      render: (_, row) => (
        <Checkbox
          checked={selected.includes(row.id)}
          onChange={(e) => {
            setSelected((sel) =>
              e.target.checked
                ? [...sel, row.id]
                : sel.filter((id) => id !== row.id)
            );
          }}
        />
      ),
      header: () => (
        <Checkbox
          checked={
            filteredUsers.length > 0 &&
            filteredUsers.every((u) => selected.includes(u.id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelected(filteredUsers.map((u) => u.id));
            } else {
              setSelected([]);
            }
          }}
        />
      ),
      width: 30,
    },
    {
      label: "Nom",
      key: "name",
      render: (value, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            src={
              row.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${row.name}&backgroundType=solid&backgroundColor=e4e4e4`
            }
            size={36}
            alt={row.name}
          />
          <span>{value}</span>
        </div>
      ),
    },
    { label: "Email", key: "email" },
    {
      label: "Rôle",
      key: "roles",
      render: (value, row) => (
        <span>
          {Array.isArray(row.roles)
            ? row.roles.map((r) => r.name).join(", ")
            : ""}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Edit",
      icon: iconEdit,
      handler: (row) => navigate(`/users/${row.id}/edit`),
    },
    {
      label: "Show",
      icon: iconShow,
      handler: (row) => navigate(`/users/${row.id}`),
    },
  ];

  return (
    <Layout>
      <h2>Liste des utilisateurs</h2>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "23px",
          width: "100%",
        }}
      >
        <div style={{ flexBasis: "80%", maxWidth: "80%" }}>
          <Filter placeholder="Quick search..." onFilter={setSearch} />
        </div>
        <div
          style={{
            flexBasis: "20%",
            maxWidth: "20%",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            style={{
              background: "#48c6ef",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              borderRadius: 13,
              padding: "13px 36px",
              fontSize: 17,
              cursor: "pointer",
            }}
            onClick={() => navigate("/users/create")}
          >
            Ajouter
          </button>
        </div>
      </div>
      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}
      {!loading && !error && (
        <Table
          columns={columns}
          data={pagedUsers}
          actions={actions}
          searchable={false}
        />
      )}
      {selected.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            boxShadow: "0 -4px 16px #263fa320",
            padding: "17px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 20,
            borderTop: "1px solid #eee",
          }}
        >
          <span style={{ fontWeight: 500, fontSize: 16, color: "#48c6ef" }}>
            {selected.length} Utilisateur(s) selectionné(s)
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <button
              style={{
                background: "#fff",
                color: "#b2b2b2",
                border: "1.5px solid #b2b2b2",
                borderRadius: 9,
                padding: "10px 30px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={async () => {
                // Supprime tous les users sélectionnés (à toi d’implémenter)
                for (const id of selected) {
                  await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                }
                setUsers((users) =>
                  users.filter((u) => !selected.includes(u.id))
                );
                setSelected([]);
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        perPage={perPage}
        perPageOptions={[10, 20, 50]}
        onPageChange={(pg) => setCurrentPage(pg)}
        onPerPageChange={(n) => {
          setPerPage(n);
          setCurrentPage(1); // restart on page 1 if perPage changes
        }}
      />
    </Layout>
  );
}
