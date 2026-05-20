# Backend Sessi (Node + Express)

API REST para login e cadastro do frontend.

## Como rodar

```bash
npm install
npm run dev
```

Servidor: **http://localhost:3001**

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Verifica se a API está online |
| POST | `/api/cadastro` | Cadastra usuário |
| POST | `/api/login` | Autentica usuário |

### Cadastro — `POST /api/cadastro`

```json
{
  "nome": "Jean",
  "email": "jean@email.com",
  "cpf": "071.544.831-56",
  "senha": "123456",
  "confirmarSenha": "123456"
}
```

### Login — `POST /api/login`

```json
{
  "email": "jean@email.com",
  "senha": "123456"
}
```

Usuários são salvos em `data/usuarios.json`.
