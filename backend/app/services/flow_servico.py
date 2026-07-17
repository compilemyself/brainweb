from app.repositories.flow_repo import FlowRepo
from app.models.flow_node import FlowNode
from app.models.flow_edge import FlowEdge
from app.schemas.flow import (
    FlowSchema,
    FlowNodeSchema,
    FlowEdgeSchema,
    PositionSchema,
)


class FlowServico:

    def __init__(self, repo: FlowRepo):
        self._repo = repo

    def carregar_flow(self, mapa_id: int):
        nodes_db = self._repo.buscar_nodes(mapa_id)
        edges_db = self._repo.buscar_edges(mapa_id)

        nodes = []

        for node in nodes_db:
            nodes.append(
                FlowNodeSchema(
                    id=str(node.id),
                    type=node.tipo,
                    position=PositionSchema(
                        x=node.pos_x,
                        y=node.pos_y
                    ),
                    data=node.conteudo
                )
            )

        edges = []

        for edge in edges_db:
            edges.append(
                FlowEdgeSchema(
                    id=str(edge.id),
                    source=str(edge.id_node_origem),
                    target=str(edge.id_node_destino)
                )
            )

        return FlowSchema(nodes=nodes, edges=edges)

    def salvar_flow(self, mapa_id: int, dados: FlowSchema):
        try:
            # O lock impede dois salvamentos simultâneos de apagarem e recriarem
            # o mesmo flow em paralelo, que era a origem das duplicações.
            self._repo.bloquear_mapa_para_escrita(mapa_id)

            # Arestas são apagadas primeiro para respeitar as chaves estrangeiras.
            self._repo.apagar_edges(mapa_id)
            self._repo.apagar_nodes(mapa_id)

            id_map = {}

            # Recria os nós e guarda o mapeamento entre o ID do React Flow e o
            # novo ID persistido no PostgreSQL.
            for node in dados.nodes:
                novo_node = self._repo.criar_node(
                    FlowNode(
                        id_mapa_mental=mapa_id,
                        tipo=node.type,
                        conteudo=node.data or {},
                        pos_x=int(round(node.position.x)),
                        pos_y=int(round(node.position.y))
                    )
                )

                id_map[node.id] = novo_node.id

            for edge in dados.edges:
                origem = id_map.get(edge.source)
                destino = id_map.get(edge.target)

                if origem is None or destino is None:
                    continue

                self._repo.criar_edge(
                    FlowEdge(
                        id_mapa_mental=mapa_id,
                        id_node_origem=origem,
                        id_node_destino=destino
                    )
                )

            # Todo o flow passa a ser substituído de forma atômica.
            self._repo.commit()
            return {"status": "ok"}
        except Exception:
            self._repo.rollback()
            raise
