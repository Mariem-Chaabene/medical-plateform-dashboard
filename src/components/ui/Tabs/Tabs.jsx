import { useMemo } from "react";
import "./Tabs.css";

export default function Tabs({ tabs = [], activeKey, onChange }) {
  const visibleTabs = useMemo(
    () => (tabs || []).filter((t) => !t?.hidden),
    [tabs]
  );

  const active = visibleTabs.find((t) => t.key === activeKey) || visibleTabs[0];

  return (
    <div className="stabs">
      <div className="stabs__bar" role="tablist">
        {visibleTabs.map((t) => {
          const isActive = t.key === active?.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`stabs__tab ${isActive ? "is-active" : ""}`}
              disabled={!!t.disabled}
              onClick={() => onChange?.(t.key)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="stabs__panel">{active?.content}</div>
    </div>
  );
}
