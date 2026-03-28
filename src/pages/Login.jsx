import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input/Input";
import PasswordInput from "../components/ui/Input/PasswordInput";
import Button from "../components/ui/Button/Button";
import "./Login.css";
import logologin from "../assets/logologin.jpg"; // 

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
      navigate("/home");
    } catch (e) {
      setError("Identifiants invalides ou erreur serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-card">
        
               <img src={logologin} alt="Logo" className="logologin" />
        
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
          
          <h3 className="login-theme__title">
            Bienvenue sur la plateforme médicale
          </h3>
        </div>
      </div>
    </div>
  );
}
