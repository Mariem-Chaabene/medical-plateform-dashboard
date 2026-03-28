import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DmeChat from "../../components/Messages/DmeChat";
import Layout from "../Layout";
import "./MessageriePage.css";

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

function extractPatients(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.patients)) return payload.patients;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function getPatientFullName(patient) {
  return (
    patient?.user?.full_name ||
    patient?.user?.name ||
    patient?.fullName ||
    `${patient?.user?.name || ""} ${patient?.user?.surname || ""}`.trim()
  );
}

function matchesPatientName(patient, term) {
  const firstName = String(patient?.user?.name || "").toLowerCase();
  const lastName = String(patient?.user?.surname || "").toLowerCase();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    firstName.includes(term) ||
    lastName.includes(term) ||
    fullName.includes(term)
  );
}

export default function MessageriePage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatientDme, setSelectedPatientDme] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const searchRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }, [token]);

  const loadConversations = useCallback(async () => {
    if (!token) return;

    if (!navigator.onLine) {
      setIsOnline(false);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setIsOnline(true);
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/messagerie/conversations`, { headers });
      const txt = await res.text();

      if (!res.ok) {
        const maybe = safeJsonParse(txt);
        throw new Error(
          maybe?.message || "Impossible de charger les conversations.",
        );
      }

      const data = safeJsonParse(txt) || [];
      const list = Array.isArray(data) ? data : [];

      setConversations(list);

      const dmeFromQuery = searchParams.get("dme");

      if (dmeFromQuery) {
        const found = list.find(
          (c) => String(c.dme_id) === String(dmeFromQuery),
        );
        if (found) {
          setSelectedId(found.id);
          setSelectedPatientDme(null);
          setSelectedPatientName("");
          return;
        }
      }

      setSelectedId((prev) => {
        if (prev && list.some((c) => String(c.id) === String(prev))) {
          return prev;
        }
        return list.length > 0 ? list[0].id : null;
      });
    } catch (e) {
      if (!navigator.onLine) {
        setIsOnline(false);
        setError("");
      } else {
        setError(e?.message || "Erreur réseau.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, headers, searchParams]);

  const loadPatients = useCallback(async () => {
    if (!token || !navigator.onLine) return;

    try {
      setLoadingPatients(true);

      const res = await fetch(`${API}/patients`, { headers });
      const txt = await res.text();
      const data = safeJsonParse(txt);

      if (!res.ok) {
        throw new Error(data?.message || "Impossible de charger les patients.");
      }

      const list = extractPatients(data);
      setPatients(list);
    } catch (e) {
      console.error("Erreur chargement patients:", e);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [token, headers]);

  const markConversationRead = useCallback(
    async (conversationId) => {
      if (!token || !conversationId || !navigator.onLine) return;

      try {
        await fetch(
          `${API}/messagerie/conversations/${conversationId}/mark-read`,
          {
            method: "POST",
            headers,
          },
        );
      } catch {
        // ignore
      }
    },
    [token, headers],
  );

  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [token, loadConversations]);

  useEffect(() => {
    if (!token) return;
    loadPatients();
  }, [token, loadPatients]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError("");
      loadConversations();
      loadPatients();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError("");
      setLoading(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadConversations, loadPatients]);

  useEffect(() => {
    if (!selectedId) return;

    const run = async () => {
      await markConversationRead(selectedId);
      await loadConversations();
    };

    run();
  }, [selectedId, markConversationRead, loadConversations]);

  useEffect(() => {
    const term = patientSearch.trim().toLowerCase();

    if (!term) {
      setPatientSuggestions([]);
      return;
    }

    const filtered = patients
      .filter((p) => matchesPatientName(p, term))
      .slice(0, 8);

    setPatientSuggestions(filtered);
  }, [patientSearch, patients]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setPatientSuggestions([]);
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectPatient = async (patient) => {
    try {
      setError("");
      setPatientSearch(getPatientFullName(patient));
      setPatientSuggestions([]);
      setShowSuggestions(false);
      const res = await fetch(`${API}/patients/${patient.id}/dossier`, {
        headers,
      });
      const txt = await res.text();
      const dme = safeJsonParse(txt);

      if (!res.ok) {
        throw new Error(
          dme?.message || "Impossible de récupérer le DME du patient.",
        );
      }

      const dossier = dme?.data || dme;

      if (!dossier?.id) {
        throw new Error("Aucun DME trouvé pour ce patient.");
      }

      const existingConversation = conversations.find(
        (c) => String(c.dme_id) === String(dossier.id),
      );

      if (existingConversation) {
        setSelectedId(existingConversation.id);
        setSelectedPatientDme(null);
        setSelectedPatientName("");
        return;
      }

      setSelectedId(null);
      setSelectedPatientDme(dossier.id);
      setSelectedPatientName(getPatientFullName(patient));
    } catch (e) {
      setError(e?.message || "Erreur lors de l’ouverture du dossier patient.");
    }
  };

  const selectedConversation = conversations.find(
    (c) => String(c.id) === String(selectedId),
  );

  const effectiveDmeId = selectedConversation?.dme_id || selectedPatientDme;
  const effectivePatientName =
    selectedConversation?.patient_name || selectedPatientName;

  return (
    <Layout>
      <div className="msg-page">
        <div className="msg-sidebar">
          <div className="msg-sidebar-header">
            <div className="msg-sidebar-title">Messagerie</div>
            <button
              type="button"
              className="msg-reload"
              onClick={loadConversations}
              disabled={loading}
            >
              {loading ? "..." : "↻"}
            </button>
          </div>

          <div className="messagerie-search-box" ref={searchRef}>
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                const term = patientSearch.trim().toLowerCase();
                setShowSuggestions(true);
                if (!term) return;

                const filtered = patients
                  .filter((p) => matchesPatientName(p, term))
                  .slice(0, 8);

                setPatientSuggestions(filtered);
              }}
            />

            {showSuggestions ? (
              loadingPatients ? (
                <div className="search-dropdown">
                  Chargement des patients...
                </div>
              ) : patientSuggestions.length > 0 ? (
                <div className="search-dropdown">
                  {patientSuggestions.map((patient) => (
                    <div
                      key={patient.id}
                      className="search-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectPatient(patient);
                      }}
                    >
                      {patient.user?.name} {patient.user?.surname}
                    </div>
                  ))}
                </div>
              ) : patientSearch.trim() ? (
                <div className="search-dropdown">
                  <div className="search-item empty">Aucun patient trouvé</div>
                </div>
              ) : null
            ) : null}
          </div>

          

          {error ? <div className="msg-error">{error}</div> : null}

          <div className="msg-list">
            {loading ? (
              <div className="msg-empty">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="msg-empty">Aucune conversation trouvée.</div>
            ) : (
              conversations.map((conv) => {
                const active =
                  String(conv.id) === String(selectedId) && !selectedPatientDme;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(conv.id);
                      setSelectedPatientDme(null);
                      setSelectedPatientName("");
                      setPatientSuggestions([]);
                    }}
                    className={active ? "msg-item active" : "msg-item"}
                  >
                    <div className="msg-item-top">
                      <div className="msg-item-title">
                        {conv.patient_name ||
                          conv.title ||
                          `Conversation #${conv.id}`}
                      </div>

                      <div className="msg-item-time">
                        {formatDateTime(
                          conv?.last_message?.created_at || conv.updated_at,
                        )}
                      </div>
                    </div>

                    <div className="msg-item-sub">DME #{conv.dme_id}</div>

                    <div className="msg-item-preview">
                      {conv?.last_message?.sender_name
                        ? `${conv.last_message.sender_name}: ${conv.last_message.body}`
                        : "Aucun message"}
                    </div>

                    {Number(conv.unread_count || 0) > 0 ? (
                      <div className="msg-badge">{conv.unread_count}</div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="msg-content">
          {!effectiveDmeId ? (
            <div className="msg-placeholder">
              Sélectionnez une conversation ou recherchez un patient.
            </div>
          ) : (
            <DmeChat
              apiBase={API}
              token={token}
              dmeId={effectiveDmeId}
              patientName={effectivePatientName}
              onConversationChanged={loadConversations}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
