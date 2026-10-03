import {buildApiUrl,normalizeNetworkError} from "./apiConfig";
function token(){return localStorage.getItem("bw_token")||sessionStorage.getItem("bw_token")}
function headers(extra={}){const t=token();return {...extra,...(t?{Authorization:`Bearer ${t}`}:{})}}
async function fetchJson(path,options={}){let res;try{res=await fetch(buildApiUrl(path),options)}catch(e){throw normalizeNetworkError(e)}if(!res.ok){const body=await res.json().catch(()=>({}));throw new Error(body.detail||`Erro HTTP ${res.status}`)}return res.json()}
export const getMapaPrincipal=()=>fetchJson("/mapas/principal",{headers:headers()});
export const getFlowPrincipal=()=>fetchJson("/mapas/principal/flow",{headers:headers()});
export const getConfiguracoes=()=>fetchJson("/auth/configuracoes",{headers:headers()});
export const salvarMapa=(id,data)=>fetchJson(`/mapas/${id}/flow`,{method:"PUT",headers:headers({"Content-Type":"application/json"}),body:JSON.stringify(data)});
export const salvarConfiguracaoMapa=(id,data)=>fetchJson(`/mapas/${id}/configuracao`,{method:"PUT",headers:headers({"Content-Type":"application/json"}),body:JSON.stringify(data)});