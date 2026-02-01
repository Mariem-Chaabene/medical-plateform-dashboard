import React, { useMemo } from "react";
import "./AiLiveCard.css";

/**
 * Panneau IA "Assistant Clinique" (sans librairie).
 * Attendu dans aiLive:
 * {
 *  loading, risk_level, risk_score,
 *  alerts[], observations[], checklist[],
 *  metrics: { temperature, frequence_cardiaque, ta:{sys,dia}, imc, age_group }
 * }
 */

function riskMeta(level) {
  switch (level) {
    case "critique":
      return { label: "Critique", tone: "danger", icon: "⚠️" };
    case "surveillance":
      return { label: "Surveillance", tone: "warn", icon: "⚠️" };
    default:
      return { label: "Stable", tone: "ok", icon: "✅" };
  }
}

function sevTone(sev) {
  const s = Number(sev || 1);
  if (s >= 5) return "danger";
  if (s === 4) return "warn2";
  if (s === 3) return "warn";
  if (s === 2) return "info";
  return "ok";
}

function fmt(v, suffix = "") {
  if (v === null || v === undefined || v === "") return "—";
  return `${v}${suffix}`;
}

function fmtTa(metrics) {
  const sys = metrics?.ta?.sys ?? null;
  const dia = metrics?.ta?.dia ?? null;
  if (!sys || !dia) return "—";
  return `${sys}/${dia}`;
}

function nowHHMM() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AiLiveCard({ aiLive, ageYears }) {
  const meta = riskMeta(aiLive?.risk_level);
  const metrics = aiLive?.metrics || null;

  // Affichage "Mis à jour" qui se rafraîchit quand le contenu change
  const updatedAt = useMemo(() => nowHHMM(), [
    aiLive?.risk_level,
    aiLive?.risk_score,
    (aiLive?.alerts || []).length,
    (aiLive?.observations || []).length,
    aiLive?.error,
  ]);

  const alerts = Array.isArray(aiLive?.alerts) ? aiLive.alerts : [];
  const observations = Array.isArray(aiLive?.observations) ? aiLive.observations : [];
  const checklist = Array.isArray(aiLive?.checklist) ? aiLive.checklist : [];

  const ta = fmtTa(metrics);

  return (
    <aside className={`aiCard ai-${meta.tone}`}>
      {/* Header */}
      <div className="aiHeader">
        <div className="aiHeaderTop">
          <div className="aiBrand">
            <span className="aiBrandIcon">🤖</span>
            <div>
              <div className="aiBrandTitle">Assistant clinique</div>
              <div className="aiBrandSub">
                {aiLive?.loading ? (
                  <span className="aiLoadingPill">Analyse…</span>
                ) : (
                  <span className="aiUpdated">Mis à jour {updatedAt}</span>
                )}
              </div>
            </div>
          </div>

          <div className={`aiRiskPill tone-${meta.tone}`} title="Niveau de risque global basé sur les alertes">
            <span className="aiDot" />
            <span className="aiRiskText">
              {meta.icon} Risque: {meta.label}
            </span>
            <span className="aiRiskScore">score {aiLive?.risk_score ?? 0}</span>
          </div>

          <div className="aiMetaRow">
            <span className="aiMetaItem">
              Âge: <strong>{ageYears ?? "—"}</strong>
            </span>
            {metrics?.age_group ? <span className="aiMetaSep">•</span> : null}
            {metrics?.age_group ? (
              <span className="aiMetaItem">
                Groupe: <strong>{metrics.age_group}</strong>
              </span>
            ) : null}
          </div>

          {aiLive?.error ? <div className="aiError">{aiLive.error}</div> : null}
        </div>
      </div>

      {/* Résumé KPI */}
      <div className="aiSection">
        <div className="aiSectionTitle">Résumé</div>
        <div className="aiKpis">
          <div className="aiKpi">
            <div className="aiKpiLabel">🌡️ Température</div>
            <div className="aiKpiValue">{fmt(metrics?.temperature, " °C")}</div>
          </div>
          <div className="aiKpi">
            <div className="aiKpiLabel">🫀 FC</div>
            <div className="aiKpiValue">{fmt(metrics?.frequence_cardiaque, " bpm")}</div>
          </div>
          <div className="aiKpi">
            <div className="aiKpiLabel">🩸 TA</div>
            <div className="aiKpiValue">{ta !== "—" ? `${ta} mmHg` : "—"}</div>
          </div>
          <div className="aiKpi">
            <div className="aiKpiLabel">⚖️ IMC</div>
            <div className="aiKpiValue">{fmt(metrics?.imc)}</div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="aiSection">
        <div className="aiSectionTitle">Alertes</div>

        {alerts.length === 0 ? (
          <div className="aiEmpty">Aucune alerte détectée.</div>
        ) : (
          <div className="aiList">
            {alerts.map((a, idx) => {
              const tone = sevTone(a.severity);
              const sevIcon = tone === "danger" ? "🚨" : tone === "warn2" ? "⚠️" : tone === "warn" ? "⚠️" : "ℹ️";
              return (
                <div key={idx} className={`aiItem item-${tone}`}>
                  <div className="aiItemTop">
                    <div className="aiItemTitle">
                      <span className="aiItemIcon" aria-hidden="true">
                        {sevIcon}
                      </span>
                      {a.title}
                    </div>
                    <div className={`aiSev tone-${tone}`}>S{a.severity}/5</div>
                  </div>
                  <div className="aiItemText">{a.explanation}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Observations (repliable) */}
      <div className="aiSection">
        <details className="aiDetails">
          <summary className="aiSummary">
            <span>Observations</span>
            <span className="aiCount">{observations.length}</span>
          </summary>

          {observations.length === 0 ? (
            <div className="aiEmpty" style={{ marginTop: 10 }}>
              —
            </div>
          ) : (
            <div className="aiList" style={{ marginTop: 10 }}>
              {observations.map((o, idx) => {
                const tone = sevTone(o.severity);
                return (
                  <div key={idx} className="aiItem item-soft">
                    <div className="aiItemTop">
                      <div className="aiItemTitle">
                        <span className="aiItemIcon" aria-hidden="true">
                          ✅
                        </span>
                        {o.title}
                      </div>
                      <div className={`aiSev tone-${tone}`}>S{o.severity}/5</div>
                    </div>
                    <div className="aiItemText">{o.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}
        </details>
      </div>

      {/* À vérifier (affiché seulement si non vide) */}
      {checklist.length > 0 && (
        <div className="aiSection">
          <details className="aiDetails" open>
            <summary className="aiSummary">
              <span>À vérifier</span>
              <span className="aiCount">{checklist.length}</span>
            </summary>
            <ul className="aiCheck">
              {checklist.map((c, i) => (
                <li key={i}>🧾 {c}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Mention pro */}
      <div className="aiFooterNote">
        Assistant d’aide à la saisie — ne remplace pas le jugement médical.
      </div>
    </aside>
  );
}
