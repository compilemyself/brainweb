from app.models.configuracao import Configuracao
from app.repositories.configuracao_repo import ConfiguracaoRepo

DEFAULTS = {
    "cor_mapa": "BRAINWEB",
    "custom_1_primaria": "#48abb3", "custom_1_secundaria": "#0f2f33",
    "custom_2_primaria": "#48abb3", "custom_2_secundaria": "#0f2f33",
    "nota_flutuante_ativa": True, "relogio_ativo": True,
    "historico_clipboard_ativo": True, "imagem_deformavel": False,
}

class ConfiguracaoServico:
    def __init__(self, repo: ConfiguracaoRepo): self._repo = repo
    def obter_ou_criar(self, id_usuario: int):
        atual = self._repo.buscar_por_usuario(id_usuario)
        if atual: return atual
        return self._repo.criar(Configuracao(id_usuario=id_usuario, **DEFAULTS))
    def atualizar(self, id_usuario: int, values: dict):
        atual = self.obter_ou_criar(id_usuario)
        for key, value in values.items():
            if value is not None and hasattr(atual, key): setattr(atual, key, value)
        return self._repo.atualizar(atual)