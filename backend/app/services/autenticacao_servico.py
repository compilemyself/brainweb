from fastapi import HTTPException, status
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepo
from app.schemas.usuario import UsuarioCreate, TokenSchema, UsuarioSchema
from app.core.security import hash_senha, verificar_senha, criar_token

class AutenticacaoServico:
    def __init__(self, repo: UsuarioRepo):
        self._repo = repo

    def registrar(self, dados: UsuarioCreate) -> Usuario:
        senha_bytes = dados.senha.encode("utf-8")
        if len(senha_bytes) > 72:
            raise HTTPException(
                status_code=400,
                detail="Senha muito longa (máximo 72 bytes)"
        )

        if self._repo.procurar_por_email(dados.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já cadastrado."
            )
        
        senha_hash=hash_senha(dados.senha)

        usuario = Usuario(
            nome=dados.nome,
            email=dados.email,
            senha_hash=senha_hash
        )
        return self._repo.criar(usuario)

    def login(self, email: str, senha: str) -> TokenSchema:
        usuario = self._repo.procurar_por_email(email)
        if not usuario or not verificar_senha(senha, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos."
            )
        token = criar_token({
            "sub": str(usuario.id), 
            "email": usuario.email})
        return TokenSchema(access_token=token, 
                           usuario=UsuarioSchema(id=usuario.id,
                                                 nome=usuario.nome,
                                                 email=usuario.email,
                                                 criado_em=usuario.criado_em))