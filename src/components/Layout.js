import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { makeEcho } from "../echo";
import "./Layout.css";

const BASE = "http://127.0.0.1:8000";
const API = `${BASE}/api`;

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

function safeJsonParse(txt) {
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const beep = (freq, start, duration, gainValue = 0.08) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = gainValue;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    beep(880, 0.0, 0.12, 0.07);
    beep(1040, 0.16, 0.14, 0.08);

    setTimeout(() => {
      ctx.close();
    }, 500);
  } catch {
    // ignore
  }
}

export default function Layout({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [globalToast, setGlobalToast] = useState({
    open: false,
    title: "",
    message: "",
    dmeId: null,
  });

  const [unreadTotal, setUnreadTotal] = useState(0);

  const myUserId = useMemo(() => getUserIdFromToken(token), [token]);

  const loadUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/messagerie/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const txt = await res.text();
      if (!res.ok) return;

      const data = safeJsonParse(txt) || [];
      const list = Array.isArray(data) ? data : [];

      const total = list.reduce(
        (sum, conv) => sum + Number(conv?.unread_count || 0),
        0,
      );

      setUnreadTotal(total);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadUnreadCount();
  }, [token, loadUnreadCount]);

  useEffect(() => {
    if (!token || !myUserId) return;

    const echo = makeEcho(token);

    const channel = echo
      .private(`user.${myUserId}`)
      .listen(".message.notification", (payload) => {
        setGlobalToast({
          open: true,
          title: "Nouveau message",
          message: `${payload?.sender_name || "Quelqu’un"}: ${String(payload?.body || "").slice(0, 80)}`,
          dmeId: payload?.dme_id ?? null,
        });

        playNotificationSound();

        setUnreadTotal((prev) => prev + 1);

        setTimeout(() => {
          setGlobalToast((t) => ({ ...t, open: false }));
        }, 4000);
      });

    return () => {
      channel.stopListening(".message.notification");
      echo.leave(`user.${myUserId}`);
      echo.disconnect();
    };
  }, [token, myUserId]);

  useEffect(() => {
    const handleFocus = () => {
      loadUnreadCount();
    };

    const handleOnline = () => {
      loadUnreadCount();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadUnreadCount]);

  const handleToastClick = () => {
    if (globalToast?.dmeId) {
      navigate(`/messagerie?dme=${globalToast.dmeId}`);
      setGlobalToast((t) => ({ ...t, open: false }));
      setTimeout(() => {
        loadUnreadCount();
      }, 600);
    } else {
      navigate("/messagerie");
      setGlobalToast((t) => ({ ...t, open: false }));
    }
  };

  return (
    <div className="dashboard-layout">
      {globalToast.open ? (
        <button
          type="button"
          className="global-toast global-toast--clickable"
          role="status"
          aria-live="polite"
          onClick={handleToastClick}
          title="Ouvrir la conversation"
        >
          <div className="global-toast-title">{globalToast.title}</div>
          <div className="global-toast-message">{globalToast.message}</div>
          <div className="global-toast-hint">Cliquer pour ouvrir</div>
        </button>
      ) : null}

      <Navbar />
      <div className="dashboard-layout__main" style={{ display: "flex" }}>
        <Sidebar unreadCount={unreadTotal} />
        <main className="dashboard-content" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}