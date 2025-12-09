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
import Modal from "../components/ui/Modal/Modal";
import Input from "../components/ui/Input/Input";
import Toast from "../components/ui/Toast/Toast";
import { useToast } from "../hooks/useToast";

// Icons
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

const iconDme = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
    <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h6" />
  </svg>
);

// Icône salle d'attente
const iconWaiting = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="8" r="3" />
    <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
    <path d="M4 8h2M18 8h2" />
  </svg>
);

// Fonction pour calculer l’âge à partir de la date de naissance
function getAge(dateString) {
  if (!dateString) return "";
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function Patients() {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { toast, showToast, hideToast } = useToast();

  // état modal salle d’attente
  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [waitingForm, setWaitingForm] = useState({
    patientId: null,
    patientName: "",
    medecinId: "",
    date: "",
    time: "",
    motif: "",
  });
  const [waitingError, setWaitingError] = useState("");
  const [waitingLoading, setWaitingLoading] = useState(false);

  // Filtrage par recherche
  const filteredPatients = patients.filter((p) =>
    (
      (p.user?.name || "") +
      " " +
      (p.user?.surname || "") +
      " " +
      (p.user?.email || "") +
      " " +
      (getAge(p.date_naissance) || "")
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const totalItems = filteredPatients.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedPatients = filteredPatients.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    // patients
    fetch("http://127.0.0.1:8000/api/patients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPatients(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les patients.");
        setLoading(false);
      });

    // médecins
    fetch("http://127.0.0.1:8000/api/medecins", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // si ton API renvoie { data: [...] } au lieu de [...]
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
        setMedecins(list);
      })
      .catch(() => {
        console.error("Erreur chargement médecins");
        setMedecins([]); // garantir un tableau
      });
  }, [token]);

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
            filteredPatients.length > 0 &&
            filteredPatients.every((u) => selected.includes(u.id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelected(filteredPatients.map((u) => u.id));
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
      key: "user.name",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            src={
              row.user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${
                row.user?.name || ""
              }`
            }
            size={36}
            alt={row.user?.name || ""}
          />
          <span>
            {row.user?.name} {row.user?.surname}
          </span>
        </div>
      ),
    },
    {
      label: "Email",
      key: "user.email",
      render: (_, row) => row.user?.email || "",
    },
    {
      label: "Téléphone",
      key: "user.telephone",
      render: (_, row) => row.user?.telephone || "",
    },
    { label: "Âge", key: "date_naissance", render: getAge },
  ];

  const handleWaitingChange = (name, value) => {
    setWaitingForm((f) => ({ ...f, [name]: value }));
  };

  const submitWaitingForm = async (e) => {
    e.preventDefault();
    setWaitingError("");

    if (!waitingForm.medecinId || !waitingForm.date || !waitingForm.time || !waitingForm.motif) {
      setWaitingError("Veuillez choisir un médecin, une date , heure et saisir le motif.");
      return;
    }

    const dateHeure = `${waitingForm.date} ${waitingForm.time}:00`;

    try {
      setWaitingLoading(true);
      const res = await fetch("http://127.0.0.1:8000/api/salle-attente", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: waitingForm.patientId,
          medecin_id: waitingForm.medecinId,
          date_heure: dateHeure,
          motif: waitingForm.motif,
        }),
      });
      const text = await res.text();
      console.log("POST /salle-attente status", res.status);
      console.log("POST /salle-attente raw body", text);
      console.log("payload salle-attente", {
        patient_id: waitingForm.patientId,
        medecin_id: waitingForm.medecinId,
        date_heure: dateHeure,
        motif: waitingForm.motif,
      });

      if (!res.ok) {
        console.error(await res.json());
        setWaitingError("Erreur lors de l'ajout en salle d'attente.");
      } else {
        setWaitingModalOpen(false);

        showToast({
          type: "success",
          title: "Succès",
          message: `Le patient ${waitingForm.patientName} a été ajouté à la salle d'attente avec succès.`,
        });
      }
    } catch (err) {
      console.error(err);
      setWaitingError("Erreur réseau.");
    } finally {
      setWaitingLoading(false);
    }
  };

  const actions = [
    {
      label: "Edit",
      icon: iconEdit,
      handler: (row) => navigate(`/patients/${row.id}/edit`),
    },
    {
      label: "Show",
      icon: iconShow,
      handler: (row) => navigate(`/patients/${row.id}`),
    },
    {
      label: "Salle d'attente",
      icon: iconWaiting,
      handler: (row) => {
        const fullname = `${row.user?.name || ""} ${
          row.user?.surname || ""
        }`.trim();
        setWaitingForm({
          patientId: row.id,
          patientName: fullname,
          medecinId: "",
          date: "",
          time: "",
          motif: "",
        });
        setWaitingError("");
        setWaitingModalOpen(true);
      },
    },
  ];

  return (
    <Layout>
      <h2>Liste des patients</h2>
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
          <Filter placeholder="Recherche patient..." onFilter={setSearch} />
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
            onClick={() => navigate("/patients/create")}
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
          data={pagedPatients}
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
            {selected.length} Patient(s) sélectionné(s)
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
                try {
                  await Promise.all(
                    selected.map((id) =>
                      fetch(`http://127.0.0.1:8000/api/patients/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      }).then((res) => {
                        if (!res.ok)
                          throw new Error(
                            `Erreur suppression patient id ${id}`
                          );
                      })
                    )
                  );
                  setPatients((items) =>
                    items.filter((p) => !selected.includes(p.id))
                  );
                  setSelected([]);
                } catch (error) {
                  setError(
                    "Erreur lors de la suppression d'un ou plusieurs patients."
                  );
                  console.error(error);
                }
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
          setCurrentPage(1);
        }}
      />

      {/* Modal Salle d'attente */}
      <Modal
        isOpen={waitingModalOpen}
        title="Ajouter à la salle d'attente"
        onClose={() => setWaitingModalOpen(false)}
      >
        <form onSubmit={submitWaitingForm}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Patient</label>
            <Input
              type="text"
              name="patientName"
              value={waitingForm.patientName}
              disabled
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Médecin</label>
            <select
              className="custom-input"
              value={waitingForm.medecinId}
              onChange={(e) => handleWaitingChange("medecinId", e.target.value)}
            >
              <option value="">Sélectionner un médecin</option>
              {Array.isArray(medecins) &&
                medecins.map((m) => {
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
                value={waitingForm.date}
                onChange={(e) => handleWaitingChange("date", e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Heure</label>
              <Input
                type="time"
                name="time"
                value={waitingForm.time}
                onChange={(e) => handleWaitingChange("time", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Motif</label>
            <Input
              type="text"
              name="motif"
              placeholder="Motif de la consultation"
              value={waitingForm.motif}
              onChange={(e) => handleWaitingChange("motif", e.target.value)}
              required
            />
          </div>

          {waitingError && (
            <div style={{ color: "red", marginBottom: 12 }}>{waitingError}</div>
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
              onClick={() => setWaitingModalOpen(false)}
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
              disabled={waitingLoading}
              style={{
                background: "#2979ff",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 22px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {waitingLoading ? "En cours..." : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
      {toast.visible && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </Layout>
  );
}
