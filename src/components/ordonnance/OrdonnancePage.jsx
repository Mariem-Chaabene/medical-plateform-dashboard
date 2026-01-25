import React from "react";
import OrdonnanceDocument from "./OrdonnanceDocument";

export default function OrdonnancePage({ patient, medecin, cabinet, lignes, dateOrdonnance }) {
  const handlePrint = () => {
    // Optionnel mais propre : déclenche l'impression + laisse le navigateur gérer l'aperçu
    window.print();
  };

  return (
    <>
      {/* UI normale (non imprimée) */}
      <div className="no-print" style={{ display: "flex", gap: 10 }}>
        <button onClick={handlePrint}>Imprimer</button>
      </div>

      {/* Zone imprimable : cachée à l'écran, visible à l'impression */}
      <div className="print-area">
        <OrdonnanceDocument
          patient={patient}
          medecin={medecin}
          cabinet={cabinet}
          lignes={lignes}
          dateOrdonnance={dateOrdonnance}
        />
      </div>
    </>
  );
}
