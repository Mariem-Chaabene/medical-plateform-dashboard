import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import BackButton from "../components/ui/Button/BackButton";

export default function PatientEdit() {
  const { id } = useParams();
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiErrors, setApiErrors] = useState({});

  // Dropdowns
  const sexes = ["homme", "femme"];

  const patientFields = [
    { name: "name", label: "Nom", type: "text", placeholder: "Nom" },
    { name: "surname", label: "Prénom", type: "text", placeholder: "Prénom" },
    { name: "email", label: "Email", type: "email", placeholder: "Email" },
    { name: "telephone", label: "Téléphone", type: "text", placeholder: "Téléphone" },
    { name: "sexe", label: "Sexe", type: "select", options: sexes },
    { name: "date_naissance", label: "Date naissance", type: "date", placeholder: "Date de naissance" },
    { name: "adresse", label: "Adresse", type: "text", placeholder: "Adresse" },
    { name: "antecedents", label: "Antécédents", type: "text", placeholder: "Antécédents médicaux" },
  ];

  const fieldRows = [];
  for (let i = 0; i < patientFields.length; i += 2)
    fieldRows.push(patientFields.slice(i, i + 2));

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Patient non trouvé");
        return res.json();
      })
      .then(data => {
        setValues({
          name: data.user?.name || "",
          surname: data.user?.surname || "",
          email: data.user?.email || "",
          telephone: data.user?.telephone || "",
          sexe: data.user?.sexe || "",
          date_naissance: data.date_naissance || "",
          adresse: data.adresse || "",
          antecedents: data.antecedents || "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement");
        setLoading(false);
      });
  }, [id, token]);

  const handleChange = (name, value) => {
    setValues((vals) => ({ ...vals, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!values.name.trim()) newErrors.name = "Nom requis";
    if (!values.email.trim()) newErrors.email = "Email requis";
    if (!values.date_naissance) newErrors.date_naissance = "Date naissance requise";
    if (!values.adresse.trim()) newErrors.adresse = "Adresse requise";
    setApiErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!validateForm()) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patients/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiErrors(err.errors || {});
        setError("Erreur lors de la modification");
      } else {
        setSuccess("Patient modifié avec succès");
      }
    } catch {
      setError("Erreur lors de la modification");
    }
  };

  if (loading) return <Layout><div>Chargement ...</div></Layout>;
  if (error) return <Layout><div style={{ color: "red" }}>{error}</div></Layout>;

  return (
    <Layout>
      <h2 style={{marginBottom: 32}}>Modifier Patient</h2>
      {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}
      <form className="form" onSubmit={handleSubmit}>
        {fieldRows.map((rowFields, idx) => (
          <div key={idx} className="form-row" style={{marginBottom: 24}}>
            {rowFields.map((field) => (
              <div className="form-group" key={field.name} style={{flex: 1}}>
                <label htmlFor={field.name} className="form-label">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    className="custom-input"
                    id={field.name}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    style={{marginBottom: 8}}
                  >
                    <option value="">Sélectionner</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    value={values[field.name] || ""}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (field.name === "telephone") {
                        val = val.replace(/\D/g, "").slice(0, 8);
                      }
                      handleChange(field.name, val);
                    }}
                    placeholder={field.placeholder || ""}
                    error={apiErrors[field.name]}
                  />
                )}
                {apiErrors[field.name] && (
                  <div className="form-error" style={{marginTop: 4}}>{apiErrors[field.name]}</div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className="form-btn-row">
          <BackButton />
          <button type="submit" className="form-btn">Enregistrer</button>
        </div>
      </form>
    </Layout>
  );
}
