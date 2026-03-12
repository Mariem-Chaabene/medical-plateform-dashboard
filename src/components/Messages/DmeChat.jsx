import { useEffect, useMemo, useRef, useState } from "react";
import { makeEcho } from "../../echo";
import "./DmeChat.css";

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

function getUserIdFromToken(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    const data = JSON.parse(json);
    return data?.sub ? Number(data.sub) : null;
  } catch {
    return null;
  }
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 120);
  } catch {
    // ignore
  }
}

function getQueueKey(dmeId) {
  return `dmechat_queue_${dmeId}`;
}

function loadQueue(dmeId) {
  try {
    const raw = localStorage.getItem(getQueueKey(dmeId));
    const arr = safeJsonParse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveQueue(dmeId, items) {
  try {
    localStorage.setItem(getQueueKey(dmeId), JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function DmeChat({
  apiBase,
  token,
  dmeId,
  onConversationChanged,
}) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
  });

  const listRef = useRef(null);
  const syncInProgressRef = useRef(false);

  const myUserId = useMemo(() => getUserIdFromToken(token), [token]);

  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }, [token]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const showToast = (title, message) => {
    setToast({ open: true, title, message });
    setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, 2500);
  };

  const triggerConversationRefresh = () => {
    if (typeof onConversationChanged === "function") {
      onConversationChanged();
    }
  };

  const mergeQueuedMessages = (serverMessages) => {
    const queued = loadQueue(dmeId);

    const queuedAsUi = queued.map((q) => ({
      id: q.local_id,
      dme_id: dmeId,
      sender_id: q.sender_id,
      body: q.body,
      created_at: q.created_at,
      sender: { name: "Moi", surname: "" },
      _local: true,
      _status: q.status,
      _error: q.error || "",
    }));

    const merged = [...serverMessages];

    queuedAsUi.forEach((q) => {
      const exists = merged.some((m) => String(m.id) === String(q.id));
      if (!exists) merged.push(q);
    });

    merged.sort((a, b) => {
      const da = new Date(a?.created_at || 0).getTime();
      const db = new Date(b?.created_at || 0).getTime();
      return da - db;
    });

    return merged;
  };

  const loadMessages = async () => {
    if (!token || !dmeId) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${apiBase}/dmes/${dmeId}/messages`, {
        headers,
      });
      const txt = await res.text();

      if (!res.ok) {
        const maybe = safeJsonParse(txt);
        throw new Error(maybe?.message || "Impossible de charger les messages.");
      }

      const data = safeJsonParse(txt) || [];
      const list = Array.isArray(data) ? data : [];
      setMessages(mergeQueuedMessages(list));
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
      setMessages(mergeQueuedMessages([]));
    } finally {
      setLoading(false);
    }
  };

  const updateQueuedMessageStatus = (localId, patch) => {
    const queue = loadQueue(dmeId);
    const next = queue.map((item) =>
      String(item.local_id) === String(localId)
        ? { ...item, ...patch }
        : item,
    );
    saveQueue(dmeId, next);

    setMessages((prev) =>
      prev.map((m) =>
        String(m.id) === String(localId)
          ? {
              ...m,
              ...patch,
              _status: patch.status ?? m._status,
              _error: patch.error ?? m._error,
            }
          : m,
      ),
    );
  };

  const removeQueuedMessage = (localId) => {
    const queue = loadQueue(dmeId).filter(
      (item) => String(item.local_id) !== String(localId),
    );
    saveQueue(dmeId, queue);

    setMessages((prev) =>
      prev.filter((m) => String(m.id) !== String(localId)),
    );
  };

  const syncQueuedMessages = async () => {
    if (!token || !dmeId || !navigator.onLine) return;
    if (syncInProgressRef.current) return;

    const queue = loadQueue(dmeId);
    const pending = queue.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );
    if (!pending.length) return;

    syncInProgressRef.current = true;

    try {
      for (const item of pending) {
        updateQueuedMessageStatus(item.local_id, {
          status: "sending",
          error: "",
        });

        try {
          const res = await fetch(`${apiBase}/dmes/${dmeId}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              body: item.body,
              consultation_id: item.consultation_id || null,
            }),
          });

          const txt = await res.text();

          if (!res.ok) {
            const maybe = safeJsonParse(txt);
            throw new Error(maybe?.message || "Envoi impossible.");
          }

          const data = safeJsonParse(txt);

          removeQueuedMessage(item.local_id);

          if (data?.id) {
            setMessages((prev) => {
              const withoutLocal = prev.filter(
                (m) => String(m.id) !== String(item.local_id),
              );
              if (
                withoutLocal.some((m) => String(m.id) === String(data.id))
              ) {
                return withoutLocal;
              }

              return [...withoutLocal, data].sort((a, b) => {
                const da = new Date(a?.created_at || 0).getTime();
                const db = new Date(b?.created_at || 0).getTime();
                return da - db;
              });
            });

            setError("");
            triggerConversationRefresh();
          } else {
            await loadMessages();
            triggerConversationRefresh();
          }
        } catch (err) {
          console.error("syncQueuedMessages error:", err);
          updateQueuedMessageStatus(item.local_id, {
            status: "failed",
            error: err?.message || "Erreur réseau.",
          });
        }
      }
    } finally {
      syncInProgressRef.current = false;
      setTimeout(scrollToBottom, 0);
    }
  };

  const enqueueOfflineMessage = (body) => {
    const localId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const queuedItem = {
      local_id: localId,
      dme_id: dmeId,
      sender_id: myUserId,
      body,
      created_at: new Date().toISOString(),
      consultation_id: null,
      status: "pending",
      error: "",
    };

    const queue = loadQueue(dmeId);
    saveQueue(dmeId, [...queue, queuedItem]);

    const uiMessage = {
      id: localId,
      dme_id: dmeId,
      sender_id: myUserId,
      body,
      created_at: queuedItem.created_at,
      sender: { name: "Moi", surname: "" },
      _local: true,
      _status: "pending",
      _error: "",
    };

    setMessages((prev) => [...prev, uiMessage]);
    setTimeout(scrollToBottom, 0);
  };

  const sendMessage = async () => {
    const body = String(text || "").trim();
    if (!body || !token || !dmeId) return;

    setText("");
    setError("");

    if (!navigator.onLine) {
      enqueueOfflineMessage(body);
      showToast(
        "Hors ligne",
        "Message enregistré localement. Il sera synchronisé à la reconnexion.",
      );
      triggerConversationRefresh();
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      dme_id: dmeId,
      sender_id: myUserId,
      body,
      created_at: new Date().toISOString(),
      sender: { name: "Moi", surname: "" },
      _optimistic: true,
      _status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 0);

    try {
      setSending(true);

      const res = await fetch(`${apiBase}/dmes/${dmeId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body }),
      });

      const txt = await res.text();

      if (!res.ok) {
        const maybe = safeJsonParse(txt);
        throw new Error(maybe?.message || "Envoi impossible.");
      }

      const data = safeJsonParse(txt);

      if (data?.id) {
        setMessages((prev) => {
          const withoutTmp = prev.filter(
            (m) => String(m.id) !== String(tempId),
          );
          if (withoutTmp.some((m) => String(m.id) === String(data.id))) {
            return withoutTmp;
          }
          return [...withoutTmp, data];
        });

        setError("");
        triggerConversationRefresh();
      } else {
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(tempId)),
        );
        await loadMessages();
        triggerConversationRefresh();
      }

      setTimeout(scrollToBottom, 0);
    } catch (e) {
      console.error("sendMessage error:", e);

      setMessages((prev) =>
        prev.filter((m) => String(m.id) !== String(tempId)),
      );

      enqueueOfflineMessage(body);
      showToast(
        "Message mis en attente",
        "Le message sera renvoyé automatiquement dès le retour du réseau.",
      );
      triggerConversationRefresh();
    } finally {
      setSending(false);
    }
  };

  const retryFailedMessage = async (localId) => {
    updateQueuedMessageStatus(localId, {
      status: "pending",
      error: "",
    });
    await syncQueuedMessages();
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dmeId]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError("");
      syncQueuedMessages();
      triggerConversationRefresh();
      showToast(
        "Connexion rétablie",
        "Synchronisation des messages en attente…",
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        "Mode hors ligne",
        "Les nouveaux messages seront stockés localement.",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      syncQueuedMessages();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dmeId]);

  useEffect(() => {
    if (!token || !dmeId) return;

    const echo = makeEcho(token);

    const channel = echo
      .private(`dme.${dmeId}`)
      .listen(".message.sent", (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(payload.id))) {
            return prev;
          }

          const next = [...prev, payload];
          next.sort((a, b) => {
            const da = new Date(a?.created_at || 0).getTime();
            const db = new Date(b?.created_at || 0).getTime();
            return da - db;
          });

          return next;
        });

        triggerConversationRefresh();

        const senderId = payload?.sender_id ?? payload?.sender?.id ?? null;
        if (
          myUserId != null &&
          senderId != null &&
          Number(senderId) !== Number(myUserId)
        ) {
          const sender =
            payload?.sender?.name || payload?.sender?.surname
              ? `${payload.sender?.name || ""} ${payload.sender?.surname || ""}`.trim()
              : "Nouveau message";

          showToast(
            "Nouveau message",
            `${sender}: ${String(payload?.body || "").slice(0, 60)}`,
          );
          playBeep();
        }

        setTimeout(scrollToBottom, 0);
      });

    return () => {
      channel.stopListening(".message.sent");
      echo.leave(`dme.${dmeId}`);
      echo.disconnect();
    };
  }, [token, dmeId, myUserId]);

  return (
    <div className="dmechat-wrap">
      {!isOnline ? (
        <div className="dmechat-offline-banner">
          Hors ligne — les messages seront synchronisés automatiquement.
        </div>
      ) : null}

      {toast.open ? (
        <div className="dmechat-toast" role="status" aria-live="polite">
          <div className="dmechat-toast-title">{toast.title}</div>
          <div className="dmechat-toast-msg">{toast.message}</div>
        </div>
      ) : null}

      <div className="dmechat-header">
        <div className="dmechat-title">Messagerie</div>
        <button
          type="button"
          onClick={loadMessages}
          disabled={loading}
          className="dmechat-reload"
          title="Rafraîchir"
        >
          {loading ? "..." : "↻"}
        </button>
      </div>

      {error ? <div className="dmechat-error">{error}</div> : null}

      <div ref={listRef} className="dmechat-list">
        {loading ? (
          <div className="dmechat-empty">Chargement…</div>
        ) : messages.length === 0 ? (
          <div className="dmechat-empty">Aucun message pour ce DME.</div>
        ) : (
          messages.map((m) => {
            const senderId = m?.sender_id ?? m?.sender?.id ?? null;
            const mine =
              myUserId != null &&
              senderId != null &&
              Number(senderId) === Number(myUserId);

            const sender =
              m?.sender?.name || m?.sender?.surname
                ? `${m.sender?.name || ""} ${m.sender?.surname || ""}`.trim()
                : mine
                  ? "Moi"
                  : `User #${m?.sender_id ?? "—"}`;

            return (
              <div
                key={m.id}
                className={`dmechat-row ${mine ? "mine" : "theirs"} ${m._optimistic ? "optimistic" : ""} ${m._local ? "local" : ""}`}
              >
                <div className="dmechat-bubble">
                  <div className="dmechat-meta">
                    <span className="dmechat-sender">{sender}</span>
                    <span className="dmechat-time">
                      {formatDateTime(m.created_at)}
                    </span>
                  </div>

                  <div className="dmechat-body">{m.body}</div>

                  {m._local ? (
                    <div className="dmechat-status">
                      {m._status === "pending" && "En attente de connexion"}
                      {m._status === "sending" && "Synchronisation…"}
                      {m._status === "failed" && (
                        <>
                          Échec d’envoi
                          <button
                            type="button"
                            className="dmechat-retry"
                            onClick={() => retryFailedMessage(m.id)}
                          >
                            Réessayer
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="dmechat-inputbar">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isOnline
              ? "Écrire un message…"
              : "Écrire un message (mode hors ligne)…"
          }
          className="dmechat-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sending) sendMessage();
            }
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !String(text || "").trim()}
          className="dmechat-send"
        >
          {sending ? "..." : isOnline ? "Envoyer" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}