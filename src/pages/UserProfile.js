import { useEffect, useState } from "react";
import { useParams, useNavigate  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import BackButton from "../components/ui/Button/BackButton";

export default function UserProfile() {
  const { id } = useParams();
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [id, token]);

  if (loading) return <Layout><div>Chargement ...</div></Layout>;
  if (!user) return <Layout><div>Utilisateur introuvable</div></Layout>;

  // Avatar fallback
  const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundType=solid&backgroundColor=e4e4e4`;
  const role = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].name : "";

  return (
    <Layout>
      <div style={{display:"flex", gap:32, alignItems:"flex-start", marginTop: "34px"}}>
        {/* Bloc infos générales */}
        <div className="card" style={{background:"#fff",borderRadius:16,padding:32,minWidth:320,flexDirection:"column"}}>
          <img src={avatarUrl} alt={user.name} style={{width:86,height:86,borderRadius:"50%",marginBottom:16,display:"block"}} />
          <h2 style={{textAlign:"center", marginBottom:60}}>{user.name} {user.surname}</h2>
          
          {/* Email full line */}
          <div style={{marginBottom:16, fontSize:17}}>
            <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Email : </span><br></br>
            <span style={{fontWeight:500}}>{user.email}</span>
          </div>
          
          {/* Other infos, lines below */}
          <div style={{width:"100%",marginTop:0, fontSize:16}}>
            <div>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Téléphone : </span><br></br>
              <span  style={{fontWeight:500}}>{user.telephone}</span>
            </div>
            <div>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Sexe : </span><br></br>
              <span  style={{fontWeight:500}}>{user.sexe}</span>
            </div>
            <div>
              <span style={{color:"rgb(170,170,170)",fontWeight:500}}>Rôle : </span><br></br>
              <span  style={{fontWeight:500}}>{role}</span>
            </div>
          </div>
        </div>

        {/* Bloc infos métier */}
        <div className="card" style={{borderRadius:16,padding:32,minWidth:320, background:"#f7fafd"}}>
          <h3 style={{marginBottom:18,fontWeight:600,fontSize:21}}>Informations {role && <>({role})</>}</h3>
          {role === "medecin" && user.medecin && (
            <>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Spécialité : </span>
                <span>{user.medecin.specialite}</span>
              </div>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Numéro inscription : </span>
                <span>{user.medecin.numero_inscription}</span>
              </div>
            </>
          )}
          {role === "infirmier" && user.infirmier && (
            <>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Numéro inscription : </span>
                <span>{user.infirmier.numero_inscription}</span>
              </div>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Département : </span>
                <span>{user.infirmier.departement}</span>
              </div>
            </>
          )}
          {role === "patient" && user.patient && (
            <>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Date naissance : </span>
                <span>{user.patient.date_naissance}</span>
              </div>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Adresse : </span>
                <span>{user.patient.adresse}</span>
              </div>
              <div>
                <span style={{color:"rgb(170,170,170)"}}>Antécédents : </span>
                <span>{user.patient.antecedents}</span>
              </div>
            </>
          )}
          {!["medecin","infirmier","patient"].includes(role) && (
            <div style={{color:"#aaa"}}>Aucune information spécifique pour ce rôle.</div>
          )}
        </div>
              </div>
      <div className="form-btn-row">
          <BackButton />
      </div>
    </Layout>
  );
}
