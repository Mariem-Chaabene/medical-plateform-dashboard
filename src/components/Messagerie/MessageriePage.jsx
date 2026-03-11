import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import DmeChat from "../../components/Messages/DmeChat";
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

  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }, [token]);

  const loadConversations = async () => {
    if (!token) return;

    try {
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

      if (list.length > 0) {
        setSelectedId((prev) => prev ?? list[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
      setConversations([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

          {error ? <div className="msg-error">{error}</div> : null}

          <div className="msg-list">
            {loading ? (
              <div className="msg-empty">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="msg-empty">Aucune conversation.</div>
            ) : (
              conversations.map((conv) => {
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
          {!selectedConversation ? (
            <div className="msg-placeholder">
              Sélectionnez une conversation.
            </div>
          ) : (
            <DmeChat
              apiBase={API}
              token={token}
              dmeId={selectedConversation.dme_id}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}