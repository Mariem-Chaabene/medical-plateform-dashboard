import "./PatientMiniCard.css";
import Input from "../Input/Input";

function calcAge(dateNaissance) {
  if (!dateNaissance) return "-";
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function formatSexe(v) {
  if (!v) return "-";
  const s = String(v).toLowerCase();
  if (s === "m" || s === "male" || s === "homme") return "Homme";
  if (s === "f" || s === "female" || s === "femme") return "Femme";
  return String(v);
}

export default function PatientMiniCard({
  variant = "patient", // ✅ "patient" | "vitals"
  title,
  patient,
  dme,
  vitals,
  onChangeVital,
}) {
  // ---------- DATA PATIENT ----------
  const user = patient?.user || {};
  const fullName =
    `${user?.name || ""} ${user?.surname || ""}`.trim() || "Patient";

  const age = calcAge(patient?.date_naissance);

  if (variant === "vitals") {
    return (
      <div className="pmcCard">
        <div className="pmcCard__title">{title || "Constantes Vitales"}</div>

        <div className="pmcVitalsStack">
          <div className="pmcField">
            <label className="pmcLabel">Poids (kg)</label>
            <Input
              type="number"
              value={vitals?.poids ?? ""}
              onChange={(e) => onChangeVital?.("poids", e.target.value)}
            />
          </div>

          <div className="pmcField">
            <label className="pmcLabel">Taille (cm)</label>
            <Input
              type="number"
              value={vitals?.taille ?? ""}
              onChange={(e) => onChangeVital?.("taille", e.target.value)}
            />
          </div>
          <div className="pmcField">
            <label className="pmcLabel">IMC</label>
            <Input type="text" value={vitals?.imc ?? ""} disabled />
          </div>
          <div className="pmcField">
            <label className="pmcLabel">Température (°C)</label>
            <Input
              type="number"
              value={vitals?.temperature ?? ""}
              onChange={(e) => onChangeVital?.("temperature", e.target.value)}
            />
          </div>

          <div className="pmcField">
            <label className="pmcLabel">Fréq. cardiaque</label>
            <Input
              type="number"
              value={vitals?.frequence_cardiaque ?? ""}
              onChange={(e) =>
                onChangeVital?.("frequence_cardiaque", e.target.value)
              }
            />
          </div>

          <div className="pmcField">
            <label className="pmcLabel">Pression artérielle</label>
            <Input
              placeholder="ex: 12/8"
              value={vitals?.pression_arterielle ?? ""}
              onChange={(e) =>
                onChangeVital?.("pression_arterielle", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pmcCard">
      <div className="pmcCard__title">{title || "Informations Patient"}</div>

      <div className="pmcDossier">
        <span className="pmcLabel">N° dossier</span>
        <span className="pmcValue">{dme?.id ?? "-"}</span>
      </div>

      <div className="pmcPatientBody">
        <div className="pmcInfoGrid">
          <div className="pmcInfoItem">
            <span className="pmcLabel">Nom & Prénom</span>
            <span className="pmcValue">{fullName}</span>
          </div>

          <div className="pmcInfoItem">
            <span className="pmcLabel">Âge</span>
            <span className="pmcValue">{age === "-" ? "-" : `${age} ans`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
