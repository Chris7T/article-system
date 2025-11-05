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

### Documentação da API

A documentação interativa da API está disponível em:

```
http://localhost:3000/api/docs
```

A documentação é gerada automaticamente pelo Swagger e inclui:
- Descrição de todos os endpoints
- Parâmetros de requisição
- Exemplos de requisições e respostas
- Teste de endpoints diretamente no navegador

### Testes

O projeto possui testes que cobrem todos os endpoints da API.

Para executar os testes:

```bash
npm run test:e2e
```

Os testes utilizam SQLite em memória e são executados de forma isolada.

### Usuário Root

Ao iniciar pela primeira vez, o sistema cria automaticamente um usuário root:

- **Email:** `root@admin.com`
- **Password:** `root123`
- **Permissão:** ADMIN


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
