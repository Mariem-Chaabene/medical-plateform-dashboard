import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import BackButton from "../components/ui/Button/BackButton";

export default function PatientShow() {
  const { id } = useParams();
  const { token } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Patient non trouvé");
        return res.json();
      })
      .then(data => {
        setPatient(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement du patient.");
        setLoading(false);
      });
  }, [id, token]);

  if (loading) return <Layout><div>Chargement ...</div></Layout>;
  if (error) return <Layout><div style={{ color: "red" }}>{error}</div></Layout>;
  if (!patient) return <Layout><div>Patient introuvable</div></Layout>;

  const user = patient.user || {};

  // Avatar fallback
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundType=solid&backgroundColor=e4e4e4`;

  return (
    <Layout>
      <div style={{display:"flex", gap:32, alignItems:"flex-start", marginTop: "34px"}}>
        {/* Bloc infos générales */}
        <div className="card" style={{background:"#fff",borderRadius:16,padding:32,minWidth:320,flexDirection:"column"}}>
          <img src={avatarUrl} alt={user.name} style={{width:86,height:86,borderRadius:"50%",marginBottom:16,display:"block"}} />
          <h2 style={{textAlign:"center", marginBottom:60}}>{user.name} {user.surname}</h2>
          
          {/* Email full line */}
          <div style={{marginBottom:24, fontSize:17}}>
            <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Email : </span><br/>
            <span style={{fontWeight:500}}>{user.email}</span>
          </div>
          
          {/* Autres infos */}
          <div style={{width:"100%", fontSize:16}}>
            <div style={{marginBottom:16}}>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Téléphone : </span><br/>
              <span style={{fontWeight:500}}>{user.telephone}</span>
            </div>
            <div style={{marginBottom:16}}>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Sexe : </span><br/>
              <span style={{fontWeight:500}}>{user.sexe}</span>
            </div>
            <div style={{marginBottom:24}}>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Date de naissance : </span><br/>
              <span style={{fontWeight:500}}>{patient.date_naissance}</span>
            </div>
          </div>
        </div>

        {/* Bloc infos médicales */}
        <div className="card" style={{borderRadius:16,padding:32,minWidth:320, background:"#f7fafd"}}>
          <h3 style={{marginBottom:18,fontWeight:600,fontSize:21}}>Informations médicales</h3>
          <div style={{width:"100%", fontSize:16}}>
            <div style={{marginBottom:16}}>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Adresse : </span><br/>
              <span style={{fontWeight:500}}>{patient.adresse}</span>
            </div>
            <div>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Antécédents : </span><br/>
              <span style={{fontWeight:500}}>{patient.antecedents || "Aucun antécédent"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="form-btn-row" style={{marginTop: 32}}>
        <BackButton />
      </div>
    </Layout>
  );
}
