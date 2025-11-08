import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input/Input";
import PasswordInput from "../components/Input/PasswordInput";
import Button from "../components/Button/Button";
import "./Login.css";

const schema = yup.object().shape({
  email: yup.string().email("Email invalide").required(),
  password: yup.string().min(6, "Min 6 caractères").required(),
});

export default function Login() {
  const { register, handleSubmit, formState } = useForm({
    resolver: yupResolver(schema),
  });
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError("");
    try {
      const role = await login(values);
      if (role === "admin") navigate("/home");
      else setError("Accès réservé à l'admin.");
    } catch (e) {
      setError("Identifiants invalides ou erreur serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-card">
        <div className="login-card__logo">
          <svg width="55" height="55" viewBox="0 0 24 24" fill="#48c6ef">
            <rect x="10" y="4" width="4" height="16" rx="2"></rect>
            <rect x="4" y="10" width="16" height="4" rx="2"></rect>
          </svg>
        </div>
        <h2 className="login-card__title">Plateforme Médicale</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="login-card__form">
          <Input
            {...register("email")}
            type="email"
            placeholder="Email"
            aria-invalid={!!formState.errors.email}
          />
          {formState.errors.email && (
            <div className="error-message">
              {formState.errors.email.message}
            </div>
          )}
          <PasswordInput
            {...register("password")}
            placeholder="Mot de passe"
            aria-invalid={!!formState.errors.password}
          />
          {formState.errors.password && (
            <div className="error-message">
              {formState.errors.password.message}
            </div>
          )}
          <Button loading={isLoading} type="submit">
            Se connecter
          </Button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
      <div className="login-theme">
        <div className="login-theme__container">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="#fff">
            <circle cx="12" cy="12" r="10" fill="#48c6ef" opacity="0.2" />
            <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="#fff" />
            <rect x="11" y="3" width="2" height="7" fill="#fff" />
            <rect x="11" y="14" width="2" height="7" fill="#fff" />
            <rect x="3" y="11" width="7" height="2" fill="#fff" />
            <rect x="14" y="11" width="7" height="2" fill="#fff" />
          </svg>
          <h3 className="login-theme__title">
            Bienvenue sur la plateforme médicale
          </h3>
          <p className="login-theme__desc">
            Accédez à la gestion des dossiers, à la messagerie interne, et aux alertes patients.<br />
            Protégez les données et facilitez la coordination médicale en toute sécurité.
          </p>
        </div>
      </div>
    </div>
  );
}
