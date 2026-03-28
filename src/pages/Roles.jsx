import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Table from "../components/ui/Table/Table";
import Filter from "../components/ui/Filter/Filter";
import Checkbox from "../components/ui/Checkbox/Checkbox";
import Pagination from "../components/ui/Pagination/Pagination";

const iconEdit = (
  <svg width="20" height="20" fill="none" stroke="#b2b2b2" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const iconShow = (
  <svg width="20" height="20" fill="none" stroke="#b2b2b2" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
  </svg>
);

export default function Roles() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("http://127.0.0.1:8000/api/roles", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Erreur chargement rôles");
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setRoles(list);
      })
      .catch((e) => setError(e.message || "Impossible de charger les rôles."))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      `${r.name || ""} ${r.guard_name || ""}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [roles, search]);

  const totalItems = filteredRoles.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedRoles = filteredRoles.slice((currentPage - 1) * perPage, currentPage * perPage);

  const columns = [
    {
      label: "",
      key: "select",
      render: (_, row) => (
        <Checkbox
          checked={selected.includes(row.id)}
          onChange={(e) => {
            setSelected((sel) => (e.target.checked ? [...sel, row.id] : sel.filter((id) => id !== row.id)));
          }}
        />
      ),
      header: () => (
        <Checkbox
          checked={filteredRoles.length > 0 && filteredRoles.every((r) => selected.includes(r.id))}
          onChange={(e) => {
            if (e.target.checked) setSelected(filteredRoles.map((r) => r.id));
            else setSelected([]);
          }}
        />
      ),
      width: 30,
    },
    { label: "Nom", key: "name", render: (_, row) => row.name || "" },
  ];

  const actions = [
    { label: "Edit", icon: iconEdit, handler: (row) => navigate(`/roles/${row.id}/edit`) },
    { label: "Show", icon: iconShow, handler: (row) => navigate(`/roles/${row.id}`) },
  ];

  return (
    <Layout>
      <h2>Gestion des rôles</h2>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 23, width: "100%" }}>
        <div style={{ flexBasis: "80%", maxWidth: "80%" }}>
          <Filter placeholder="Recherche rôle..." onFilter={setSearch} />
        </div>

        <div style={{ flexBasis: "20%", maxWidth: "20%", display: "flex", justifyContent: "flex-end" }}>
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
            onClick={() => navigate("/roles/create")}
          >
            Ajouter
          </button>
        </div>
      </div>

      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      {!loading && !error && <Table columns={columns} data={pagedRoles} actions={actions} searchable={false} />}

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
            {selected.length} rôle(s) sélectionné(s)
          </span>

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
              if (!window.confirm("Supprimer les rôles sélectionnés ?")) return;
              try {
                await Promise.all(
                  selected.map((id) =>
                    fetch(`http://127.0.0.1:8000/api/roles/${id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                    }).then(async (res) => {
                      if (!res.ok) {
                        const body = await res.json().catch(() => null);
                        throw new Error(body?.message || `Erreur suppression role id ${id}`);
                      }
                    })
                  )
                );
                setRoles((items) => items.filter((r) => !selected.includes(r.id)));
                setSelected([]);
              } catch (e) {
                setError(e.message || "Erreur suppression rôles.");
              }
            }}
          >
            Supprimer
          </button>
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
          setCurrentPage(1);
        }}
      />
    </Layout>
  );
}
