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
import Input from "../components/ui/Input/Input";
import Toast from "../components/ui/Toast/Toast";
import { useToast } from "../hooks/useToast";

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

const iconRdv = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M3 9h18" />
    <rect x="8" y="13" width="3" height="3" rx="0.5" />
    <rect x="13" y="13" width="3" height="3" rx="0.5" />
  </svg>
);

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
      .includes(search.toLowerCase()),
  );
  const totalItems = filteredPatients.length;
  const pageCount = Math.ceil(totalItems / perPage);
  const pagedPatients = filteredPatients.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  useEffect(() => {
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

    fetch("http://127.0.0.1:8000/api/medecins", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];
        setMedecins(list);
      })
      .catch(() => {
        console.error("Erreur chargement médecins");
        setMedecins([]);
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
                : sel.filter((id) => id !== row.id),
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

  const actions = [
    {
      label: "Edit",
      icon: iconEdit,
      handler: (row) => navigate(`/patients/${row.id}/edit`),
    },
    {
      label: "Dossier",
      icon: iconDme,
      handler: (row) => navigate(`/patients/${row.id}/dossier`),
    },
    {
      label: "Rendez-vous",
      icon: iconRdv,
      handler: (row) => {
        navigate(`/rendez-vous?patient_id=${row.id}`);
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
                            `Erreur suppression patient id ${id}`,
                          );
                      }),
                    ),
                  );
                  setPatients((items) =>
                    items.filter((p) => !selected.includes(p.id)),
                  );
                  setSelected([]);
                } catch (error) {
                  setError(
                    "Erreur lors de la suppression d'un ou plusieurs patients.",
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
