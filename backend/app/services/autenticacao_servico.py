from fastapi import HTTPException, status
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepo
from app.repositories.configuracao_repo import ConfiguracaoRepo
from app.schemas.usuario import UsuarioCreate, TokenSchema, UsuarioSchema
from app.core.security import hash_senha, verificar_senha, criar_token
from app.services.configuracao_servico import ConfiguracaoServico

class AutenticacaoServico:
    def __init__(self, repo: UsuarioRepo, config_repo: ConfiguracaoRepo):
        self._repo = repo
        self._config = ConfiguracaoServico(config_repo)

    def registrar(self, dados: UsuarioCreate) -> Usuario:
        if len(dados.senha.encode("utf-8")) > 72: raise HTTPException(status_code=400, detail="Senha muito longa (máximo 72 bytes)")
        if self._repo.procurar_por_email(dados.email): raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")
        if self._repo.procurar_por_nome(dados.nome): raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nome de usuário já cadastrado.")
        usuario = self._repo.criar(Usuario(nome=dados.nome, email=dados.email, senha_hash=hash_senha(dados.senha)))
        self._config.obter_ou_criar(usuario.id)
        return usuario

    def login(self, identificador: str, senha: str) -> TokenSchema:
        usuarios = self._repo.procurar_por_identificador(identificador)
        if len(usuarios) > 1: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nome de usuário duplicado. Entre usando o e-mail.")
        usuario = usuarios[0] if usuarios else None
        if not usuario or not verificar_senha(senha, usuario.senha_hash): raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nome de usuário, e-mail ou senha incorretos.")
        self._config.obter_ou_criar(usuario.id)
        token = criar_token({"sub": str(usuario.id), "email": usuario.email})
        return TokenSchema(access_token=token, usuario=UsuarioSchema.model_validate(usuario))

    def atualizar_preferencias(self, usuario, dados):
        self._config.atualizar(usuario.id, dados.model_dump(exclude_none=True))
        usuario.configuracao = self._config.obter_ou_criar(usuario.id)
        return usuario