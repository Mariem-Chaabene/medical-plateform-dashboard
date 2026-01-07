import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Table from "../components/ui/Table/Table";
import Avatar from "../components/ui/Avatar/Avatar";
import Filter from "../components/ui/Filter/Filter";
import Pagination from "../components/ui/Pagination/Pagination";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Dialog from "../components/ui/Dialog/Dialog";

export default function SalleAttente() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmColor: "#ef4444",
    isLoading: false,
  });
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

  const totalItems = filtered.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedItems = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const statusMeta = {
    en_attente: { label: "En attente", color: "#fbbf24" },
    en_consultation: { label: "En consultation", color: "#60a5fa" },
    termine: { label: "Terminé", color: "#10b981" },
  };

  const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
    color: meta.color,
  }));

  const handleStatusChange = async (row, newStatus) => {
    if (newStatus === "termine" || newStatus === "annule") {
      const isTermine = newStatus === "termine";
      setConfirmDialog({
        isOpen: true,
        title: isTermine
          ? "Marquer comme terminé ?"
          : "Annuler la consultation ?",
        message: isTermine
          ? `${
              row.patient?.user?.name || "Le patient"
            } sera retiré de la salle d'attente. Cette action est définitive.`
          : `${
              row.patient?.user?.name || "Le patient"
            } sera retiré de la salle d'attente. Cette action est définitive.`,
        confirmText: isTermine ? "Terminer" : "Annuler",
        confirmColor: isTermine ? "#10b981" : "#ef4444",
        isLoading: false,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isLoading: true }));

          try {
            const res = await fetch(
              `http://127.0.0.1:8000/api/salle-attente/${row.id}/statut`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ statut: newStatus }),
              }
            );

            if (!res.ok) {
              console.error(await res.text());
              setError("Erreur lors de la modification du statut.");
            } else {
              fetchSalleAttente();
              setConfirmDialog({ isOpen: false });
            }
          } catch (e) {
            console.error(e);
            setError("Erreur réseau.");
          } finally {
            setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
          }
        },
      });
    } else {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/salle-attente/${row.id}/statut`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ statut: newStatus }),
          }
        );

        if (!res.ok) {
          console.error(await res.text());
          setError("Erreur lors de la modification du statut.");
        } else {
          fetchSalleAttente();
        }
      } catch (e) {
        console.error(e);
        setError("Erreur réseau.");
      }
    }
  };

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
      label: "Date / Heure",
      key: "date_heure",
      render: (value, row) => {
        if (!row.date_heure) return "-";
        const year = row.date_heure.slice(0, 4);
        const month = row.date_heure.slice(5, 7);
        const day = row.date_heure.slice(8, 10);
        const time = row.date_heure.slice(11, 16);
        return `${day}/${month}/${year} ${time}`;
      },
    },
    {
      label: "Statut",
      key: "statut",
      render: (value, row) => {
        const meta = statusMeta[value] || {
          label: value,
          color: "#e5e7eb",
        };
        return (
          <Dropdown
            value={row.statut}
            options={statusOptions}
            pillLabel={meta.label}
            pillColor={meta.color}
            onChange={(newStatus) => handleStatusChange(row, newStatus)}
          />
        );
      },
    },
    {
      label: "Motif",
      key: "motif",
      render: (_, row) => <span>{row.motif || "-"}</span>, 
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
            <Table columns={columns} data={pagedItems} searchable={false} />
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
      <Dialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || "Confirmer"}
        confirmColor={confirmDialog.confirmColor}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </Layout>
  );
}
