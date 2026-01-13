// src/pages/MedecinDashboard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import KpiCard from "../components/ui/KpiCard/KpiCard";
import Table from "../components/ui/Table/Table";
import Avatar from "../components/ui/Avatar/Avatar";
import Filter from "../components/ui/Filter/Filter";
import Pagination from "../components/ui/Pagination/Pagination";
import Toast from "../components/ui/Toast/Toast";
import Spinner from "../components/ui/Spinner/Spinner";

import "./MedecinDashboard.css";

const CalendarIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 2v3M17 2v3M3 9h18"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const UsersIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PlayIcon = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

function formatDateTimeFR(iso) {
  if (!iso) return "-";
  const clean = iso.replace("Z", "").replace(" ", "T").slice(0, 19);
  const [datePart, timePart] = clean.split("T");
  if (!datePart || !timePart) return iso;
  const year = datePart.slice(0, 4);
  const month = datePart.slice(5, 7);
  const day = datePart.slice(8, 10);
  const time = timePart.slice(0, 5);
  return `${day}/${month}/${year} ${time}`;
}

export default function MedecinDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [errorDash, setErrorDash] = useState("");

  // File UI
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [toast, setToast] = useState({
    type: "success",
    title: "",
    message: "",
  });

  const [startingId, setStartingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setErrorDash("");

      const res = await fetch("http://127.0.0.1:8000/api/medecin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("Dashboard API error:", res.status, txt);
        setErrorDash(`Erreur dashboard: ${res.status} - ${txt}`);
        return;
      }

      const json = txt ? JSON.parse(txt) : null;
      setData(json);
    } catch (e) {
      console.error(e);
      setErrorDash("Impossible de charger le dashboard médecin.");
    } finally {
      setLoadingDash(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoadingDash(true);
    loadDashboard();
  }, [token, loadDashboard]);

  // Auto-refresh (optionnel)
  useEffect(() => {
    if (!token) return;
    const t = setInterval(() => loadDashboard(), 5000);
    return () => clearInterval(t);
  }, [token, loadDashboard]);

  const startConsultation = async (row) => {
    try {
      setStartingId(row.id);

      const res = await fetch(
        `http://127.0.0.1:8000/api/medecin/salle-attente/${row.id}/start`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const txt = await res.text();
      if (!res.ok) {
        console.error("Start consultation error:", res.status, txt);
        setToast({
          type: "error",
          title: "Erreur",
          message: "Impossible de démarrer la consultation.",
        });
        return;
      }

      const resp = txt ? JSON.parse(txt) : null;

      setToast({
        type: "success",
        title: "OK",
        message: "Consultation démarrée.",
      });

      await loadDashboard();

      if (resp?.consultation_id) {
        navigate(`/consultations/${resp.consultation_id}`);
      }
    } catch (e) {
      console.error(e);
      setToast({
        type: "error",
        title: "Erreur réseau",
        message: "Une erreur réseau est survenue.",
      });
    } finally {
      setStartingId(null);
    }
  };

  // KPI
  const rdvToday = data?.kpis?.rdv_today ?? 0;
  const salleToday = data?.kpis?.salle_today ?? 0;

  // ✅ consultation en cours
  const current = data?.current_patient || null;
  const currentName = current?.patient?.user
    ? `${current.patient.user.name || ""} ${
        current.patient.user.surname || ""
      }`.trim()
    : "";
  const currentMotif = current?.motif || "";
  const currentConsultationId = current?.consultation_id || null;

  // ✅ Liste unique : en_attente + en_consultation
  const listAll = Array.isArray(data?.waiting_list) ? data.waiting_list : [];

  // Filtre recherche
  const filteredList = useMemo(() => {
    return listAll.filter((item) => {
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
  }, [listAll, search]);

  const totalItems = filteredList.length;
  const pageCount = Math.ceil(totalItems / perPage) || 1;
  const pagedItems = filteredList.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Statuts
  const statusMeta = {
    en_attente: { label: "En attente", color: "#fbbf24" },
    en_consultation: { label: "En consultation", color: "#60a5fa" },
  };

  const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
    color: meta.color,
  }));

  const handleStatusChange = async (row, newStatus) => {
    // dropdown -> si on passe à en_consultation : start ou resume
    if (newStatus === "en_consultation") {
      if (row?.statut === "en_consultation" && row?.consultation_id) {
        navigate(`/consultations/${row.consultation_id}`);
        return;
      }
      await startConsultation(row);
    }
  };

  // Colonnes
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
      label: "Statut",
      key: "statut",
      render: (value, row) => {
        const meta = statusMeta[value] || { label: value, color: "#e5e7eb" };
        const isRowStarting = startingId === row.id;

        return isRowStarting ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Spinner size={14} color={meta.color} />
            <span style={{ fontSize: 13, color: meta.color }}>...</span>
          </div>
        ) : (
          <Dropdown
            value={row.statut || "en_attente"}
            options={statusOptions}
            pillLabel={meta.label}
            pillColor={meta.color}
            onChange={(newStatus) => handleStatusChange(row, newStatus)}
          />
        );
      },
    },
    {
      label: "Date / Heure",
      key: "date_heure",
      render: (_, row) => formatDateTimeFR(row.date_heure),
    },
    {
      label: "Motif",
      key: "motif",
      render: (_, row) => <span>{row.motif || "-"}</span>,
    },
  ];

  // ✅ Action unique : Commencer / Reprendre selon statut
  const actions = [
    {
      label: "Action",
      icon: PlayIcon,
      handler: (row) => {
        if (row?.statut === "en_consultation") {
          if (row?.consultation_id) {
            navigate(`/consultations/${row.consultation_id}`);
          } else {
            startConsultation(row);
          }
        } else {
          startConsultation(row);
        }
      },
    },
  ];

  return (
    <Layout>
      <h2>Accueil</h2>

      <div className="medecin-kpi-row">
        <KpiCard
          title="Nbr de Rendez-vous"
          value={
            loadingDash ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner size={16} color="#fff" />
                Chargement...
              </div>
            ) : (
              rdvToday
            )
          }
          subtitle=""
          icon={CalendarIcon}
          variant="blue"
        />

        <KpiCard
          title="Nbr de patient dans la Salle d’attente"
          value={
            loadingDash ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner size={16} color="#fff" />
                Chargement...
              </div>
            ) : (
              salleToday
            )
          }
          subtitle=""
          icon={UsersIcon}
          variant="purple"
        />

        {/* ✅ 3e KPI "Consultation en cours" (même ligne) */}
        <div className="kpi-card kpi-current">
          <div className="kpi-card__top">
            <div className="kpi-card__title">Consultation en cours</div>
            <div className="kpi-card__icon"></div>
          </div>

          <div className="kpi-current__name">
            {loadingDash ? "..." : currentName || "Aucune"}
          </div>

          <div className="kpi-current__motif">
            {loadingDash ? "" : currentMotif ? `Motif : ${currentMotif}` : " "}
          </div>

          <button
            className={`kpi-current__btn ${
              currentConsultationId ? "pulse" : "disabled"
            }`}
            onClick={() => {
              if (currentConsultationId) {
                navigate(`/consultations/${currentConsultationId}`);
              }
            }}
            disabled={!currentConsultationId}
            title={
              currentConsultationId
                ? "Reprendre la consultation"
                : "Aucune consultation en cours"
            }
          >
            Reprendre <span className="kpi-current__btnIcon">{PlayIcon}</span>
          </button>
        </div>
      </div>

      {errorDash && (
        <div style={{ color: "red", fontWeight: "bold", marginTop: 10 }}>
          {errorDash}
        </div>
      )}

      {loadingDash && <div>Chargement ...</div>}

      {!loadingDash && (
        <>
          <h2 style={{ marginTop: 6 }}>File du jour</h2>

          {pagedItems.length === 0 ? (
            <div>Aucun patient en attente / en consultation aujourd'hui.</div>
          ) : (
            <Table
              columns={columns}
              data={pagedItems}
              searchable={false}
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
        </>
      )}

      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, title: "", message: "" })}
      />
    </Layout>
  );
}
