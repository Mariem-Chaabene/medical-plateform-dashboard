import "./KpiCard.css";

export default function KpiCard({ title, value, subtitle, icon, variant = "blue" }) {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-card__top">
        <div className="kpi-card__icon">{icon}</div>
        <div className="kpi-card__title">{title}</div>
      </div>

      <div className="kpi-card__value">{value}</div>

      {subtitle ? <div className="kpi-card__subtitle">{subtitle}</div> : null}
    </div>
  );
}
