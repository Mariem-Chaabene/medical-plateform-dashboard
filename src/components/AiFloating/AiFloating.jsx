import React, { useEffect, useMemo, useState } from "react";
import AiLiveCard from "../AiLiveCard/AiLiveCard";
import "./AiFloating.css";

export default function AiFloating({ aiLive, ageYears }) {
  const [open, setOpen] = useState(false);

  const alertCount = useMemo(() => (aiLive?.alerts?.length ? aiLive.alerts.length : 0), [aiLive]);
  const tone = aiLive?.risk_level === "critique" ? "danger" : alertCount > 0 ? "warn" : "ok";

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        className={`aiFab aiFab-${tone}`}
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant clinique"
        title="Assistant clinique"
      >
        <span className="aiFabIcon">🤖</span>
        {alertCount > 0 && <span className="aiFabBadge">+{alertCount}</span>}
      </button>

      {/* Drawer */}
      {open && (
        <div className="aiDrawerRoot" role="dialog" aria-modal="true">
          <div className="aiOverlay" onClick={() => setOpen(false)} />

          <div className="aiDrawer">
            <div className="aiDrawerTop">
              <div className="aiDrawerTitle">Assistant clinique</div>
              <button type="button" className="aiClose" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="aiDrawerBody">
              <AiLiveCard aiLive={aiLive} ageYears={ageYears} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
