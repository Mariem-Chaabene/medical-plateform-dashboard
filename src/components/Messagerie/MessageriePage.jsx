import { useEffect, useMemo, useState, useCallback } from "react";
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

      const res = await fetch(`${API}/messagerie/conversations`, {
        headers,
      });

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
    const handleOnline = () => {
      setIsOnline(true);
      setError("");
      loadConversations();
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
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;

    const run = async () => {
      await markConversationRead(selectedId);
      await loadConversations();
    };

    run();
  }, [selectedId, markConversationRead, loadConversations]);

  const selectedConversation = conversations.find(
    (c) => String(c.id) === String(selectedId),
  );

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

          {!isOnline ? (
            <div className="msg-offline-banner">
              Mode hors ligne — affichage des conversations déjà chargées.
            </div>
          ) : null}

          {error ? <div className="msg-error">{error}</div> : null}

          <div className="msg-list">
            {loading ? (
              <div className="msg-empty">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="msg-empty">Aucune conversation.</div>
            ) : (
              conversations.map((conv) => {
                console.log(conv);
                const active = String(conv.id) === String(selectedId);

                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={`msg-item ${active ? "active" : ""}`}
                    onClick={() => setSelectedId(conv.id)}
                  >
                    <div className="msg-item-top">
                      <div className="msg-item-title">
                        {conv.patient_name
                          ? `Discussion DME du ${conv.patient_name}`
                          : conv.title
                            ? conv.title
                            : `Discussion DME #${conv.dme_id || conv.id}`}
                      </div>
                      <div className="msg-item-time">
                        {formatDateTime(
                          conv?.last_message?.created_at || conv.updated_at,
                        )}
                      </div>
                    </div>

                    {/* <div className="msg-item-sub">DME #{conv.dme_id}</div> */}

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
          {!selectedConversation ? (
            <div className="msg-placeholder">
              Sélectionnez une conversation.
            </div>
          ) : (
            <DmeChat
              apiBase={API}
              token={token}
              dmeId={selectedConversation.dme_id}
              onConversationChanged={loadConversations}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
