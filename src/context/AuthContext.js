import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
    if (role) {
      localStorage.setItem("role", role);
    }
  }, [token, role]);

  const login = ({ email, password }) => {
    return fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        setToken(data.token);
        // fetch le profile
        const meRes = await fetch("http://127.0.0.1:8000/api/me", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const profile = await meRes.json();
        setRole(profile.roles[0].name);
        setUser(profile);
        return profile.roles[0].name;
      });
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setRole("");
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
