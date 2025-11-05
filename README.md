# Sistema de Gerenciamento de Artigos

Sistema REST API para gerenciamento de artigos com autenticação JWT e sistema de permissões.

## Tecnologias

- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM
- **JWT** - Autenticação
- **Docker & Docker Compose** - Containerização

## Requisitos

- Docker e Docker Compose instalados

## Como executar

### Desenvolvimento

```bash
docker compose up --build
```

A aplicação estará disponível em `http://localhost:3000`

A API estará disponível no prefixo `/api`

### Usuário Root

Ao iniciar pela primeira vez, o sistema cria automaticamente um usuário root:

- **Email:** `root@admin.com`
- **Password:** `root123`
- **Permissão:** ADMIN

## Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login e obter token JWT

### Usuários (Apenas ADMIN)
- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `POST /api/users` - Criar usuário
- `PATCH /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário (soft delete)

### Artigos
- `GET /api/articles` - Listar todos os artigos (READER, EDITOR, ADMIN)
- `GET /api/articles/:id` - Buscar artigo por ID (READER, EDITOR, ADMIN)
- `POST /api/articles` - Criar artigo (EDITOR, ADMIN)
- `PATCH /api/articles/:id` - Atualizar artigo (EDITOR, ADMIN)
- `DELETE /api/articles/:id` - Excluir artigo (EDITOR, ADMIN)

## Permissões

- **ADMIN (1):** Acesso completo a usuários e artigos
- **EDITOR (2):** Acesso completo a artigos (criar, editar, excluir)
- **READER (1):** Apenas leitura de artigos

## Estrutura do Projeto

```
src/
├── auth/              # Módulo de autenticação
├── users/             # Módulo de usuários
├── articles/          # Módulo de artigos
├── common/            # Guards, decorators e enums compartilhados
├── config/            # Configurações (banco de dados, seeds)
├── entities/          # Entidades do banco de dados
└── migrations/        # Migrations do banco de dados
```
