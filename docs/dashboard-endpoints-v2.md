# 📊 Dashboard EcoBin — Guia dos Endpoints (v2.0)

> **Base URL:** `https://<seu-dominio>/api`
> **Autenticação:** todas as rotas exigem `Authorization: Bearer <token>` no header.

---

## O que mudou na v2.0

| # | Mudança |
|---|---|
| ✅ | Novo tipo de usuário: **Proprietário** (`tipo: 4`) |
| ✅ | Novo enum **TipoLixeira** no cadastro e edição de sensores |
| ✅ | Token JWT agora inclui o claim **`condominioId`** |
| ✅ | Novo módulo **`/api/Condominos`** exclusivo para condôminos |
| ✅ | Dashboard usa **`TipoLixeira`** (enum) para identificar recicláveis, substituindo a convenção de nome |

---

## Sumário

- [Usuários — TipoUsuario atualizado](#usuários--tipousuario-atualizado)
- [Sensores — TipoLixeira](#sensores--tipolixeira)
- [Condôminos — módulo exclusivo](#condominos--módulo-exclusivo)
- [Dashboard — sem mudança de rota](#dashboard--sem-mudança-de-rota)

---

## Usuários — TipoUsuario atualizado

### Enum `TipoUsuario`

| Valor | Nome | Descrição |
|---|---|---|
| `0` | `NaoIdentificado` | Padrão |
| `1` | `Administrador` | Acesso total |
| `2` | `Sindico` | Gestão do condomínio |
| `3` | `Coletor` | Operacional de coleta |
| `4` | `Proprietario` | **Novo** — condômino do app |
| `5` | `Aplicativo` | Token do app mobile |
| `6` | `Arduino` | Token do dispositivo ESP |

### Criar um proprietário

```
POST /api/Usuarios
Authorization: Bearer <token-admin>
Content-Type: application/json
```

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senhaHash": "senha123",
  "tipo": 4,
  "condominioId": 1
}
```

**Como chamar com axios:**
```js
const response = await api.post('/Usuarios', {
  nome: 'João Silva',
  email: 'joao@email.com',
  senhaHash: 'senha123',
  tipo: 4,
  condominioId: 1,
});
```

> Apenas `Administrador` pode criar usuários (`AdminOnly`).

---

### Token JWT — novo claim `condominioId`

A partir da v2.0, o token gerado no login contém o claim `condominioId` além de `userId` e `Tipo`.

**Payload do token decodificado:**
```json
{
  "userId": "42",
  "Tipo": "4",
  "condominioId": "1",
  "exp": 1234567890
}
```

> O módulo `/api/Condominos` usa `condominioId` do token automaticamente. O condômino **não precisa passar o ID nas requisições**.

---

## Sensores — TipoLixeira

### Enum `TipoLixeira`

| Valor | Nome | Descrição |
|---|---|---|
| `0` | `NaoDefinido` | Padrão (não classificado) |
| `1` | `Organico` | Lixo orgânico |
| `2` | `Reciclavel` | Reciclável geral |
| `3` | `Papel` | Papel e papelão |
| `4` | `Plastico` | Plástico |
| `5` | `Metal` | Metal / lata |
| `6` | `Vidro` | Vidro |
| `7` | `Rejeito` | Rejeito (não reciclável) |

> Tipos `2, 3, 4, 5, 6` são considerados **recicláveis** nos cálculos de impacto ambiental e volume.

---

### Criar sensor com tipo

```
POST /api/Sensores
Authorization: Bearer <token-admin>
Content-Type: application/json
```

```json
{
  "deviceId": "ESP-001",
  "deviceKey": "chave-secreta",
  "condominioId": 1,
  "nome": "Lixeira Plástico Bloco A",
  "tipo": 4,
  "latitude": -23.5505,
  "longitude": -46.6333
}
```

**Como chamar com axios:**
```js
const response = await api.post('/Sensores', {
  deviceId: 'ESP-001',
  deviceKey: 'chave-secreta',
  condominioId: 1,
  nome: 'Lixeira Plástico Bloco A',
  tipo: 4,
  latitude: -23.5505,
  longitude: -46.6333,
});
```

---

### Editar tipo de um sensor existente

```
PUT /api/Sensores
Authorization: Bearer <token-admin>
Content-Type: application/json
```

```json
{
  "id": 3,
  "tipo": 6
}
```

**Como chamar com axios:**
```js
const response = await api.put('/Sensores', {
  id: 3,
  tipo: 6, // Vidro
});
```

> Todos os campos do `PUT` são opcionais exceto `id`. Envie apenas o que deseja alterar.

---

## Condôminos — módulo exclusivo

> **Policy:** `ProprietarioOrAbove` — acessível por `Proprietario (4)`, `Sindico (2)` e `Administrador (1)`.

**Base:** `GET /api/Condominos/...`

O `condominioId` é lido automaticamente do token JWT. Não é necessário passar na URL.

---

### Home do condômino

Retorna tudo de uma vez: status das lixeiras, impacto do mês e últimas coletas. Use para a **tela inicial do app**.

```
GET /api/Condominos/home
```

**Query param opcional:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `condominioId` | `int` | Sobrescreve o do token (útil para Admin/Síndico) |

**Exemplo de requisição:**
```
GET /api/Condominos/home
```

**Como chamar com axios:**
```js
const response = await api.get('/Condominos/home');
const { lixeiras, impactoMes, ultimasColetas } = response.data.dados;
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Home do condômino carregada.",
  "dados": {
    "lixeiras": [ ... ],
    "impactoMes": { ... },
    "ultimasColetas": [ ... ]
  }
}
```

---

### Status das lixeiras

Nível atual de cada lixeira com indicador de cor e tipo.

```
GET /api/Condominos/lixeiras
```

**Como chamar com axios:**
```js
const response = await api.get('/Condominos/lixeiras');
const lixeiras = response.data.dados;
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Status das lixeiras retornado.",
  "dados": [
    {
      "sensorId": 1,
      "nome": "Lixeira Bloco A",
      "tipoLixeira": "Plastico",
      "nivelOcupacao": 78,
      "statusCor": "amarelo",
      "statusLabel": "Enchendo",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "ultimaLeitura": "2025-01-15T10:22:00Z"
    },
    {
      "sensorId": 2,
      "nome": "Lixeira Entrada",
      "tipoLixeira": "Organico",
      "nivelOcupacao": 95,
      "statusCor": "vermelho",
      "statusLabel": "Lotada",
      "latitude": -23.5510,
      "longitude": -46.6340,
      "ultimaLeitura": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Legenda de `statusCor` e `statusLabel`:**

| `statusCor` | `statusLabel` | Nível |
|---|---|---|
| `"verde"` | `"Livre"` | < 60% |
| `"amarelo"` | `"Enchendo"` | 60% – 89% |
| `"vermelho"` | `"Lotada"` | ≥ 90% |

> Use `statusCor` para pintar o marcador no mapa e `statusLabel` para exibir o texto ao usuário.

---

### Impacto ambiental do mês

Kg reciclados, CO₂ evitado e árvores salvas no mês corrente.

```
GET /api/Condominos/impacto
```

**Como chamar com axios:**
```js
const response = await api.get('/Condominos/impacto');
const { kgReciclados, co2Evitado, arvoresSalvas, periodo } = response.data.dados;
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Impacto do mês calculado.",
  "dados": {
    "kgReciclados": 64.0,
    "co2Evitado": 96.0,
    "arvoresSalvas": 0.64,
    "periodo": "01/01/2025 – 15/01/2025"
  }
}
```

> Considera como recicláveis os sensores com `tipo` igual a `Reciclavel (2)`, `Papel (3)`, `Plastico (4)`, `Metal (5)` ou `Vidro (6)`.

---

### Últimas coletas

Histórico das coletas realizadas (momentos em que a lixeira foi esvaziada).

```
GET /api/Condominos/coletas
```

**Query params opcionais:**

| Parâmetro | Tipo | Padrão |
|---|---|---|
| `limite` | `int` | `10` |

**Como chamar com axios:**
```js
const response = await api.get('/Condominos/coletas', {
  params: { limite: 5 }
});
const coletas = response.data.dados;
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Últimas coletas retornadas.",
  "dados": [
    {
      "sensorId": 1,
      "nomeSensor": "Lixeira Bloco A",
      "dataColeta": "2025-01-14T08:15:00Z"
    },
    {
      "sensorId": 2,
      "nomeSensor": "Lixeira Entrada",
      "dataColeta": "2025-01-12T14:30:00Z"
    }
  ]
}
```

> Uma coleta é detectada quando o nível do sensor cai de ≥ 90% para ≤ 20%.

---

## Dashboard — sem mudança de rota

As rotas do `/api/Dashboard` não mudaram. A única mudança interna é que o cálculo de volume reciclável agora usa o **enum `TipoLixeira`** em vez da convenção de nome do sensor.

**Recicláveis considerados:** `Reciclavel (2)`, `Papel (3)`, `Plastico (4)`, `Metal (5)`, `Vidro (6)`.

Todas as rotas, parâmetros e formatos de resposta do dashboard permanecem iguais à v1.0.
Consulte o guia original em `docs/dashboard-endpoints.md` para referência completa.

---

## Resumo das políticas de acesso

| Policy | Tipos com acesso |
|---|---|
| `AdminOnly` | Administrador |
| `AppOnly` | Administrador, Aplicativo |
| `ArduinoOnly` | Arduino |
| `ProprietarioOrAbove` | Administrador, Síndico, Proprietário |
| `[Authorize]` (sem policy) | Todos os autenticados |

---

## Referência rápida — novos endpoints

| Endpoint | Método | Policy | Descrição |
|---|---|---|---|
| `POST /api/Usuarios` com `tipo: 4` | POST | AdminOnly | Cadastrar proprietário |
| `GET /api/Condominos/home` | GET | ProprietarioOrAbove | Tudo para a tela home |
| `GET /api/Condominos/lixeiras` | GET | ProprietarioOrAbove | Status atual das lixeiras |
| `GET /api/Condominos/impacto` | GET | ProprietarioOrAbove | Impacto ambiental do mês |
| `GET /api/Condominos/coletas` | GET | ProprietarioOrAbove | Histórico de coletas |
