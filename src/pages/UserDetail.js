import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import Form from "../components/ui/Form/Form.css";
import BackButton from "../components/ui/Button/BackButton";

export default function UserDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [rolesOptions, setRolesOptions] = useState([]);


  // Dropdowns
  const sexes = ["homme", "femme"];

  // Champs spécifiques par rôle
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

  // Champs de base
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
    { name: "role", label: "Rôle", type: "select", options: rolesOptions },
  ];

  // On fetch l'user + les rôles
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`http://127.0.0.1:8000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("http://127.0.0.1:8000/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([data, roles]) => {
        setValues({
          ...data,
          role: Array.isArray(data.roles) ? data.roles[0]?.name : "",
          numero_inscription: data.infirmier?.numero_inscription ?? "",
          departement: data.infirmier?.departement ?? "",
          specialite: data.medecin?.specialite ?? "",
          date_naissance: data.patient?.date_naissance ?? "",
          adresse: data.patient?.adresse ?? "",
          antecedents: data.patient?.antecedents ?? "",
        });
        setRolesOptions(roles);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur API");
        setLoading(false);
      });
  }, [id, token]);

  // Maj du state, efface les champs spécifiques quand le rôle change
  const handleChange = (name, value) => {
    if (name === "role") {
      // Reset les champs spécifiques lors d’un changement de rôle
      let resetFields = {};
      Object.values(roleSpecificFields)
        .flat()
        .forEach((field) => {
          resetFields[field.name] = "";
        });
      setValues((vals) => ({ ...vals, [name]: value, ...resetFields }));
    } else {
      setValues((vals) => ({ ...vals, [name]: value }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Champs requis
    displayFields.forEach((field) => {
      const value = values[field.name]?.trim?.() ?? "";
      if (!value) {
        newErrors[field.name] = "Ce champ est requis";
      } else if (
        field.type === "text" &&
        ![
          "telephone",
          "email",
          "adresse",
          "departement",
          "specialite",
          "antecedents",
          "numero_inscription"
        ].includes(field.name)
      ) {
        // blocage caractères autres que lettres pour texte (hors quelques exceptions)
        if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(value)) {
          newErrors[field.name] = "Texte invalide (lettres uniquement)";
        }
      } else if (field.name === "telephone") {
        if (!/^\d{1,8}$/.test(value)) {
          newErrors[field.name] =
            "Téléphone : 8 chiffres max, chiffres seulement";
        }
      } else if (field.name === "numero_inscription") {
        if (!/^\d+$/.test(value)) {
          newErrors[field.name] =
            "Numéro inscription : 8 chiffres max, chiffres seulement";
        }
      }
      // Select → non vide
      if (field.type === "select" && !value) {
        newErrors[field.name] = "Ce champ est obligatoire";
      }
    });

    setApiErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update user
  const handleSubmit = async () => {
    setSuccess("");
    setError("");
    if (!validateForm()) return; // Ajoute ceci
    setApiErrors({});
    const res = await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setSuccess("Modifié !");
    } else {
      setError("Erreur lors de la modification");
      try {
        const err = await res.json();
        setApiErrors(err.errors ?? {});
      } catch {}
    }
  };

  // Champs à afficher dynamiquement
  const selectedRole = values.role;
  const displayFields = [
    ...baseFields,
    ...(roleSpecificFields[selectedRole] || []),
  ];
  const fieldRows = [];
  for (let i = 0; i < displayFields.length; i += 2)
    fieldRows.push(displayFields.slice(i, i + 2));

  return (
    <Layout>
      <h2>Modifier Utilisateur</h2>
      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
      {!loading && (
        <form
          className="form"
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
                      onChange={(e) => {
                        let val = e.target.value;
                        if (
                          field.name === "telephone" ||
                          field.name === "numero_inscription"
                        ) {
                          // n'autorise que des chiffres
                          val = val.replace(/\D/g, "").slice(0, 8);
                        }
                        handleChange(field.name, val);
                      }}
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
          <div className="form-btn-row">
            <BackButton />
            <button type="submit" className="form-btn">
              Mettre à jour
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}
