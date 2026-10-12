# BrainWeb

Aplicação web de código aberto para criação e edição de mapas mentais, desenvolvida originalmente como parte do Projeto Integrador III-B da Universidade Católica de Pelotas (UCPEL) e mantida e atualizada de forma independente após sua conclusão acadêmica.

O BrainWeb permite organizar ideias visualmente por meio de nós e conexões, oferecendo diferentes tipos de conteúdo, temas visuais, ferramentas de edição, atalhos de teclado, histórico da área de transferência e persistência dos mapas. O projeto continua evoluindo como uma ferramenta voltada ao uso cotidiano, com funcionalidades que buscam tornar a organização visual de ideias mais flexível e prática.

## Visão geral

O projeto é dividido em duas partes principais:

- **Frontend:** aplicação React responsável pela interface e pelo editor de mapas.
- **Backend:** API desenvolvida em Python com FastAPI, responsável pela autenticação, persistência e comunicação com o PostgreSQL.

## Funcionalidades

### Autenticação

- Cadastro e login de usuários.
- Login utilizando nome de usuário ou e-mail.
- Autenticação baseada em JWT.
- Persistência dos mapas associados ao usuário.

### Editor de mapas

- Criação, edição, movimentação e redimensionamento de nós.
- Nós com suporte a texto, listas, imagens e checklists.
- Criação, edição e exclusão de conexões e rótulos.
- Seleção múltipla e edição por menus de contexto.
- Desfazer e refazer alterações.
- Salvamento automático.
- Busca de conteúdo no mapa.
- Zoom, navegação e ajuste da visualização.
- Suporte a atalhos de teclado e dispositivos móveis.

### Tipos de nós

| Tipo | Descrição |
|---|---|
| **Texto** | Bloco para texto livre. |
| **Checklist** | Lista com itens organizáveis hierarquicamente. |
| **Imagem** | Nó destinado à exibição de imagens. |
| **Embed** | Incorporação de conteúdo externo por URL. Atualmente suporta YouTube, Spotify e Google Maps. |
| **Calculadora** | Nó com funcionalidade de calculadora. |

Imagens possuem limite de **4 MB**, pois são armazenadas diretamente no JSONB do banco de dados.

### Temas

Temas disponíveis:

- BRAINWEB
- GASAI
- FLORA
- WORMS
- ANDROGYNOUS
- MUD
- BASIC
- SPAWN
- PANTHERESS
- JM
- EVA
- DAWN
- URSULA
- INVINCIBLE

Também existem dois espaços para temas personalizados, permitindo ao usuário definir cores primárias e secundárias digitando os códigos HEX desejados.

### Configurações

As preferências do usuário incluem:

- Modificar o tema do mapa.
- Selecionar cores dos temas personalizados.
- Ativar ou desativar o botão de nota flutuante, a caixa de texto sticky para anotações e a consulta rápida.
- Ativar ou desativar a exibição de data e hora.
- Ativar ou desativar o histórico da área de transferência.
- Ativar ou desativar o comportamento de deformação de imagens durante o redimensionamento.

## Atalhos

| Atalho | Ação |
|---|---|
| `Ctrl` / `Cmd` + `F` | Abrir a busca |
| `Ctrl` / `Cmd` + `Z` | Desfazer |
| `Ctrl` / `Cmd` + `Y` | Refazer |
| `Ctrl` / `Cmd` + `Shift` + `Z` | Refazer |
| `Ctrl` / `Cmd` + `C` | Copiar a seleção |
| `Ctrl` / `Cmd` + `V` | Colar o item mais recente do histórico |
| `Delete` | Excluir nós e conexões selecionados |
| `Escape` | Fechar menus, busca e configurações ou sair do modo de edição |

## Navegação pelo mapa

- **Roda do mouse:** movimentação vertical do canvas.
- **Shift + roda do mouse:** movimentação horizontal.
- **Ctrl + roda do mouse:** zoom em torno do cursor.
- **Duplo clique no canvas vazio:** ajusta a visualização do mapa.
- **Arrastar um nó:** move o nó.
- **Duplo clique em um nó:** inicia sua edição.
- **Duplo clique em uma conexão:** inicia a edição do rótulo.
- **Clique com o botão direito:** abre o menu contextual.
- **Pressionar e segurar em dispositivos móveis:** permite acessar interações contextuais.

## Área de transferência

O BrainWeb mantém um histórico de até **6 itens** copiados.

O histórico pode conter:

- Texto.
- Nós.
- Imagens.
- Seleções múltiplas.
- Conexões.

Ao selecionar um item do histórico, ele se torna o item atual da área de transferência.

## Tecnologias

- React
- React Flow
- JavaScript
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT
- Pydantic
- Uvicorn

## Requisitos

- Node.js e npm.
- Python 3.
- PostgreSQL.

## Instalação e execução local

As instruções a seguir permitem executar a aplicação localmente, explorar seu funcionamento ou preparar um ambiente para contribuir com o desenvolvimento do BrainWeb.

### 1. Clonar o repositório

```bash
git clone https://github.com/compilemyself/brainweb.git
cd brainweb
```

### 2. Instalar as dependências do frontend

```bash
npm install
```

### 3. Configurar o backend

```bash
cd backend
python -m venv .venv
```

No Windows:

```powershell
.venv\Scripts\activate
```

No Linux/macOS:

```bash
source .venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

### 4. Configurar as variáveis de ambiente

Crie um arquivo `.env` a partir de `backend/.env.exemplo`.

Exemplo:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/nome_do_banco
SECRET_KEY=troque_esta_chave
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000
```

### 5. Executar o backend

A partir da pasta `backend`:

```bash
uvicorn app.main:app --reload
```

A API estará disponível, por padrão, em `http://localhost:8000`.

A documentação interativa estará disponível em `http://localhost:8000/docs`.

### 6. Configurar o frontend

Na raiz do projeto, configure:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 7. Executar o frontend

Na raiz do projeto:

```bash
npm start
```

## Scripts disponíveis

```bash
npm start
```

Executa a aplicação em modo de desenvolvimento.

```bash
npm test
```

Executa os testes.

## API

A API é construída com FastAPI e possui documentação automática.

Com o backend em execução, acesse:

`http://localhost:8000/docs`

## Arquitetura

```text
Usuário
   │
   ▼
React + React Flow
   │
   │ HTTP / JSON
   ▼
FastAPI
   │
   ▼
PostgreSQL
```

## Segurança

- Autenticação por JWT.
- Senhas armazenadas utilizando hashing bcrypt.
- Chave secreta configurada por variável de ambiente.
- Configuração de CORS.
- Separação entre configurações do ambiente e código-fonte.