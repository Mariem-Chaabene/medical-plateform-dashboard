import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/ui/Table/Table";
import Avatar from "../components/ui/Avatar/Avatar";
import Filter from "../components/ui/Filter/Filter";
import Pagination from "../components/ui/Pagination/Pagination";

// Icône pour voir le DME par exemple (optionnel)
const iconShow = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    ircle cx="12" cy="12" r="3" />
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
  </svg>
);

export default function SalleAttente() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchSalleAttente = () => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/salle-attente", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setItems(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger la salle d'attente.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSalleAttente();
  }, [token]);

  // Filtrage
  const filtered = items.filter((item) => {
    const patient = item.patient || {};
    const user = patient.user || {};
    const medecin = item.medecin || {};
    const text = (
      (user.name || "") +
      " " +
      (user.surname || "") +
      " " +
      (user.email || "") +
      " " +
      (medecin.name || "") +
      " " +
      (medecin.surname || "") +
      " " +
      (item.motif || "")
    )
      .toLowerCase()
      .includes(search.toLowerCase());
    return text;
  });

  // Pagination
  const totalItems = filtered.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedItems = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Colonnes pour Table
  const columns = [
    {
      label: "Patient",
      key: "patient",
      render: (_, row) => {
        const patient = row.patient || {};
        const user = patient.user || {};
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${
                  user.name || ""
                }`
              }
              size={36}
              alt={user.name || ""}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>
                {user.name} {user.surname}
              </span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      label: "Médecin",
      key: "medecin",
      render: (_, row) => {
        const med = row.medecin || {};
        return (
          <span>
            {med.name} {med.surname}
          </span>
        );
      },
    },
    {
      label: "Heure",
      key: "date_heure",
      render: (value, row) => {
        const dt = row.date_heure ? new Date(row.date_heure) : null;
        if (!dt) return "";
        return dt.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      label: "Statut",
      key: "statut",
      render: (value, row) => {
        const handleStatutChange = async (newStatut) => {
          await fetch(
            `http://127.0.0.1:8000/api/salle-attente/${row.id}/statut`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ statut: newStatut }),
            }
          );
          fetchSalleAttente();
        };

        return (
          <select
            className="custom-input"
            value={row.statut}
            onChange={(e) => handleStatutChange(e.target.value)}
          >
            <option value="en_attente">En attente</option>
            <option value="en_consultation">En consultation</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        );
      },
    },
    {
      label: "Motif",
      key: "motif",
      render: (value, row) => {
        const handleMotifBlur = async (e) => {
          const newMotif = e.target.value;
          await fetch(`http://127.0.0.1:8000/api/salle-attente/${row.id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ motif: newMotif }),
          });
          fetchSalleAttente();
        };

        return (
          <input
            className="custom-input"
            defaultValue={row.motif || ""}
            onBlur={handleMotifBlur}
            placeholder="Motif..."
          />
        );
      },
    },
  ];


  return (
    <Layout>
      <h2>Salle d'attente</h2>

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
          <Filter
            placeholder="Recherche patient / médecin / motif..."
            onFilter={setSearch}
          />
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
              fontSize: 15,
              cursor: "pointer",
            }}
            onClick={fetchSalleAttente}
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      {!loading && !error && (
        <>
          {pagedItems.length === 0 ? (
            <div>Aucun patient en attente pour aujourd'hui.</div>
          ) : (
            <Table
              columns={columns}
              data={pagedItems}
              searchable={false}
            />
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
        </>
      )}
    </Layout>
  );
}
