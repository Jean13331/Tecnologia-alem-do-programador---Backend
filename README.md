# Backend Sesi (Node + Express)

API REST para login e cadastro do frontend.

## Como rodar

1. Copie `.env.example` para `.env` e coloque sua `GEMINI_API_KEY` do [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
npm run dev
```

O chat usa o **Gemini** para responder como ChatBot após cada mensagem do usuário.

Servidor: **http://localhost:3001**

## Swagger (documentação interativa)

Abra no navegador: **http://localhost:3001/api/docs**

- **GET** (verde/azul): só lê dados — listar usuários, mensagens, health
- **POST** (verde): envia JSON no body — cadastro, login, chat, moedas
- **DELETE** (vermelho): remove — limpar chat

JSON bruto da spec: `http://localhost:3001/api/docs/openapi.json`

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Verifica se a API está online |
| POST | `/api/cadastro` | Cadastra usuário |
| POST | `/api/login` | Autentica usuário |
| GET | `/api/usuarios` | Lista todos os usuários (dados completos, incluindo senha) |
| GET | `/api/usuarios/:id` | Busca um usuário por ID |
| POST | `/api/usuarios/:id/moedas` | Adiciona moedas ao usuário |
| GET | `/api/chat` | Lista mensagens do chat |
| POST | `/api/chat` | Envia mensagem (custa **15 moedas**) |
| DELETE | `/api/chat` | Limpa todas as mensagens da conversa |

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

### Chat — `POST /api/chat`

**Demonstração de falhas de segurança (intencional):** o servidor confia nos dados do corpo da requisição.

- O **frontend** envia `moedasDescontar: 15` e valida saldo na tela (fácil de burlar no proxy).
- O **backend** só usa o valor de `moedasDescontar` do POST (não força 15 no servidor).
- Retorna **402** se o saldo for menor que o valor **enviado** em `moedasDescontar` (quando for positivo).

```json
{
  "usuarioId": "id-de-quem-aparece-na-mensagem",
  "usuarioCobrancaId": "id-de-quem-paga-as-moedas",
  "nome": "Jean",
  "texto": "Olá",
  "moedasDescontadas": 0
}
```

Campo obrigatório no POST: **`moedasDescontar`** (número, negativo ou expressão como `"15-30"`).

**Exemplos para a apresentação (Postman / Caido):**

1. `"moedasDescontar": 0` — mensagem sem gastar moedas.
2. `"moedasDescontar": -15` — **adiciona** 15 moedas (desconto negativo).
3. `"moedasDescontar": "15-30"` — expressão resulta em -15 (também adiciona 15).
4. `"usuarioCobrancaId": "<id de outro>"` — debita (ou credita) outro usuário.

No **Caido**, edite o JSON interceptado e **adicione** o campo antes de dar Forward — o site não envia `moedasDescontar` sozinho.

Usuários são salvos em `data/usuarios.json`.
