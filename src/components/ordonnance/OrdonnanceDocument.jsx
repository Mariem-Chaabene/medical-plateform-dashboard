import React, { useMemo } from "react";
import "../ordonnance/OrdonnanceDocument.css";

function Plus({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="42" y="6" width="16" height="88" rx="3" fill="currentColor" />
      <rect x="6" y="42" width="88" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}

function formatDateFR(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("fr-FR");
}

export default function OrdonnanceDocument({
  patient,
  medecin,
  cabinet,
  lignes = [],
  dateOrdonnance,
}) {
  const doc = useMemo(() => {
    const u = medecin?.user || medecin || {};

    const first = u?.name || u?.prenom || "";
    const last = u?.surname || u?.nom || "";

    const qualification =
      medecin?.specialite || u?.specialite || cabinet?.specialite || "";

    const phone =
      u?.phone ||
      u?.telephone ||
      u?.tel ||
      medecin?.phone ||
      medecin?.telephone ||
      medecin?.tel ||
      cabinet?.telephone ||
      cabinet?.tel ||
      "";

    const email = u?.email || medecin?.email || cabinet?.email || "";

    return {
      first,
      last,
      qualification: qualification || "QUALIFICATION",
      phone,
      email,
      fullName: `${last}${last && first ? ", " : ""}${first}`.trim(),
    };
  }, [medecin, cabinet]);

  const patientName = useMemo(() => {
    const p = patient || {};

    // ✅ prend en charge patient.user, patient.patient.user, etc.
    const pu = p.user || p.patient?.user || p.profile || {};

    const prenom =
      pu.prenom ||
      pu.firstName ||
      pu.first_name ||
      pu.name ||
      p.prenom ||
      p.firstName ||
      p.first_name ||
      p.name ||
      "";

    const nom =
      pu.nom ||
      pu.lastName ||
      pu.last_name ||
      pu.surname ||
      p.nom ||
      p.lastName ||
      p.last_name ||
      p.surname ||
      "";

    const full = p.fullName || p.full_name || pu.fullName || pu.full_name || "";

    return (full || `${nom} ${prenom}`).trim();
  }, [patient]);

  return (
    <div className="ordonnance">
      {/* ===== HEADER ===== */}
      <div className="ord-header">
        <div className="ord-header-left">
          <h1 className="ord-doctor-name">
            <span className="first">Dr. {doc.first || "—"}</span>{" "}
            <span className="last">{doc.last || ""}</span>
          </h1>

          <div className="ord-qualification">{doc.qualification}</div>

          <div className="ord-doctor-contact">
            <div className="ord-contact-line">
              <span className="ord-contact-label">Dr</span>
              <span className="ord-contact-value">{doc.fullName}</span>
            </div>

            {doc.phone && (
              <div className="ord-contact-line">
                <span className="ord-contact-label">Téléphone</span>
                <span className="ord-contact-value">{doc.phone}</span>
              </div>
            )}

            {doc.email && (
              <div className="ord-contact-line">
                <span className="ord-contact-label">Email</span>
                <span className="ord-contact-value">{doc.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ord-header-right" aria-hidden="true">
          <Plus className="ord-plus ord-plus--xl" />
          <Plus className="ord-plus ord-plus--md" />
          <Plus className="ord-plus ord-plus--sm" />
          <Plus className="ord-plus ord-plus--xs" />
        </div>

        <div className="ord-bottom-line" />
        <div className="ord-bottom-right" />
      </div>

      {/* ===== INFOS PATIENT / DATE ===== */}
      <div className="ord-meta">
        <div className="ord-meta-left">
          <div className="ord-meta-title">Patient</div>
          <div className="ord-meta-value">{patientName || "—"}</div>
        </div>

        <div className="ord-meta-right">
          <div className="ord-meta-title">Date</div>
          <div className="ord-meta-value">{formatDateFR(dateOrdonnance)}</div>
        </div>
      </div>

      {/* ===== MEDICAMENTS ===== */}
      <div className="ord-rx">
        <div className="ord-rx-title">Ordonnance</div>

        {lignes?.length ? (
          <ol className="ord-rx-list">
            {lignes.map((l, idx) => {
              const name =
                l?.medicament?.nom ||
                l?.medicamentName ||
                l?.nom ||
                l?.libelle ||
                l?.designation ||
                `Médicament ${idx + 1}`;

              const posologie =
                l?.posologie ||
                l?.dose ||
                l?.instructions ||
                l?.commentaire ||
                "";

              const duree = l?.duree || l?.duration || "";
              const qte = l?.quantite || l?.qte || "";

              return (
                <li key={l?.id ?? idx} className="ord-rx-item">
                  <div className="ord-rx-drug">{name}</div>

                  {(posologie || duree || qte) && (
                    <div className="ord-rx-details">
                      {posologie && <div>• {posologie}</div>}
                      {duree && <div>• Durée : {duree}</div>}
                      {qte && <div>• Quantité : {qte}</div>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="ord-empty">Aucun médicament.</div>
        )}
      </div>
      {/* ===== SIGNATURE (bas de page) ===== */}
      <div className="ord-footer">
        <div className="ord-signature-block">
          <div className="ord-signature-label">Signature</div>
          <div className="ord-signature-line" />
          <div className="ord-signature-name">
            Dr {doc.last}
            {doc.last && doc.first ? ", " : ""}
            {doc.first}
          </div>
        </div>
      </div>
    </div>
  );
}
