import {buildApiUrl} from "./apiConfig";

function token(){
  return localStorage.getItem("bw_token")||sessionStorage.getItem("bw_token")
}

export async function atualizarPreferencias(preferencias){
  const r=await fetch(buildApiUrl("/auth/preferencias"),{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      ...(token()?{Authorization:`Bearer ${token()}`}:{})
    },
    body:JSON.stringify(preferencias)
  });

  if(!r.ok){
    const b=await r.json().catch(()=>({}));
    throw new Error(b.detail||"Não foi possível salvar as preferências.")
  }

  return r.json()
}

export async function atualizarPreferenciasUsuario(preferencias){
  return atualizarPreferencias(preferencias)
}