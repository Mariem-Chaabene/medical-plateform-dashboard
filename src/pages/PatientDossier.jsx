import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import { useAuth } from "../context/AuthContext";

/**
 * PatientDossier.jsx
 * Page "Dossier médical" (DME) : lecture + saisie des résultats (analyses/examens en attente)
 *
 * API (selon tes routes/controllers):
 * - GET    /api/patients/{id}
 * - GET    /api/dmes/{dmeId}
 * - GET    /api/dmes/{dmeId}/analyses
 * - GET    /api/dmes/{dmeId}/examens
 * - PUT    /api/analyses/{id}
 * - PUT    /api/examens/{id}
 * - POST   /api/analyses/{id}/file   (multipart, PDF)
 * - POST   /api/examens/{id}/file    (multipart, PDF)
 */

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
  return String(d).slice(0, 10);
}

function calcImc(poids, taille) {
  const p = Number(poids);
  const t = Number(taille);
  if (!p || !t) return null;
  // taille parfois en cm; si > 3 on suppose cm
  const meters = t > 3 ? t / 100 : t;
  if (!meters) return null;
  const imc = p / (meters * meters);
  if (!isFinite(imc)) return null;
  return Math.round(imc * 10) / 10;
}

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

  // Modal saisie résultat
  const [resultModal, setResultModal] = useState({
    open: false,
    kind: null, // "analyse" | "examen"
    item: null,
    resultat: "",
    remarques: "",
    file: null,
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
      (a) => (a?.etat || "en_attente") === "en_attente"
    );
  }, [analyses]);

  const pendingExamens = useMemo(() => {
    return (examens || []).filter(
      (e) => (e?.etat || "en_attente") === "en_attente"
    );
  }, [examens]);

  const selectedConsultation = useMemo(() => {
    if (!selectedConsultationId) return consultations?.[0] || null;
    return (
      consultations.find(
        (c) => String(c.id) === String(selectedConsultationId)
      ) || null
    );
  }, [consultations, selectedConsultationId]);

  const load = async () => {
    if (!token || !patientId) return;

    try {
      setLoading(true);
      setError("");

      // 1) Patient
      const resP = await fetch(`${API}/patients/${patientId}`, {
        headers: authHeaders,
      });
      const txtP = await resP.text();
      if (!resP.ok) throw new Error("Impossible de charger le patient.");
      const p = safeJsonParse(txtP);
      setPatient(p);

      // 2) DME id (structures possibles)
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

      // 3) DME complet
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
          a?.created_at || a?.date || a?.date_consultation || 0
        ).getTime();
        const db = new Date(
          b?.created_at || b?.date || b?.date_consultation || 0
        ).getTime();
        return db - da;
      });

      setConsultations(cons);
      setSelectedConsultationId(cons?.[0]?.id ?? null);

      // 4) Analyses & Examens du DME
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

  const openResultModal = (kind, item) => {
    setError("");
    setResultModal({
      open: true,
      kind,
      item,
      resultat: item?.resultat || "",
      remarques: item?.remarques || "",
      file: null,
      submitting: false,
    });
  };

  const closeResultModal = () => {
    setResultModal({
      open: false,
      kind: null,
      item: null,
      resultat: "",
      remarques: "",
      file: null,
      submitting: false,
    });
  };

  const fileUrlFromPath = (path) => {
    if (!path) return null;
    return `${BASE}/storage/${path}`;
  };

  const submitResult = async () => {
    const { kind, item, resultat, remarques, file } = resultModal;
    if (!kind || !item?.id) return;

    const hasText = String(resultat || "").trim() !== "";
    const hasFile = !!file;
    if (!hasText && !hasFile) {
      setError("Saisissez un résultat ou joignez un PDF.");
      return;
    }

    try {
      setResultModal((m) => ({ ...m, submitting: true }));
      setBusy(true);
      setError("");

      // 1) Upload PDF si fourni
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

      // 2) Update texte (optionnel)
      if (hasText || String(remarques || "").trim() !== "") {
        const payload = {
          resultat: hasText ? resultat.trim() : null,
          remarques: String(remarques || "").trim()
            ? remarques.trim()
            : null,
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
          throw new Error(
            maybe?.message || "Erreur lors de l’enregistrement du résultat."
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

  const fieldRow = (label, value) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "170px 1fr",
        gap: 10,
        padding: "6px 0",
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 800 }}>{label}</div>
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
        fontWeight: 900,
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
        fontWeight: 900,
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
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  if (!token) return <Navigate to="/login" />;

  return (
    <Layout>
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

          <div>
            <div style={{ fontWeight: 1000, fontSize: 18 }}>
              Dossier médical
            </div>
            <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 13 }}>
              {patient?.user?.name
                ? `${patient.user.name} ${patient.user.surname || ""}`
                : `Patient #${patientId}`}
              {dmeId ? ` • DME #${dmeId}` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {pendingAnalyses.length + pendingExamens.length > 0
            ? pill(
                `${pendingAnalyses.length + pendingExamens.length} résultat(s) en attente`,
                "#92400e",
                "#ffedd5"
              )
            : pill("Aucun résultat en attente", "#065f46", "#d1fae5")}
        </div>
      </div>

      {loading && <div>Chargement...</div>}
      {error && (
        <div style={{ color: "red", fontWeight: 900, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!loading && !dmeId && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            Aucun DME trouvé
          </div>
          <div style={{ color: "#6b7280", fontWeight: 700 }}>
            Ce patient n’a pas encore de dossier médical dans le système.
          </div>
        </div>
      )}

      {!loading && dmeId && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>
          {/* Colonne gauche: historique consultations */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>
              Consultations
            </div>

            {consultations.length === 0 ? (
              <div style={{ color: "#6b7280", fontWeight: 700 }}>
                Aucune consultation.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {consultations.map((c) => {
                  const selected = String(c.id) === String(selectedConsultation?.id);
                  const d = c?.date_consultation || c?.date || c?.created_at || c?.updated_at || null;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConsultationId(c.id)}
                      style={{
                        textAlign: "left",
                        border: selected ? "2px solid #48c6ef" : "1px solid #eef2f7",
                        background: selected ? "#f7fbff" : "#fff",
                        borderRadius: 12,
                        padding: "10px 10px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 1000, fontSize: 13 }}>
                        Consultation • {formatDate(d)}
                      </div>
                      <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                        {String(c?.motif || "").trim() ? c.motif : "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {sectionTitle("Infos patient")}
            {fieldRow("Nom", patient?.user ? `${patient.user.name || ""} ${patient.user.surname || ""}` : "—")}
            {fieldRow("Email", patient?.user?.email || "—")}
            {fieldRow("Téléphone", patient?.user?.telephone || "—")}
            {fieldRow("Groupe sanguin", dme?.groupe_sanguin || "—")}
          </div>

          {/* Colonne droite */}
          <div>
            {/* Détails consultation */}
            <div style={cardStyle}>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>
                Consultation{" "}
                {selectedConsultation
                  ? `• ${formatDate(
                      selectedConsultation?.date_consultation ||
                        selectedConsultation?.created_at
                    )}`
                  : ""}
              </div>

              {selectedConsultation ? (
                <>
                  {sectionTitle("Motif / Diagnostic")}
                  {fieldRow("Motif", selectedConsultation?.motif || "—")}
                  {fieldRow("Diagnostic", selectedConsultation?.diagnostic || "—")}

                  {sectionTitle("Signes vitaux")}
                  {fieldRow("Poids", selectedConsultation?.poids ?? "—")}
                  {fieldRow("Taille", selectedConsultation?.taille ?? "—")}
                  {fieldRow(
                    "IMC",
                    calcImc(selectedConsultation?.poids, selectedConsultation?.taille) ?? "—"
                  )}
                  {fieldRow("Température", selectedConsultation?.temperature ?? "—")}
                  {fieldRow("Fréquence", selectedConsultation?.frequence_cardiaque ?? "—")}
                  {fieldRow("Pression artérielle", selectedConsultation?.pression_arterielle ?? "—")}

                  {sectionTitle("Observation")}
                  <div style={{ color: "#111827", fontWeight: 700, whiteSpace: "pre-wrap" }}>
                    {selectedConsultation?.observation ||
                      selectedConsultation?.observations ||
                      "—"}
                  </div>

                  {sectionTitle("Traitement")}
                  <div style={{ color: "#111827", fontWeight: 700, whiteSpace: "pre-wrap" }}>
                    {selectedConsultation?.traitement || "—"}
                  </div>

                  {sectionTitle("Analyses / Examens demandés")}
                  <div style={{ color: "#6b7280", fontWeight: 700 }}>
                    (Les résultats se saisissent dans la section “Résultats en attente”.)
                  </div>

                  {/* Examens liés à la consultation (si le backend les charge via consultations.examens) */}
                  {Array.isArray(selectedConsultation?.examens) &&
                  selectedConsultation.examens.length > 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>
                        Examens
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedConsultation.examens.map((e) => (
                          <div
                            key={e.id}
                            style={{
                              border: "1px solid #eef2f7",
                              borderRadius: 12,
                              padding: 10,
                            }}
                          >
                            <div style={{ fontWeight: 900 }}>
                              {e?.type?.code
                                ? `${e.type.code} — ${e.type.libelle}`
                                : e?.type?.libelle || "—"}
                              {" "}
                              {pill(
                                e?.etat || "en_attente",
                                e?.etat === "termine" ? "#065f46" : "#92400e",
                                e?.etat === "termine" ? "#d1fae5" : "#ffedd5"
                              )}
                            </div>
                            <div
                              style={{
                                color: "#6b7280",
                                fontWeight: 700,
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              Date: {formatDateTime(e?.date_examen)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ color: "#6b7280", fontWeight: 700 }}>
                  Sélectionnez une consultation.
                </div>
              )}
            </div>

            {/* Résultats en attente */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 1000, fontSize: 16 }}>
                  Résultats en attente
                </div>
                <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12 }}>
                  (Saisie par médecin / infirmier quand le patient apporte le PDF)
                </div>
              </div>

              {/* Analyses */}
              {sectionTitle("Analyses")}
              {pendingAnalyses.length === 0 ? (
                <div style={{ color: "#6b7280", fontWeight: 700 }}>
                  Aucune analyse en attente.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 8,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Date demande
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Consultation
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAnalyses.map((a) => (
                        <tr key={a.id}>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              fontWeight: 900,
                            }}
                          >
                            {a?.type_analyse?.libelle ||
                              a?.typeAnalyse?.libelle ||
                              "—"}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              color: "#6b7280",
                              fontWeight: 700,
                            }}
                          >
                            {formatDateTime(a?.date_analyse)}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              color: "#6b7280",
                              fontWeight: 700,
                            }}
                          >
                            {a?.consultation_id ? `#${a.consultation_id}` : "—"}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              textAlign: "right",
                            }}
                          >
                            {actionsBtn(
                              "Enregistrer résultat",
                              () => openResultModal("analyse", a),
                              busy
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Examens */}
              {sectionTitle("Examens")}
              {pendingExamens.length === 0 ? (
                <div style={{ color: "#6b7280", fontWeight: 700 }}>
                  Aucun examen en attente.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 8,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f7fbff" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Date demande
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Consultation
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: 10,
                            borderBottom: "1px solid #eef2f7",
                          }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingExamens.map((e) => (
                        <tr key={e.id}>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              fontWeight: 900,
                            }}
                          >
                            {e?.type?.code
                              ? `${e.type.code} — ${e.type.libelle}`
                              : e?.type?.libelle || "—"}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              color: "#6b7280",
                              fontWeight: 700,
                            }}
                          >
                            {formatDateTime(e?.date_examen)}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              color: "#6b7280",
                              fontWeight: 700,
                            }}
                          >
                            {e?.consultation_id ? `#${e.consultation_id}` : "—"}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #eef2f7",
                              textAlign: "right",
                            }}
                          >
                            {actionsBtn(
                              "Enregistrer résultat",
                              () => openResultModal("examen", e),
                              busy
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal résultat */}
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
                <div style={{ fontWeight: 1000, fontSize: 16 }}>
                  Enregistrer résultat •{" "}
                  {resultModal.kind === "analyse" ? "Analyse" : "Examen"} #
                  {resultModal.item?.id}
                </div>
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
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#6b7280",
                  fontWeight: 900,
                }}
                aria-label="Fermer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Résultat (texte)</label>
                  <Input
                    value={resultModal.resultat}
                    onChange={(e) =>
                      setResultModal((m) => ({ ...m, resultat: e.target.value }))
                    }
                    placeholder="ex: Hb = 12.3 g/dL ..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Joindre PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setResultModal((m) => ({
                        ...m,
                        file: e.target.files?.[0] || null,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #eef2f7",
                      borderRadius: 10,
                    }}
                  />
                  <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                    PDF uniquement (10MB). Optionnel.
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                  <label className="form-label">Remarques</label>
                  <textarea
                    className="custom-input"
                    style={{ minHeight: 90, padding: 10, width: "100%" }}
                    value={resultModal.remarques}
                    onChange={(e) =>
                      setResultModal((m) => ({ ...m, remarques: e.target.value }))
                    }
                    placeholder="ex: contrôle dans 2 semaines ..."
                  />
                </div>
              </div>

              {resultModal.item?.result_file_path ? (
                <div style={{ marginTop: 8, color: "#6b7280", fontWeight: 700, fontSize: 13 }}>
                  PDF actuel :{" "}
                  <a
                    href={fileUrlFromPath(resultModal.item.result_file_path)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#2563eb", fontWeight: 900 }}
                  >
                    {resultModal.item.result_file_original_name || "Ouvrir"}
                  </a>
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={closeResultModal}
                  style={{
                    background: "#f3f4f6",
                    color: "#111827",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: resultModal.submitting ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    opacity: resultModal.submitting ? 0.7 : 1,
                  }}
                  disabled={resultModal.submitting}
                >
                  Annuler
                </button>

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
                    cursor: resultModal.submitting ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    opacity: resultModal.submitting ? 0.7 : 1,
                  }}
                >
                  {resultModal.submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
