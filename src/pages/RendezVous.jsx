import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import Table from "../components/ui/Table/Table";
import Avatar from "../components/ui/Avatar/Avatar";
import Filter from "../components/ui/Filter/Filter";
import Pagination from "../components/ui/Pagination/Pagination";
import Modal from "../components/ui/Modal/Modal";
import Input from "../components/ui/Input/Input";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Checkbox from "../components/ui/Checkbox/Checkbox";
import Toast from "../components/ui/Toast/Toast";
import Dialog from "../components/ui/Dialog/Dialog";
import Spinner from "../components/ui/Spinner/Spinner";

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

const iconCheckIn = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2 2" />
    <path d="M17 17l3 3" />
    <path d="M20 17l-3 3" />
  </svg>
);

export default function RendezVous() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preselectedPatientId = searchParams.get("patient_id");
  const [selected, setSelected] = useState([]);

  const [items, setItems] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loadingMutations, setLoadingMutations] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    patient_id: "",
    medecin_id: "",
    date: "",
    time: "",
    motif: "",
    statut: "planned",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState({
    type: "success",
    title: "",
    message: "",
  });
  const [autoOpened, setAutoOpened] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmColor: "#ef4444",
    isLoading: false,
    pendingRow: null,
    pendingStatus: null,
    cancelText: "Annuler",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [rdvRes, medRes, patRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/rendez-vous", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/medecins", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/patients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rdvData = await rdvRes.json();
      const medData = await medRes.json();
      const patData = await patRes.json();

      setItems(Array.isArray(rdvData) ? rdvData : []);
      const medList = Array.isArray(medData)
        ? medData
        : Array.isArray(medData.data)
        ? medData.data
        : [];
      const patList = Array.isArray(patData.data) ? patData.data : [];
      setMedecins(medList);
      setPatients(patList);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (preselectedPatientId && patients.length > 0 && !autoOpened) {
      openCreateModal();
      setAutoOpened(true);
    }
  }, [preselectedPatientId, patients.length, autoOpened]);

  const handleFormChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      patient_id: preselectedPatientId || "",
      medecin_id: "",
      date: "",
      time: "",
      motif: "",
      statut: "planned",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    let dateStr = "";
    let timeStr = "";
    if (row.date_heure) {
      const clean = row.date_heure.replace("Z", "").slice(0, 19);
      const [datePart, timePart] = clean.split("T");
      dateStr = datePart;
      timeStr = timePart.slice(0, 5);
    }

    setEditingId(row.id);
    setForm({
      patient_id: row.patient_id,
      medecin_id: row.medecin_id,
      date: dateStr,
      time: timeStr,
      motif: row.motif || "",
      statut: row.statut || "planned",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModalAndRefresh = async () => {
    setModalOpen(false);
    await loadData();
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.patient_id || !form.medecin_id || !form.date || !form.time) {
      setFormError(
        "Veuillez choisir un patient, un médecin, une date et une heure."
      );
      return;
    }

    const date_heure = `${form.date} ${form.time}:00`;

    const payload = {
      patient_id: form.patient_id,
      medecin_id: form.medecin_id,
      date_heure,
      motif: form.motif,
      statut: form.statut || "planned",
    };

    try {
      setFormLoading(true);
      const url = editingId
        ? `http://127.0.0.1:8000/api/rendez-vous/${editingId}`
        : "http://127.0.0.1:8000/api/rendez-vous";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(await res.text());
        setFormError("Erreur lors de l'enregistrement du rendez-vous.");
      } else {
        await closeModalAndRefresh();
      }
    } catch (err) {
      console.error(err);
      setFormError("Erreur réseau.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/rendez-vous/${row.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Erreur suppression");
      await closeModalAndRefresh();
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la suppression du rendez-vous.");
    }
  };

  const handleStatusChange = async (row, newStatus) => {
    if (newStatus === "termine" || newStatus === "annule") {
      const isTermine = newStatus === "termine";

      setConfirmDialog({
        isOpen: true,
        title: isTermine
          ? "Marquer comme terminé ?"
          : "Annuler le rendez-vous ?",
        message: isTermine
          ? `Le rendez-vous de ${
              row.patient?.user?.name || "ce patient"
            } sera marqué comme terminé.`
          : `Le rendez-vous de ${
              row.patient?.user?.name || "ce patient"
            } sera annulé.`,
        confirmText: isTermine ? "Terminer" : "Annuler",
        cancelText: "Non, garder",
        confirmColor: isTermine ? "#10b981" : "#ef4444",
        isLoading: false,
        pendingRow: row,
        pendingStatus: newStatus,
      });
    } else {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/rendez-vous/${row.id}/statut`,
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
          await loadData();
        } else {
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === row.id ? { ...item, statut: newStatus } : item
            )
          );
          await loadData();
        }
      } catch (e) {
        console.error(e);
        setError("Erreur réseau.");
        await loadData();
      }
    }
  };

  const handleConfirmStatusChange = async () => {
    const { pendingRow, pendingStatus } = confirmDialog;

    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
    setLoadingMutations((prev) => ({ ...prev, [pendingRow.id]: true }));
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/rendez-vous/${pendingRow.id}/statut`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ statut: pendingStatus }),
        }
      );

      if (!res.ok) {
        console.error("❌ API Error:", await res.text());
        setError("Erreur lors de la modification du statut.");
        await loadData();
      } else {
        setItems((prevItems) => {
          const updated = prevItems.map((item) =>
            item.id === pendingRow.id
              ? { ...item, statut: pendingStatus }
              : item
          );
          return updated;
        });
        setConfirmDialog({
          isOpen: false,
          pendingRow: null,
          pendingStatus: null,
        });
        await loadData();
      }
    } catch (e) {
      console.error("💥 Catch error:", e);
      setError("Erreur réseau.");
      await loadData();
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
      setLoadingMutations((prev) => ({ ...prev, [pendingRow.id]: false }));
    }
  };

  const handleCheckIn = async (row) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/rendez-vous/${row.id}/check-in`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("Réponse non JSON:", text);
      }

      if (!res.ok) {
        setToast({
          type: "error",
          title: "Check-in impossible",
          message: data?.error || "Erreur lors du check-in.",
        });
      } else {
        setToast({
          type: "success",
          title: "Check-in réussi",
          message: "Le patient a été ajouté en salle d'attente.",
        });
        await closeModalAndRefresh();
        navigate("/salle-attente");
      }
    } catch (e) {
      console.error(e);
      setToast({
        type: "error",
        title: "Erreur réseau",
        message: "Une erreur réseau est survenue.",
      });
    }
  };

  const filteredItems = items
    .filter(
      (item) =>
        item.statut !== "annule" &&
        item.statut !== "termine" &&
        item.statut !== "en_salle_attente"
    )
    .filter((item) => {
      const patient = item.patient || {};
      const user = patient.user || {};
      const med = item.medecin || {};
      const text = (
        (user.name || "") +
        " " +
        (user.surname || "") +
        " " +
        (user.email || "") +
        " " +
        (med.name || "") +
        " " +
        (med.surname || "") +
        " " +
        (item.motif || "")
      )
        .toLowerCase()
        .includes(search.toLowerCase());
      return text;
    });

  const totalItems = filteredItems.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const isRdvToday = (rdvDate) => {
    if (!rdvDate) return false;

    const rdvDateStr = rdvDate.slice(0, 10);
    const [year, month, day] = rdvDateStr.split("-");

    const rdvDateObj = new Date(Number(year), Number(month) - 1, Number(day));

    const today = new Date();

    const diffTime = today.getTime() - rdvDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 0 || (diffDays === 1 && today.getHours() < 4);
  };

  const statusMeta = {
    planned: { label: "Planifié", color: "#fbbf24" },
    confirme: { label: "Confirmé", color: "#60a5fa" },
    annule: { label: "Annulé", color: "#ef4444" },
    termine: { label: "Terminé", color: "#10b981" },
  };

  const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
    color: meta.color,
  }));

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
            filteredItems.length > 0 &&
            filteredItems.every((u) => selected.includes(u.id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelected(filteredItems.map((u) => u.id));
            } else {
              setSelected([]);
            }
          }}
        />
      ),
      width: 30,
    },
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
      label: "Date / heure",
      key: "date_heure",
      render: (value, row) => {
        if (!row.date_heure) return "";

        const clean = row.date_heure.replace("Z", "").slice(0, 19);
        const [datePart, timePart] = clean.split("T");

        const [year, month, day] = datePart.split("-");
        const [hour, minute] = timePart.split(":");

        const dt = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute)
        );

        return dt.toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
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
        if (loadingMutations[row.id]) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner size={16} color={meta.color} />
              <span style={{ fontSize: 13, color: meta.color }}>
                En cours...
              </span>
            </div>
          );
        }
        return (
          <Dropdown
            value={value}
            options={statusOptions}
            pillLabel={meta.label}
            pillColor={meta.color}
            onChange={(newStatus) => {
              handleStatusChange(row, newStatus);
            }}
          />
        );
      },
    },
    {
      label: "Motif",
      key: "motif",
      render: (value) => value || "-",
    },
  ];

  const actions = [
    {
      label: "Modifier",
      icon: iconEdit,
      handler: (row) => openEditModal(row),
    },
    {
      label: "Voir patient",
      icon: iconShow,
      handler: (row) => {
        const patientId = row.patient?.id;
        if (patientId) navigate(`/patients/${patientId}`);
      },
    },
    {
      label: "Check-in",
      icon: iconCheckIn,
      handler: (row) => {
        if (!isRdvToday(row.date_heure)) {
          setToast({
            type: "error",
            title: "Check-in impossible",
            message:
              "Le check-in est disponible uniquement pour les rendez-vous du jour.",
          });
          return;
        }

        if (row.statut === "termine" || row.statut === "annule") {
          setToast({
            type: "error",
            title: "Check-in impossible",
            message: "Ce rendez-vous est déjà terminé ou annulé.",
          });
          return;
        }

        handleCheckIn(row);
      },
    },
  ];

  return (
    <Layout>
      <h2>Rendez-vous</h2>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "23px",
          width: "100%",
        }}
      >
        <div style={{ flexBasis: "70%", maxWidth: "70%" }}>
          <Filter
            placeholder="Recherche patient / médecin / motif..."
            onFilter={setSearch}
          />
        </div>
        <div
          style={{
            flexBasis: "30%",
            maxWidth: "30%",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            style={{
              background: "#f3f4f6",
              color: "#4b5563",
              fontWeight: 500,
              border: "1px solid #e5e7eb",
              borderRadius: 13,
              padding: "11px 22px",
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: loading ? 0.6 : 1,
            }}
            onClick={loadData}
            disabled={loading}
          >
              Rafraîchir
          </button>

          <button
            style={{
              background: "#48c6ef",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              borderRadius: 13,
              padding: "11px 26px",
              fontSize: 15,
              cursor: "pointer",
            }}
            onClick={openCreateModal}
          >
            Nouveau RDV
          </button>
        </div>
      </div>

      {loading && <div>Chargement ..</div>}
      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      {!loading && !error && (
        <>
          {filteredItems.length === 0 ? (
            <div>Aucun rendez-vous trouvé.</div>
          ) : (
            <Table
              columns={columns}
              data={pagedItems}
              searchable={false}
              searchValue={search}
              onSearchChange={setSearch}
              actions={actions}
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
                {selected.length} Rendez-vous sélectionné(s)
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
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Supprimer les rendez-vous sélectionnés ?"
                      )
                    )
                      return;
                    try {
                      setLoadingMutations((prev) => ({
                        ...prev,
                        bulk_delete: true, // Marquer comme en cours
                      }));

                      await Promise.all(
                        selected.map((id) =>
                          fetch(`http://127.0.0.1:8000/api/rendez-vous/${id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          }).then((res) => {
                            if (!res.ok)
                              throw new Error(
                                `Erreur suppression rendez-vous id ${id}`
                              );
                          })
                        )
                      );
                      setItems((items) =>
                        items.filter((rdv) => !selected.includes(rdv.id))
                      );
                      setSelected([]);
                    } catch (err) {
                      console.error(err);
                      setError(
                        "Erreur lors de la suppression d'un ou plusieurs rendez-vous."
                      );
                    } finally {
                      setLoadingMutations((prev) => ({
                        ...prev,
                        bulk_delete: false,
                      }));
                    }
                  }}
                  disabled={loadingMutations.bulk_delete}
                >
                  {loadingMutations.bulk_delete ? (
                    <>
                      <Spinner size={14} color="#b2b2b2" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer"
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submitForm}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Patient</label>
            <select
              className="custom-input"
              value={form.patient_id}
              onChange={(e) => handleFormChange("patient_id", e.target.value)}
            >
              <option value="">Sélectionner un patient</option>
              {patients.map((p) => {
                const u = p.user || {};
                const label =
                  (u.name && u.name.trim()) ||
                  (u.email && u.email.trim()) ||
                  `Patient #${p.id}`;
                return (
                  <option key={p.id} value={p.id}>
                    {label} {u.surname || ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Médecin</label>
            <select
              className="custom-input"
              value={form.medecin_id}
              onChange={(e) => handleFormChange("medecin_id", e.target.value)}
            >
              <option value="">Sélectionner un médecin</option>
              {medecins.map((m) => {
                const u = m.user || {};
                const label =
                  (u.name && u.name.trim()) ||
                  (u.email && u.email.trim()) ||
                  `Médecin #${u.id}`;
                return (
                  <option key={m.id} value={u.id}>
                    {label} {u.surname || ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date</label>
              <Input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Heure</label>
              <Input
                type="time"
                name="time"
                value={form.time}
                onChange={(e) => handleFormChange("time", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Statut</label>
            <select
              className="custom-input"
              value={form.statut}
              onChange={(e) => handleFormChange("statut", e.target.value)}
            >
              <option value="planned">Planifié</option>
              <option value="confirme">Confirmé</option>
              <option value="annule">Annulé</option>
              <option value="termine">Terminé</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Motif</label>
            <Input
              type="text"
              name="motif"
              placeholder="Motif du rendez-vous"
              value={form.motif}
              onChange={(e) => handleFormChange("motif", e.target.value)}
            />
          </div>

          {formError && (
            <div style={{ color: "red", marginBottom: 12 }}>{formError}</div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                background: "#f5f5f5",
                border: "none",
                borderRadius: 10,
                padding: "8px 18px",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                background: "#48c6ef",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 22px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {formLoading ? (
                <>
                  <Spinner size={14} color="#fff" />
                  En cours...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </Modal>
      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, title: "", message: "" })}
      />
      <Dialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || "Confirmer"}
        cancelText={confirmDialog.cancelText || "Annuler"}
        confirmColor={confirmDialog.confirmColor}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmStatusChange}
        onCancel={() =>
          setConfirmDialog({
            isOpen: false,
            pendingRow: null,
            pendingStatus: null,
          })
        }
      />
    </Layout>
  );
}
