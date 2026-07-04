from app.models.mapa_mental import MapaMental
from app.repositories.mapa_repo import MapaRepo
from app.schemas.mapa_mental import MapaCreate
from fastapi import HTTPException, status


class MapaServico:
    def __init__(self, repo: MapaRepo):
        self._repo = repo

    def criar(self, id_usuario: int, dados: MapaCreate) -> MapaMental:
        mapa = MapaMental(
            id_usuario=id_usuario,
            titulo=dados.titulo
        )
        return self._repo.criar(mapa)

    def listar(self, id_usuario: int):
        return self._repo.listar_por_usuario(id_usuario)

    def buscar(self, mapa_id: int):
        mapa = self._repo.buscar_por_id(mapa_id)
        if not mapa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mapa não encontrado"
            )
        return mapa
    
    def obter_ou_criar_principal(self, id_usuario: int):
        mapa = self._repo.procurar_por_usuario(id_usuario)

        if mapa:
            return mapa

        return self._repo.criar(
            MapaMental(
                id_usuario=id_usuario,
                titulo="Principal"
            )
        )