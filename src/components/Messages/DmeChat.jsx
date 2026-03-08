import { useEffect, useMemo, useRef, useState } from "react";
import { makeEcho } from "../../echo";
import "./DmeChat.css"; // <- ajoute le css ci-dessous

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

// decode JWT payload pour récupérer sub (id user) sans lib
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

// petit beep sans fichier audio
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

export default function DmeChat({ apiBase, token, dmeId }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  const listRef = useRef(null);
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
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
  };

  const loadMessages = async () => {
    if (!token || !dmeId) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${apiBase}/dmes/${dmeId}/messages`, { headers });
      const txt = await res.text();

      if (!res.ok) {
        const maybe = safeJsonParse(txt);
        throw new Error(
          maybe?.message || "Impossible de charger les messages.",
        );
      }

      const data = safeJsonParse(txt) || [];
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const body = String(text || "").trim();
    if (!body || !token || !dmeId) return;

    // ✅ optimistic placeholder (immédiat)
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      dme_id: dmeId,
      sender_id: myUserId,
      body,
      created_at: new Date().toISOString(),
      sender: { name: "Moi", surname: "" },
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setTimeout(scrollToBottom, 0);

    try {
      setSending(true);
      setError("");

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

      // ✅ remplacer le message optimistic par le message DB (id réel)
      if (data?.id) {
        setMessages((prev) => {
          const withoutTmp = prev.filter(
            (m) => String(m.id) !== String(tempId),
          );
          if (withoutTmp.some((m) => String(m.id) === String(data.id)))
            return withoutTmp;
          return [...withoutTmp, data];
        });
      } else {
        // fallback: si backend ne renvoie pas le message complet
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(tempId)),
        );
        await loadMessages();
      }

      setTimeout(scrollToBottom, 0);
    } catch (e) {
      // retirer optimistic si erreur
      setMessages((prev) =>
        prev.filter((m) => String(m.id) !== String(tempId)),
      );
      setError(e?.message || "Erreur réseau.");
    } finally {
      setSending(false);
    }
  };

  // charger historique
  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dmeId]);

  // realtime Echo
  useEffect(() => {
    if (!token || !dmeId) return;

    const echo = makeEcho(token);

    const channel = echo
      .private(`dme.${dmeId}`)
      .listen(".message.sent", (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(payload.id)))
            return prev;
          return [...prev, payload];
        });

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
                className={`dmechat-row ${mine ? "mine" : "theirs"} ${m._optimistic ? "optimistic" : ""}`}
              >
                <div className="dmechat-bubble">
                  <div className="dmechat-meta">
                    <span className="dmechat-sender">{sender}</span>
                    <span className="dmechat-time">
                      {formatDateTime(m.created_at)}
                    </span>
                  </div>
                  <div className="dmechat-body">{m.body}</div>
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
          placeholder="Écrire un message…"
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
          {sending ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
