import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import MapEditor from "../components/flow/MapEditor";
import { getMapaPrincipal, getFlowPrincipal } from "../services/mapasApi";

export default function MapPage() {
  const [mapa, setMapa] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function load() {
      try {
        const mapaData = await getMapaPrincipal();
        const flowData = await getFlowPrincipal();

        if (!ativo) return;

        setMapa({
          ...mapaData,
          nodes: flowData.nodes || [],
          edges: flowData.edges || []
        });
      } catch (error) {
        console.error("Erro ao carregar mapa:", error);

        if (ativo) {
          setErro(error.message || "Não foi possível carregar o mapa.");
        }
      }
    }

    load();

    return () => {
      ativo = false;
    };
  }, []);

  if (erro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center"
        }}
      >
        <div>
          <p>Não foi possível carregar o mapa.</p>
          <p>{erro}</p>
        </div>
      </div>
    );
  }

  if (!mapa) return <div>Carregando mapa...</div>;

  return (
    <ReactFlowProvider>
      <MapEditor mapa={mapa} />
    </ReactFlowProvider>
  );
}