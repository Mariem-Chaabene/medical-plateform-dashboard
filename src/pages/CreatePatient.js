// src/pages/CreatePatient.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";

export default function CreatePatient() {
  const { token } = useAuth();
  const navigate = useNavigate();

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
  });

  const sexes = ["homme", "femme"];

  const [apiErrors, setApiErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
  ];

  const fieldRows = [];
  for (let i = 0; i < fields.length; i += 2) fieldRows.push(fields.slice(i, i + 2));

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
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

    // ✅ DEBUG : data avant envoi
    console.log("=== CREATE PATIENT SUBMIT ===");
    console.log("Token présent ?", !!token);
    console.log("Payload (values):", values);
    console.log("Payload JSON:", JSON.stringify(values, null, 2));

    try {
      const res = await fetch("http://127.0.0.1:8000/api/patients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });

      // ✅ DEBUG : status + headers
      console.log("Response status:", res.status, res.statusText);
      console.log("Response ok:", res.ok);

      // ✅ DEBUG : lire le body quoi qu'il arrive
      const contentType = res.headers.get("content-type") || "";
      let body;
      if (contentType.includes("application/json")) {
        body = await res.json();
      } else {
        body = await res.text();
      }
      console.log("Response body:", body);

      if (res.ok) {
        setSuccess("Patient créé !");
        setTimeout(() => navigate("/patients"), 1250);
      } else {
        // Laravel 422/403/etc
        setError(body?.message || "Erreur lors de la création");
        setApiErrors(body?.errors ?? {});
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setError("Erreur réseau (backend inaccessible / CORS / token)");
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

                {apiErrors[field.name] && <div className="form-error">{apiErrors[field.name]}</div>}
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
