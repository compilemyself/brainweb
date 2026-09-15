from app.repositories.flow_repo import FlowRepo
from app.models.flow_node import FlowNode
from app.models.flow_edge import FlowEdge
from app.schemas.flow import FlowSchema, FlowNodeSchema, FlowEdgeSchema, PositionSchema

class FlowServico:
    def __init__(self, repo: FlowRepo): self._repo = repo

    def carregar_flow(self, mapa_id: int):
        nodes = [FlowNodeSchema(id=str(n.id), type=n.tipo, position=PositionSchema(x=n.pos_x, y=n.pos_y), data=n.conteudo) for n in self._repo.buscar_nodes(mapa_id)]
        edges = [FlowEdgeSchema(id=str(e.id), source=str(e.id_node_origem), target=str(e.id_node_destino), label=e.label or "") for e in self._repo.buscar_edges(mapa_id)]
        return FlowSchema(nodes=nodes, edges=edges)

    def salvar_flow(self, mapa_id: int, dados: FlowSchema):
        try:
            self._repo.bloquear_mapa_para_escrita(mapa_id); self._repo.apagar_edges(mapa_id); self._repo.apagar_nodes(mapa_id); id_map = {}
            for node in dados.nodes:
                novo = self._repo.criar_node(FlowNode(id_mapa_mental=mapa_id, tipo=node.type, conteudo=node.data or {}, pos_x=int(round(node.position.x)), pos_y=int(round(node.position.y)))); id_map[node.id] = novo.id
            for edge in dados.edges:
                origem, destino = id_map.get(edge.source), id_map.get(edge.target)
                if origem is not None and destino is not None: self._repo.criar_edge(FlowEdge(id_mapa_mental=mapa_id, id_node_origem=origem, id_node_destino=destino, label=edge.label or ""))
            self._repo.commit(); return {"status": "ok"}
        except Exception:
            self._repo.rollback(); raise