// src/pages/CreatePatient.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";

export default function CreatePatient() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Champs de base pour le patient
  const [values, setValues] = useState({
    name: "",
    surname: "",
    email: "",
    telephone: "",
    sexe: "",
    date_naissance: "",
    adresse: "",
    antecedents: "",
    password: "",
    // Optionnel: avatar, etc.
  });

  const sexes = ["homme", "femme"];

  const [apiErrors, setApiErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Champs du formulaire
  const fields = [
    { name: "name", label: "Nom", type: "text", placeholder: "Nom" },
    { name: "surname", label: "Prénom", type: "text", placeholder: "Prénom" },
    { name: "email", label: "Email", type: "email", placeholder: "Email" },
    { name: "telephone", label: "Téléphone", type: "text", placeholder: "Téléphone" },
    { name: "sexe", label: "Sexe", type: "select", options: sexes },
    { name: "date_naissance", label: "Date naissance", type: "date", placeholder: "Date de naissance" },
    { name: "adresse", label: "Adresse", type: "text", placeholder: "Adresse" },
    { name: "antecedents", label: "Antécédents", type: "text", placeholder: "Antécédents médicaux" },
    { name: "password", label: "Mot de passe", type: "password", placeholder: "Mot de passe" },
    // Ajoute plus de champs si besoin
  ];

  // Organisation des rows
  const fieldRows = [];
  for (let i = 0; i < fields.length; i += 2) fieldRows.push(fields.slice(i, i + 2));

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  };

  // Validation simple, à compléter selon ton besoin
  const validateForm = () => {
    const newErrors = {};
    // Champs obligatoires
    ["name", "surname", "email", "sexe", "date_naissance", "adresse", "password"].forEach((f) => {
      if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
    });
    setApiErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiErrors({});
    setSuccess("");
    setError("");
    if (!validateForm()) return;

    // Envoi vers l'API Laravel (vérifie si tu as bien un endpoint /api/patients)
    const res = await fetch("http://127.0.0.1:8000/api/patients", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    console.log(res);
    if (res.ok) {
      setSuccess("Patient créé !");
      setTimeout(() => navigate("/patients"), 1250);
    } else {
      setError("Erreur lors de la création");
      try {
        const err = await res.json();
        setApiErrors(err.errors ?? {});
      } catch {}
    }
  };

  return (
    <Layout>
      <h2>Ajouter un patient</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
      <form
        className="dynamic-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {fieldRows.map((rowFields, idx) => (
          <div key={idx} className="form-row">
            {rowFields.map((field) => (
              <div className="form-group" key={field.name}>
                <label htmlFor={field.name} className="form-label">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    className="custom-input"
                    id={field.name}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {(field.options || []).map((opt) =>
                      typeof opt === "object" ? (
                        <option key={opt.id || opt.name} value={opt.name}>
                          {opt.name}
                        </option>
                      ) : (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ""}
                  />
                )}
                {apiErrors[field.name] && (
                  <div className="form-error">{apiErrors[field.name]}</div>
                )}
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="form-btn">
          Sauvegarder
        </button>
      </form>
    </Layout>
  );
}
