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

export default function TypeExamens() {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("http://127.0.0.1:8000/api/type-examens?per_page=500", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Erreur chargement type examens");
        return body;
      })
      .then((data) => {
        setItems(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Impossible de charger."))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    return items.filter((t) =>
      `${t.code || ""} ${t.libelle || ""}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalItems = filtered.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const columns = [
    {
      label: "",
      key: "select",
      render: (_, row) => (
        <Checkbox
          checked={selected.includes(row.id)}
          onChange={(e) => {
            setSelected((sel) =>
              e.target.checked ? [...sel, row.id] : sel.filter((id) => id !== row.id)
            );
          }}
        />
      ),
      header: () => (
        <Checkbox
          checked={filtered.length > 0 && filtered.every((r) => selected.includes(r.id))}
          onChange={(e) => {
            if (e.target.checked) setSelected(filtered.map((r) => r.id));
            else setSelected([]);
          }}
        />
      ),
      width: 30,
    },
    { label: "ID", key: "id", render: (_, row) => row.id },
    { label: "Code", key: "code", render: (_, row) => row.code || "" },
    { label: "Libellé", key: "libelle", render: (_, row) => row.libelle || "" },
  ];

  const actions = [
    { label: "Show", icon: iconShow, handler: (row) => navigate(`/type_examens/${row.id}`) },
    ...(role === "admin"
      ? [{ label: "Edit", icon: iconEdit, handler: (row) => navigate(`/type_examens/${row.id}/edit`) }]
      : []),
  ];

  return (
    <Layout>
      <h2>Types d’examens</h2>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 23, width: "100%" }}>
        <div style={{ flexBasis: "80%", maxWidth: "80%" }}>
          <Filter placeholder="Recherche..." onFilter={(v) => { setSearch(v); setCurrentPage(1); }} />
        </div>

        <div style={{ flexBasis: "20%", maxWidth: "20%", display: "flex", justifyContent: "flex-end" }}>
          {role === "admin" && (
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
              onClick={() => navigate("/type_examens/create")}
            >
              Ajouter
            </button>
          )}
        </div>
      </div>

      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      {!loading && !error && (
        <Table columns={columns} data={paged} actions={actions} searchable={false} />
      )}

      {/* ✅ delete multi admin only */}
      {role === "admin" && selected.length > 0 && (
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
            {selected.length} sélectionné(s)
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
              if (!window.confirm("Supprimer les types d’examens sélectionnés ?")) return;

              try {
                await Promise.all(
                  selected.map((id) =>
                    fetch(`http://127.0.0.1:8000/api/type-examens/${id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                    }).then(async (res) => {
                      if (!res.ok) {
                        const body = await res.json().catch(() => null);
                        throw new Error(body?.message || `Erreur suppression id ${id}`);
                      }
                    })
                  )
                );

                setItems((prev) => prev.filter((x) => !selected.includes(x.id)));
                setSelected([]);
              } catch (e) {
                setError(e.message || "Erreur suppression.");
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
