import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/login", {
        email,
        password,
      });
      const { token, role } = res.data;
      localStorage.setItem("token", token); // Attention : pour plus de sécurité, préférer session ou cookie HttpOnly !
      localStorage.setItem("role", role);
      if (role === "admin") {
        navigate("/admin");
      } else {
        setError("Accès réservé à l'admin.");
      }
    } catch (err) {
      setError("Identifiants invalides.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
      <button type="submit">Connexion</button>
      {error && <div style={{color:"red"}}>{error}</div>}
    </form>
  );
}
