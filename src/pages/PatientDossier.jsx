import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import { useAuth } from "../context/AuthContext";

const BASE = "http://127.0.0.1:8000";
const API = `${BASE}/api`;

function safeJsonParse(txt) {
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function formatDateTime(d) {
  if (!d) return "—";
  return String(d).replace("T", " ").slice(0, 16);
}

function formatDate(d) {
  if (!d) return "—";
  const s = String(d).slice(0, 10); // YYYY-MM-DD
  const [y, m, day] = s.split("-");
  if (!y || !m || !day) return s;
  return `${day}/${m}/${y}`; // DD/MM/YYYY
}

function calcImc(poids, taille) {
  const p = Number(poids);
  const t = Number(taille);
  if (!p || !t) return null;
  const meters = t > 3 ? t / 100 : t;
  if (!meters) return null;
  const imc = p / (meters * meters);
  if (!isFinite(imc)) return null;
  return Math.round(imc * 10) / 10;
}

function getInitials(patient) {
  const n = patient?.user?.name || patient?.name || "";
  const s = patient?.user?.surname || patient?.surname || "";
  const txt = `${n} ${s}`.trim();
  if (!txt) return "P";
  const parts = txt.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "P";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function getAgeFromPatient(patient) {
  const raw =
    patient?.date_naissance ||
    patient?.birth_date ||
    patient?.user?.date_naissance ||
    patient?.user?.birth_date ||
    null;
  if (!raw) return null;
  const dob = new Date(raw);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

const iconTrash = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {/* background */}
    <rect x="0" y="0" width="24" height="24" rx="10" fill="#f3f4f6" />
    {/* icon */}
    <path d="M3 6h18" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2" stroke="#9ca3af" strokeWidth="2" strokeLinejoin="round" />
    <path d="M7 6l1 14h8l1-14" stroke="#9ca3af" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 11v6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 11v6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const iconPrint = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 8V4h10v4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M7 17h10v3H7v-3z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6 9h12a2 2 0 012 2v5h-3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M4 16H3v-5a2 2 0 012-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M17 12h.01"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const iconBack = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 18l-6-6 6-6"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const iconInfo = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2a10 10 0 100 20 10 10 0 000-20z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 10v7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 7h.01"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const iconUpload = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v10" stroke="#b2b2b2" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 7l4-4 4 4"
      stroke="#b2b2b2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 14v6h16v-6"
      stroke="#b2b2b2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

const iconFile = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 2v6h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export default function PatientDossier() {
  const { token } = useAuth();
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [patient, setPatient] = useState(null);
  const [dmeId, setDmeId] = useState(null);
  const [dme, setDme] = useState(null);

  const [consultations, setConsultations] = useState([]);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);

  const [analyses, setAnalyses] = useState([]);
  const [examens, setExamens] = useState([]);

  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);

  // mode: "edit" | "view"
  const [resultModal, setResultModal] = useState({
    open: false,
    mode: "edit",
    kind: null, // "analyse" | "examen"
    item: null,
    resultat: "",
    remarques: "",
    file: null,
    removeExistingFile: false, // ✅ nouveau : demander suppression du PDF existant (si BE le supporte)
    submitting: false,
  });

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }, [token]);

  const pendingAnalyses = useMemo(() => {
    return (analyses || []).filter(
      (a) => (a?.etat || "en_attente") === "en_attente",
    );
  }, [analyses]);

  const pendingExamens = useMemo(() => {
    return (examens || []).filter(
      (e) => (e?.etat || "en_attente") === "en_attente",
    );
  }, [examens]);

  const selectedConsultation = useMemo(() => {
    if (!selectedConsultationId) return consultations?.[0] || null;
    return (
      consultations.find(
        (c) => String(c.id) === String(selectedConsultationId),
      ) || null
    );
  }, [consultations, selectedConsultationId]);

  const antecedents = useMemo(() => {
    const a =
      dme?.antecedentsMedicaux ||
      dme?.antecedents ||
      dme?.antecedants ||
      patient?.antecedents ||
      patient?.antecedants ||
      [];
    return Array.isArray(a) ? a : [];
  }, [dme, patient]);

  const consultationExamens = useMemo(() => {
    const cid = selectedConsultation?.id;
    const byEndpoint = Array.isArray(examens)
      ? examens.filter((e) =>
          cid != null && e?.consultation_id != null
            ? String(e.consultation_id) === String(cid)
            : false,
        )
      : [];
    const byEmbedded = Array.isArray(selectedConsultation?.examens)
      ? selectedConsultation.examens
      : [];
    return byEndpoint.length ? byEndpoint : byEmbedded;
  }, [examens, selectedConsultation]);

  const consultationAnalyses = useMemo(() => {
    const cid = selectedConsultation?.id;
    const byEndpoint = Array.isArray(analyses)
      ? analyses.filter((a) =>
          cid != null && a?.consultation_id != null
            ? String(a.consultation_id) === String(cid)
            : false,
        )
      : [];
    const byEmbedded = Array.isArray(selectedConsultation?.analyses)
      ? selectedConsultation.analyses
      : [];
    return byEndpoint.length ? byEndpoint : byEmbedded;
  }, [analyses, selectedConsultation]);

  // ✅ Ordonnance: on affiche les LIGNES (ordonnance_lignes) liées à la consultation
const ordonnanceItems = useMemo(() => {
  const cid = selectedConsultation?.id;

  // 1) Ordonnance rattachée directement à la consultation (hasOne) => objet { lignes: [...] }
  const ordObj = selectedConsultation?.ordonnance || null;
  const fromConsultation =
    ordObj && Array.isArray(ordObj?.lignes) ? ordObj.lignes : [];

  // 2) Ordonnances rattachées au DME (hasMany) => on filtre par consultation_id et on prend les lignes
  const dmeOrds = Array.isArray(dme?.ordonnances) ? dme.ordonnances : [];
  const fromDmeOrdonnances =
    cid != null
      ? dmeOrds
          .filter((o) =>
            o?.consultation_id != null
              ? String(o.consultation_id) === String(cid)
              : false
          )
          .flatMap((o) => (Array.isArray(o?.lignes) ? o.lignes : []))
      : [];

  // 3) Fallback: anciens champs éventuels (si tu renvoies déjà une liste de médicaments ailleurs)
  const directFallback =
    selectedConsultation?.ordonnances ||
    selectedConsultation?.prescriptions ||
    selectedConsultation?.medicaments ||
    selectedConsultation?.traitements ||
    [];

  const fallbackArr = Array.isArray(directFallback) ? directFallback : [];

  // merge + remove duplicates
  const merged = [...fromConsultation, ...fromDmeOrdonnances, ...fallbackArr];

  const seen = new Set();
  const out = [];
  for (const it of merged) {
    const k = it?.id != null ? `id:${it.id}` : JSON.stringify(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}, [selectedConsultation, dme]);

  const load = async () => {
    if (!token || !patientId) return;

    try {
      setLoading(true);
      setError("");

      const resP = await fetch(`${API}/patients/${patientId}`, {
        headers: authHeaders,
      });
      const txtP = await resP.text();
      if (!resP.ok) throw new Error("Impossible de charger le patient.");
      const p = safeJsonParse(txtP);
      setPatient(p);

      const maybeDmeId =
        p?.dme_id ||
        p?.dme?.id ||
        p?.dossier?.id ||
        p?.data?.dme_id ||
        p?.data?.dme?.id ||
        null;

      if (!maybeDmeId) {
        setDmeId(null);
        setDme(null);
        setConsultations([]);
        setAnalyses([]);
        setExamens([]);
        setSelectedConsultationId(null);
        return;
      }
      setDmeId(maybeDmeId);

      const resD = await fetch(`${API}/dmes/${maybeDmeId}`, {
        headers: authHeaders,
      });
      const txtD = await resD.text();
      if (!resD.ok)
        throw new Error("Impossible de charger le dossier médical (DME).");
      const d = safeJsonParse(txtD);
      setDme(d);

      const cons = Array.isArray(d?.consultations) ? d.consultations : [];
      cons.sort((a, b) => {
        const da = new Date(
          a?.created_at || a?.date || a?.date_consultation || 0,
        ).getTime();
        const db = new Date(
          b?.created_at || b?.date || b?.date_consultation || 0,
        ).getTime();
        return db - da;
      });

      setConsultations(cons);
      setSelectedConsultationId((prev) => prev ?? cons?.[0]?.id ?? null);

      const [resA, resE] = await Promise.all([
        fetch(`${API}/dmes/${maybeDmeId}/analyses`, { headers: authHeaders }),
        fetch(`${API}/dmes/${maybeDmeId}/examens`, { headers: authHeaders }),
      ]);

      const txtA = await resA.text();
      const txtE = await resE.text();

      setAnalyses(resA.ok ? safeJsonParse(txtA) || [] : []);
      setExamens(resE.ok ? safeJsonParse(txtE) || [] : []);
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, patientId]);

  const openEditResultModal = (kind, item) => {
    setError("");
    setResultModal({
      open: true,
      mode: "edit",
      kind,
      item,
      resultat: item?.resultat || "",
      remarques: item?.remarques || "",
      file: null,
      removeExistingFile: false,
      submitting: false,
    });
  };

  const closeResultModal = () => {
    setResultModal({
      open: false,
      mode: "edit",
      kind: null,
      item: null,
      resultat: "",
      remarques: "",
      file: null,
      removeExistingFile: false,
      submitting: false,
    });
  };

  const fileUrlFromPath = (path) => {
    if (!path) return null;
    return `${BASE}/storage/${path}`;
  };

  const deleteResultFile = async () => {
    const { kind, item } = resultModal;
    if (!kind || !item?.id) return;
    if (!item?.result_file_path) return;

    const ok = window.confirm("Supprimer le document PDF actuel ?");
    if (!ok) return;

    try {
      setBusy(true);
      setError("");

      const delRes = await fetch(`${API}/${kind}s/${item.id}/file`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const delTxt = await delRes.text();
      if (!delRes.ok) {
        console.error("delete file error:", delRes.status, delTxt);
        throw new Error("Erreur lors de la suppression du PDF.");
      }

      // ✅ Met à jour l'item affiché dans le modal (sans fermer)
      setResultModal((m) => ({
        ...m,
        item: {
          ...m.item,
          result_file_path: null,
          result_file_original_name: null,
          result_file_mime: null,
          result_file_size: null,
        },
        file: null,
        removeExistingFile: false,
      }));

      // ✅ Refresh tableaux (examens/analyses)
      await load();
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  };

  const submitResult = async () => {
    const { kind, item, resultat, remarques, file, mode, removeExistingFile } =
      resultModal;
    if (mode === "view") return; // sécurité
    if (!kind || !item?.id) return;

    const hasText = String(resultat || "").trim() !== "";
    const hasFile = !!file;
    const hasRem = String(remarques || "").trim() !== "";

    if (!hasText && !hasFile && !hasRem) {
      setError("Saisissez un résultat, une remarque, ou joignez un PDF.");
      return;
    }

    // petit garde-fou UI
    if (removeExistingFile && hasFile) {
      // pas forcément une erreur, mais c’est ambigu : supprimer et upload en même temps
      // on choisit : upload remplace
      // donc on désactive suppression si un nouveau fichier est choisi
      // (ou laisser tel quel, mais ici on corrige proprement)
    }

    try {
      setResultModal((m) => ({ ...m, submitting: true }));
      setBusy(true);
      setError("");

      // 1) upload si nouveau fichier choisi
      if (hasFile) {
        const fd = new FormData();
        fd.append("file", file);

        const upRes = await fetch(`${API}/${kind}s/${item.id}/file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        const upTxt = await upRes.text();
        if (!upRes.ok) {
          console.error("upload file error:", upRes.status, upTxt);
          throw new Error("Erreur lors de l’upload du PDF.");
        }
      }

      // 2) update texte + éventuellement "détacher" fichier existant si demandé
      if (hasText || hasRem || removeExistingFile) {
        const payload = {
          resultat: hasText ? resultat.trim() : null,
          remarques: hasRem ? remarques.trim() : null,
          etat: "termine",
        };

        const putRes = await fetch(`${API}/${kind}s/${item.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const putTxt = await putRes.text();
        if (!putRes.ok) {
          console.error("update result error:", putRes.status, putTxt);
          const maybe = safeJsonParse(putTxt);

          // message plus clair si suppression demandée
          if (removeExistingFile && !hasFile) {
            throw new Error(
              maybe?.message ||
                "Le backend ne supporte pas la suppression du PDF via PUT. Ajoute un endpoint DELETE ou un champ clear_file côté serveur.",
            );
          }

          throw new Error(
            maybe?.message || "Erreur lors de l’enregistrement du résultat.",
          );
        }
      }

      closeResultModal();
      await load();
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
    } finally {
      setBusy(false);
      setResultModal((m) => ({ ...m, submitting: false }));
    }
  };

  const printOrdonnance = () => {
    const title = "Ordonnance";
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;

    const rowsHtml = ordonnanceItems
      .map((it, idx) => {
        const nom =
          it?.medicament?.nom ||
          it?.medicament?.libelle ||
          it?.medicament?.name ||
          it?.medicament ||
          it?.nom ||
          it?.libelle ||
          it?.name ||
          it?.produit ||
          it?.medicament_nom ||
          `Médicament ${idx + 1}`;

        // OrdonnanceLigne: dosage + frequence + instructions
        const dosage = it?.dosage || it?.dose || it?.posologie || it?.dosage_mg || "";
        const freq = it?.frequence || it?.frequency || "";
        const instr = it?.instructions || it?.instruction || it?.note || it?.commentaire || "";

        const pos = [dosage, freq].filter(Boolean).join(" • ") || "";
        const duree = it?.duree || it?.duration || "";
        const note = instr || "";

        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;"><b>${nom}</b></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${pos}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${duree}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${note}</td>
        </tr>`;
      })
      .join("");


    const dateCons =
      selectedConsultation?.date_consultation ||
      selectedConsultation?.created_at ||
      selectedConsultation?.date ||
      null;

    const patientNameLocal = patient?.user?.name
      ? `${patient.user.name || ""} ${patient.user.surname || ""}`.trim()
      : `Patient #${patientId}`;

    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="margin:0 0 6px 0;">${title}</h2>
          <div style="color:#6b7280; font-size: 13px; margin-bottom: 14px;">
            Patient: <b>${patientNameLocal}</b>
            ${dateCons ? ` • Consultation: <b>${formatDate(dateCons)}</b>` : ""}
          </div>

          ${
            ordonnanceItems.length
              ? `
              <table style="width:100%; border-collapse:collapse; font-size: 13px;">
                <thead>
                  <tr style="text-align:left;">
                    <th style="padding:8px;border-bottom:2px solid #111827;">Médicament</th>
                    <th style="padding:8px;border-bottom:2px solid #111827;">Posologie</th>
                    <th style="padding:8px;border-bottom:2px solid #111827;">Durée</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            `
              : `<div>Aucune ordonnance.</div>`
          }

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 200);
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const fieldRow = (label, value) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "170px 1fr",
        gap: 10,
        padding: "6px 0",
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "#111827" }}>{value ?? "—"}</div>
    </div>
  );

  const cardStyle = {
    background: "#fff",
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 14,
  };

  const sectionTitle = (t) => (
    <div
      style={{
        marginTop: 16,
        marginBottom: 8,
        fontWeight: 700,
        color: "#111827",
      }}
    >
      {t}
    </div>
  );

  const pill = (text, color = "#6b7280", bg = "#f3f4f6") => (
    <span
      style={{
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
      }}
    >
      {text}
    </span>
  );

  const actionsBtn = (label, onClick, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? "#e5e7eb" : "#48c6ef",
        color: disabled ? "#6b7280" : "#fff",
        border: "none",
        borderRadius: 10,
        padding: "8px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const iconBtn = (title, onClick, disabled, child) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#f3f4f6" : "#f3f4f6",
        color: disabled ? "#9ca3af" : "#9ca3af",
        border: "none",
        borderRadius: 10,
        width: 34,
        height: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {child}
    </button>
  );

  const drawerLabelValue = (label, value) => (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {label}
      </div>
      <div
        style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}
      >
        {value ?? "—"}
      </div>
    </div>
  );

  const tableTh = {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #eef2f7",
    color: "#111827",
    fontWeight: 800,
    fontSize: 12,
  };

  const tableTd = {
    padding: 10,
    borderBottom: "1px solid #eef2f7",
    fontWeight: 700,
    fontSize: 12,
    color: "#111827",
    verticalAlign: "top",
  };

  if (!token) return <Navigate to="/login" />;

  const patientName = patient?.user?.name
    ? `${patient.user.name || ""} ${patient.user.surname || ""}`.trim()
    : `Patient #${patientId}`;

  const patientAge = getAgeFromPatient(patient);

  return (
    <Layout>
      {/* Drawer (Infos patient) — sans overlay/backdrop */}
      <div
        aria-hidden={!patientDrawerOpen}
        style={{
          position: "fixed",
          inset: "0 auto 0 0",
          width: 360,
          transform: patientDrawerOpen ? "translateX(0)" : "translateX(-102%)",
          transition: "transform 220ms ease",
          zIndex: 9999,
          background: "grey",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "8px 0 24px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          pointerEvents: patientDrawerOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "rgba(72,198,239,0.16)",
                border: "1px solid rgba(72,198,239,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 1000,
                color: "#e5f6ff",
                flex: "0 0 auto",
              }}
              title={patientName}
            >
              {getInitials(patient)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 1000,
                  color: "#fff",
                  fontSize: 14,
                  lineHeight: 1.1,
                }}
              >
                {patientName}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.70)",
                  fontWeight: 600,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {patientAge != null ? `${patientAge} ans` : "Âge —"}
                {dmeId ? ` • DME #${dmeId}` : ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPatientDrawerOpen(false)}
            aria-label="Fermer infos patient"
            title="Fermer"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.14)",
              width: 34,
              height: 34,
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 1000,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 16, overflowY: "auto" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 1000, color: "#fff", marginBottom: 10 }}>
              Informations
            </div>

            {drawerLabelValue("Nom", patientName)}
            {drawerLabelValue("Email", patient?.user?.email || "—")}
            {drawerLabelValue("Téléphone", patient?.user?.telephone || "—")}
            {drawerLabelValue("Groupe sanguin", dme?.groupe_sanguin || "—")}
          </div>

          <div style={{ height: 12 }} />

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 1000, color: "#fff" }}>Historique</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.70)",
                }}
              >
                {consultations.length} consultation(s)
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {consultations.length === 0 ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.70)",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Aucune consultation.
                </div>
              ) : (
                consultations.map((c) => {
                  const selected =
                    String(c.id) === String(selectedConsultation?.id);
                  const d =
                    c?.date_consultation ||
                    c?.date ||
                    c?.created_at ||
                    c?.updated_at ||
                    null;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedConsultationId(c.id);
                        setPatientDrawerOpen(false);
                      }}
                      style={{
                        textAlign: "left",
                        border: selected
                          ? "1px solid rgba(72,198,239,0.55)"
                          : "1px solid rgba(255,255,255,0.10)",
                        background: selected
                          ? "rgba(72,198,239,0.10)"
                          : "rgba(0,0,0,0.15)",
                        borderRadius: 14,
                        padding: 10,
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: 1000, fontSize: 12 }}>
                        {formatDate(d)}
                        <span
                          style={{
                            marginLeft: 8,
                            fontWeight: 700,
                            color: "rgba(238, 45, 45, 0.7)",
                          }}
                        >
                          • {String(c?.motif || "").trim() ? c.motif : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Retour"
            aria-label="Retour"
          >
            {iconBack}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => setPatientDrawerOpen(true)}
            style={{
              background: "grey",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 1000,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 20px rgba(17,24,39,0.12)",
            }}
            title="Afficher les informations du patient"
          >
            <span style={{ display: "inline-flex", color: "#fff" }}>
              {iconInfo}
            </span>
            Infos
          </button>

          {pendingAnalyses.length + pendingExamens.length > 0
            ? pill(
                `${pendingAnalyses.length + pendingExamens.length} résultat(s) en attente`,
                "#92400e",
                "#ffedd5",
              )
            : pill("Aucun résultat en attente", "#065f46", "#d1fae5")}
        </div>
      </div>

      {loading && <div>Chargement...</div>}
      {error && (
        <div style={{ color: "red", fontWeight: 700, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!loading && !dmeId && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Aucun DME trouvé
          </div>
          <div style={{ color: "#6b7280", fontWeight: 700 }}>
            Ce patient n’a pas encore de dossier médical dans le système.
          </div>
        </div>
      )}

      {!loading && dmeId && (
        <div
          style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}
        >
          {/* Colonne gauche */}
          <div style={{ ...cardStyle, height: "fit-content" }}>
            {consultations.length === 0 ? (
              <div style={{ color: "#6b7280", fontWeight: 700 }}>
                Aucune consultation.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {consultations.map((c) => {
                  const d =
                    c?.date_consultation ||
                    c?.date ||
                    c?.created_at ||
                    c?.updated_at ||
                    null;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConsultationId(c.id)}
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        outline: "none",
                        borderRadius: 12,
                        padding: "10px 10px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 1000, fontSize: 13 }}>
                        Consultation le {formatDate(d)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div>
            <div style={cardStyle}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontWeight: 1000, fontSize: 18, marginBottom: 20 }}
                >
                  Dossier médical
                </div>
              </div>

              {selectedConsultation ? (
                <>
                  {sectionTitle("Motif / Diagnostic")}
                  {fieldRow("Motif", selectedConsultation?.motif || "—")}
                  {fieldRow(
                    "Diagnostic",
                    selectedConsultation?.diagnostic || "—",
                  )}

                  {sectionTitle("Signes vitaux")}
                  {fieldRow("Poids", selectedConsultation?.poids ?? "—")}
                  {fieldRow("Taille", selectedConsultation?.taille ?? "—")}
                  {fieldRow(
                    "IMC",
                    calcImc(
                      selectedConsultation?.poids,
                      selectedConsultation?.taille,
                    ) ?? "—",
                  )}
                  {fieldRow(
                    "Température",
                    selectedConsultation?.temperature ?? "—",
                  )}
                  {fieldRow(
                    "Fréquence",
                    selectedConsultation?.frequence_cardiaque ?? "—",
                  )}
                  {fieldRow(
                    "Pression artérielle",
                    selectedConsultation?.pression_arterielle ?? "—",
                  )}

                  {sectionTitle("Observation")}
                  <div
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedConsultation?.observation ||
                      selectedConsultation?.observations ||
                      "—"}
                  </div>

                  {sectionTitle("Traitement")}
                  <div
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedConsultation?.traitement || "—"}
                  </div>
                </>
              ) : (
                <div style={{ color: "#6b7280", fontWeight: 700 }}>
                  Sélectionnez une consultation.
                </div>
              )}
            </div>

            {/* Antécédents */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>Antécédents</div>

              {antecedents.length === 0 ? (
                <div
                  style={{ marginTop: 10, color: "#6b7280", fontWeight: 700 }}
                >
                  Aucun antécédent enregistré.
                </div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th style={tableTh}>Type</th>
                        <th style={tableTh}>Description</th>
                        <th style={tableTh}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {antecedents.map((a, idx) => (
                        <tr key={a?.id ?? idx}>
                          <td style={tableTd}>
                            {a?.type ||
                              a?.categorie ||
                              a?.category ||
                              a?.libelle ||
                              "—"}
                          </td>
                          <td style={tableTd}>
                            {a?.description || a?.details || a?.label || "—"}
                          </td>
                          <td style={tableTd}>
                            {formatDate(
                              a?.date || a?.created_at || a?.updated_at || null,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Examens */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>Examens</div>

              {consultationExamens.length === 0 ? (
                <div
                  style={{ marginTop: 10, color: "#6b7280", fontWeight: 700 }}
                >
                  Aucun examen pour cette consultation.
                </div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th style={tableTh}>Type</th>
                        <th style={tableTh}>Date</th>
                        <th style={tableTh}>État</th>
                        <th style={{ ...tableTh, textAlign: "right" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultationExamens.map((e) => {
                        const etat = e?.etat || "en_attente";
                        const type = e?.type?.code
                          ? `${e.type.code} — ${e.type.libelle}`
                          : e?.type?.libelle || e?.type_examen?.libelle || "—";
                        const d =
                          e?.date_examen ||
                          e?.date ||
                          e?.created_at ||
                          e?.updated_at ||
                          null;
                        const pdfUrl = e?.result_file_path
                          ? fileUrlFromPath(e.result_file_path)
                          : null;

                        return (
                          <tr key={e.id}>
                            <td style={tableTd}>{type}</td>
                            <td style={tableTd}>{formatDateTime(d)}</td>
                            <td style={tableTd}>{etat}</td>
                            <td style={{ ...tableTd, textAlign: "right" }}>
                              {etat === "en_attente" ? (
                                actionsBtn(
                                  "Enregistrer résultat",
                                  () => openEditResultModal("examen", e),
                                  busy,
                                )
                              ) : (
                                <div style={{ display: "inline-flex", gap: 8 }}>
                                  {/* ✅ edit doit ouvrir en mode EDIT */}
                                  {iconBtn(
                                    "Modifier résultat",
                                    () => openEditResultModal("examen", e),
                                    false,
                                    iconEdit,
                                  )}
                                  {iconBtn(
                                    pdfUrl ? "Voir document" : "Aucun document",
                                    () => {
                                      if (pdfUrl)
                                        window.open(
                                          pdfUrl,
                                          "_blank",
                                          "noreferrer",
                                        );
                                    },
                                    !pdfUrl,
                                    iconFile,
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Analyses */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>Analyses</div>

              {consultationAnalyses.length === 0 ? (
                <div
                  style={{ marginTop: 10, color: "#6b7280", fontWeight: 700 }}
                >
                  Aucune analyse pour cette consultation.
                </div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th style={tableTh}>Type</th>
                        <th style={tableTh}>Date</th>
                        <th style={tableTh}>État</th>
                        <th style={{ ...tableTh, textAlign: "right" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultationAnalyses.map((a) => {
                        const etat = a?.etat || "en_attente";
                        const type =
                          a?.type_analyse?.libelle ||
                          a?.typeAnalyse?.libelle ||
                          a?.type?.libelle ||
                          "—";
                        const d =
                          a?.date_analyse ||
                          a?.date ||
                          a?.created_at ||
                          a?.updated_at ||
                          null;
                        const pdfUrl = a?.result_file_path
                          ? fileUrlFromPath(a.result_file_path)
                          : null;

                        return (
                          <tr key={a.id}>
                            <td style={tableTd}>{type}</td>
                            <td style={tableTd}>{formatDateTime(d)}</td>
                            <td style={tableTd}>{etat}</td>
                            <td style={{ ...tableTd, textAlign: "right" }}>
                              {etat === "en_attente" ? (
                                actionsBtn(
                                  "Enregistrer résultat",
                                  () => openEditResultModal("analyse", a),
                                  busy,
                                )
                              ) : (
                                <div style={{ display: "inline-flex", gap: 8 }}>
                                  {/* ✅ edit doit ouvrir en mode EDIT */}
                                  {iconBtn(
                                    "Modifier résultat",
                                    () => openEditResultModal("analyse", a),
                                    false,
                                    iconEdit,
                                  )}
                                  {iconBtn(
                                    pdfUrl ? "Voir document" : "Aucun document",
                                    () => {
                                      if (pdfUrl)
                                        window.open(
                                          pdfUrl,
                                          "_blank",
                                          "noreferrer",
                                        );
                                    },
                                    !pdfUrl,
                                    iconFile,
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ordonnance + impression */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 1000, fontSize: 16 }}>Ordonnance</div>
                <button
                  type="button"
                  onClick={printOrdonnance}
                  disabled={!ordonnanceItems.length}
                  title={
                    ordonnanceItems.length
                      ? "Imprimer l’ordonnance"
                      : "Aucune ordonnance"
                  }
                  style={{
                    background: ordonnanceItems.length ? "#f3f4f6" : "#f3f4f6",
                    color: ordonnanceItems.length ? "#9ca3af" : "#9ca3af",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 10px",
                    cursor: ordonnanceItems.length ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  {iconPrint}
                </button>
              </div>

              {ordonnanceItems.length === 0 ? (
                <div
                  style={{ marginTop: 10, color: "#6b7280", fontWeight: 700 }}
                >
                  Aucune ordonnance pour cette consultation.
                </div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th style={tableTh}>Médicament</th>
                        <th style={tableTh}>Posologie</th>
                        <th style={tableTh}>Durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordonnanceItems.map((it, idx) => {
                        const nom =
                          it?.medicament?.nom ||
                          it?.medicament?.libelle ||
                          it?.medicament?.name ||
                          it?.medicament ||
                          it?.nom ||
                          it?.libelle ||
                          it?.name ||
                          it?.produit ||
                          it?.medicament_nom ||
                          "";

                        const dosage = it?.dosage || it?.dose || it?.posologie || "";
                        const freq = it?.frequence || it?.frequency || "";
                        const pos = [dosage, freq].filter(Boolean).join(" • ") || "";
                        const duree = it?.duree || it?.duration || "";
                        const note =
                          it?.instructions ||
                          it?.instruction ||
                          it?.note ||
                          it?.commentaire ||
                          "";

                        return (
                          <tr key={it?.id ?? idx}>
                            <td style={tableTd}>{nom}</td>
                            <td style={tableTd}>{pos}</td>
                            <td style={tableTd}>{duree}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal résultat (edit/view) */}
      {resultModal.open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            zIndex: 50,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeResultModal();
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #eef2f7",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontWeight: 700,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {resultModal.kind === "analyse"
                    ? resultModal.item?.type_analyse?.libelle ||
                      resultModal.item?.typeAnalyse?.libelle ||
                      "—"
                    : resultModal.item?.type?.code
                      ? `${resultModal.item.type.code} — ${resultModal.item.type.libelle}`
                      : resultModal.item?.type?.libelle || "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeResultModal}
                aria-label="Fermer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {/* ✅ Nouveau layout demandé: Résultat à gauche (vertical), Remarques + Document à droite */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                  alignItems: "start",
                }}
              >
                {/* Colonne gauche : Résultat */}
                <div className="form-group">
                  <label className="form-label">Résultat </label>
                  <textarea
                    className="custom-input"
                    style={{
                      minHeight: 220,
                      padding: 10,
                      width: "97%",
                      resize: "vertical",
                    }}
                    value={resultModal.resultat}
                    disabled={resultModal.mode === "view"}
                    onChange={(e) =>
                      setResultModal((m) => ({
                        ...m,
                        resultat: e.target.value,
                      }))
                    }
                    placeholder="ex: Hb = 12.3 g/dL ..."
                  />
                </div>

                {/* Colonne droite : Remarques au-dessus + Document dessous */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div className="form-group">
                    <label className="form-label">Remarques</label>
                    <input
                      className="custom-input"
                      style={{ padding: 10, width: "94%" }}
                      value={resultModal.remarques}
                      disabled={resultModal.mode === "view"}
                      onChange={(e) =>
                        setResultModal((m) => ({
                          ...m,
                          remarques: e.target.value,
                        }))
                      }
                      placeholder="ex: contrôle dans 2 semaines ..."
                    />
                  </div>

                  {resultModal.mode === "edit" ? (
                    <div className="form-group">
                      <label className="form-label">Joindre PDF</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setResultModal((m) => ({
                            ...m,
                            file: e.target.files?.[0] || null,
                            // si un nouveau fichier est choisi, on annule la demande de suppression
                            removeExistingFile: e.target.files?.[0]
                              ? false
                              : m.removeExistingFile,
                          }))
                        }
                        style={{
                          width: "94%",
                          padding: 10,
                          border: "1px solid #eef2f7",
                          borderRadius: 10,
                        }}
                      />

                      {resultModal.file ? (
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              color: "#6b7280",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Fichier sélectionné :{" "}
                            <span style={{ color: "#111827" }}>
                              {resultModal.file.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setResultModal((m) => ({ ...m, file: null }))
                            }
                            title="Retirer le fichier sélectionné"
                            aria-label="Retirer le fichier sélectionné"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 4,
                            }}
                          >
                            {iconTrash}
                          </button>
                        </div>
                      ) : null}
                      {resultModal.item?.result_file_path ? (
                        <div style={{ marginTop: 10 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                color: "#6b7280",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              PDF actuel :{" "}
                              <a
                                href={fileUrlFromPath(
                                  resultModal.item.result_file_path,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#2563eb", fontWeight: 900 }}
                              >
                                {resultModal.item.result_file_original_name ||
                                  "Ouvrir"}
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={deleteResultFile}
                              disabled={busy || resultModal.submitting}
                              title="Supprimer le PDF actuel"
                              aria-label="Supprimer le PDF actuel"
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor:
                                  busy || resultModal.submitting
                                    ? "not-allowed"
                                    : "pointer",
                                color:
                                  busy || resultModal.submitting
                                    ? "#9ca3af"
                                    : "#ef4444",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 4,
                              }}
                            >
                              {iconTrash}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Document</label>
                      <div
                        style={{
                          padding: 10,
                          border: "1px solid #eef2f7",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        {resultModal.item?.result_file_path ? (
                          <a
                            href={fileUrlFromPath(
                              resultModal.item.result_file_path,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb", fontWeight: 900 }}
                          >
                            {resultModal.item?.result_file_original_name ||
                              "Ouvrir le PDF"}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {resultModal.mode === "edit" ? (
                  <button
                    type="button"
                    onClick={submitResult}
                    disabled={resultModal.submitting}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 14px",
                      cursor: resultModal.submitting
                        ? "not-allowed"
                        : "pointer",
                      fontWeight: 700,
                      opacity: resultModal.submitting ? 0.7 : 1,
                    }}
                  >
                    {resultModal.submitting
                      ? "Enregistrement..."
                      : "Enregistrer"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
