import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";

import MapEditor from "../components/flow/MapEditor";
import { getMapaPrincipal, getFlowPrincipal } from "../services/mapasApi";

export default function MapPage() {
  const [mapa, setMapa] = useState(null);

  useEffect(() => {
    async function load() {
      const mapaData = await getMapaPrincipal();
      const flowData = await getFlowPrincipal();

      setMapa({
        ...mapaData,
        nodes: flowData.nodes || [],
        edges: flowData.edges || [],
      });
    }

    load();
  }, []);

  if (!mapa) return <div>Carregando mapa...</div>;

  return (
    <ReactFlowProvider>
      <MapEditor mapa={mapa} />
    </ReactFlowProvider>
  );
}