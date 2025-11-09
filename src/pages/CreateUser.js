import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";

export default function CreateUser() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [rolesOptions, setRolesOptions] = useState([]);
  const [values, setValues] = useState({
    name: "",
    surname: "",
    email: "",
    telephone: "",
    sexe: "",
    password: "",
    role: "",
  });
  const [apiErrors, setApiErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const sexes = ["homme", "femme"];

  const roleSpecificFields = {
    medecin: [
      {
        name: "specialite",
        label: "Spécialité",
        type: "text",
        placeholder: "Spécialité",
      },
      {
        name: "numero_inscription",
        label: "Numéro inscription",
        type: "text",
        placeholder: "Numéro inscription",
      },
    ],
    patient: [
      {
        name: "date_naissance",
        label: "Date naissance",
        type: "date",
        placeholder: "Date de naissance",
      },
      {
        name: "adresse",
        label: "Adresse",
        type: "text",
        placeholder: "Adresse",
      },
      {
        name: "antecedents",
        label: "Antécédents",
        type: "text",
        placeholder: "Antécédents médicaux",
      },
    ],
    infirmier: [
      {
        name: "numero_inscription",
        label: "Numéro inscription",
        type: "text",
        placeholder: "Numéro inscription",
      },
      {
        name: "departement",
        label: "Département",
        type: "text",
        placeholder: "Département",
      },
    ],
  };

  const baseFields = [
    { name: "name", label: "Nom", type: "text", placeholder: "Nom" },
    { name: "surname", label: "Prénom", type: "text", placeholder: "Prénom" },
    { name: "email", label: "Email", type: "email", placeholder: "Email" },
    {
      name: "telephone",
      label: "Téléphone",
      type: "text",
      placeholder: "Téléphone",
    },
    { name: "sexe", label: "Sexe", type: "select", options: sexes },
    {
      name: "password",
      label: "Mot de passe",
      type: "password",
      placeholder: "Mot de passe",
    },
    { name: "role", label: "Rôle", type: "select", options: rolesOptions },
  ];

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/roles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setRolesOptions);
  }, [token]);

  const handleChange = (name, value) => {
    if (name === "role")
      setValues((v) => ({
        ...v,
        [name]: value,
        ...Object.fromEntries(
          Object.values(roleSpecificFields)
            .flat()
            .map((f) => [f.name, ""])
        ),
      }));
    else setValues((v) => ({ ...v, [name]: value }));
  };

  const selectedRole = values.role;
  const displayFields = [
    ...baseFields,
    ...(roleSpecificFields[selectedRole] || []),
  ];
  const fieldRows = [];
  for (let i = 0; i < displayFields.length; i += 2)
    fieldRows.push(displayFields.slice(i, i + 2));

  const handleSubmit = async () => {
    setApiErrors({});
    setSuccess("");
    setError("");
    const validateForm = () => {
      const newErrors = {};
      // Champs obligatoires de base
      ["name", "email", "password", "role"].forEach((f) => {
        if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
      });
      // Prénom, sexe, téléphone peuvent aussi être obligatoire si tu veux :
      ["surname", "sexe", "telephone"].forEach((f) => {
        if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
      });

      // Champs spécifiques obligatoires selon le rôle
      if (values.role === "medecin") {
        ["specialite", "numero_inscription"].forEach((f) => {
          if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
        });
      }
      if (values.role === "patient") {
        ["date_naissance", "adresse"].forEach((f) => {
          if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
        });
        // Antecedents peut rester optionnel selon tes règles
      }
      if (values.role === "infirmier") {
        ["numero_inscription", "departement"].forEach((f) => {
          if (!values[f]) newErrors[f] = "Ce champ est obligatoire";
        });
      }

      setApiErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    if (!validateForm()) return;

    const res = await fetch("http://127.0.0.1:8000/api/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    console.log(res);
    if (res.ok) {
      setSuccess("Utilisateur créé !");
      setTimeout(() => navigate("/users"), 1250);
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
      <h2>Ajouter un utilisateur</h2>
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
