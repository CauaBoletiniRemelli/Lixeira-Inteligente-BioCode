# 📊 Dashboard EcoBin — Guia dos Endpoints

> **Base URL:** `https://<seu-dominio>/api/Dashboard/condominio/{condominioId}`
> **Autenticação:** todas as rotas exigem `Authorization: Bearer <token>` no header.

---

## Sumário

| # | Descrição | Rota |
|---|---|---|
| — | [Dashboard Geral](#-dashboard-geral) | `GET /condominio/{id}` |
| 1 | [Nível ao longo do tempo](#1-nível-das-lixeiras-ao-longo-do-tempo) | `GET /condominio/{id}/nivel-tempo` |
| 2 | [Volume reciclável vs lixo comum](#2-volume-reciclável-vs-lixo-comum) | `GET /condominio/{id}/reciclavel` |
| 3 | [Ranking de lixeiras](#3-ranking-de-lixeiras) | `GET /condominio/{id}/ranking` |
| 4 | [Evolução mensal](#4-evolução-mensal) | `GET /condominio/{id}/evolucao-mensal` |
| 5 | [Eficiência da coleta](#5-eficiência-da-coleta) | `GET /condominio/{id}/eficiencia-coleta` |
| 6 | [Tempo médio de enchimento](#6-tempo-médio-de-enchimento) | `GET /condominio/{id}/tempo-enchimento` |
| 7 | [Alertas e ocorrências](#7-alertas-e-ocorrências) | `GET /condominio/{id}/alertas` |
| 8 | [Impacto ambiental](#8-impacto-ambiental) | `GET /condominio/{id}/impacto-ambiental` |
| 9 | [Uso por dia da semana](#9-uso-por-dia-da-semana) | `GET /condominio/{id}/uso-dia-semana` |
| 10 | [Economia estimada](#10-economia-estimada) | `GET /condominio/{id}/economia` |

---

## Formato de resposta padrão

Todos os endpoints retornam o mesmo envelope:

```json
{
  "status": true,
  "mensagem": "...",
  "dados": { ... }
}
```

Se `status` for `false`, o campo `mensagem` descreve o erro.

---

## Parâmetros de filtro de data

A maioria dos endpoints aceita os parâmetros abaixo via **query string**.
Se omitidos, o padrão é **últimos 30 dias**.

| Parâmetro | Formato | Exemplo |
|---|---|---|
| `dataInicio` | ISO 8601 | `2025-01-01` |
| `dataFim` | ISO 8601 | `2025-01-31` |

---

## ⚡ Dashboard Geral

Retorna **todos os KPIs de uma vez**. Ideal para a tela inicial do síndico, evitando múltiplas requisições.

```
GET /api/Dashboard/condominio/{condominioId}
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Dashboard geral calculado.",
  "dados": {
    "alertas": { ... },
    "impactoAmbiental": { ... },
    "economia": { ... },
    "rankingLixeiras": [ ... ],
    "usoPorDiaSemana": [ ... ],
    "evolucaoMensal": [ ... ]
  }
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const dashboard = response.data.dados;
```

---

## 1. Nível das lixeiras ao longo do tempo

Série temporal com média de ocupação por sensor. Use para gráfico de **linhas**.

```
GET /api/Dashboard/condominio/{condominioId}/nivel-tempo
```

**Query params:**

| Parâmetro | Opções | Padrão |
|---|---|---|
| `dataInicio` | ISO 8601 | Últimos 30 dias |
| `dataFim` | ISO 8601 | Hoje |
| `granularidade` | `Hora` \| `Dia` \| `Semana` \| `Mes` | `Dia` |

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/nivel-tempo?dataInicio=2025-01-01&dataFim=2025-01-31&granularidade=Dia
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Série temporal calculada.",
  "dados": [
    {
      "sensorId": 1,
      "nomeSensor": "Lixeira Bloco A",
      "serie": [
        { "periodo": "2025-01-01T00:00:00", "mediaNivel": 43.5, "maximoNivel": 78 },
        { "periodo": "2025-01-02T00:00:00", "mediaNivel": 61.0, "maximoNivel": 95 }
      ]
    }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/nivel-tempo`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31', granularidade: 'Dia' }
});
const series = response.data.dados; // array de sensores, cada um com sua serie[]
```

> Use `serie[i].periodo` como eixo X e `serie[i].mediaNivel` como eixo Y do gráfico.

---

## 2. Volume reciclável vs lixo comum

Proporção de leituras de lixeiras recicláveis vs comuns. Use para **pizza** ou **barra empilhada**.

```
GET /api/Dashboard/condominio/{condominioId}/reciclavel
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/reciclavel?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Volume reciclável calculado.",
  "dados": {
    "totalLeituras": 1200,
    "leiturasReciclavel": 480,
    "leiturasLixoComum": 720,
    "percentualReciclavel": 40.0,
    "porSensor": [
      {
        "sensorId": 2,
        "nomeSensor": "Lixeira Reciclável Bloco B",
        "leiturasReciclavel": 480,
        "leiturasLixoComum": 0
      }
    ]
  }
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/reciclavel`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const { percentualReciclavel, leiturasReciclavel, leiturasLixoComum } = response.data.dados;
```

> **Convenção:** sensores cujo `nome` contenha `"recicl"` (case-insensitive) são classificados como recicláveis.

---

## 3. Ranking de lixeiras

Lixeiras ordenadas da mais utilizada para a menos. Use para **barras horizontais**.

```
GET /api/Dashboard/condominio/{condominioId}/ranking
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/ranking?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Ranking calculado.",
  "dados": [
    {
      "sensorId": 3,
      "nomeSensor": "Lixeira Entrada",
      "mediaOcupacao": 74.2,
      "totalEsvaziamentos": 8,
      "alertasCheio": 12
    },
    {
      "sensorId": 1,
      "nomeSensor": "Lixeira Bloco A",
      "mediaOcupacao": 55.1,
      "totalEsvaziamentos": 5,
      "alertasCheio": 4
    }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/ranking`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const ranking = response.data.dados; // já vem ordenado do mais cheio para o menos
```

> O array já vem ordenado por `mediaOcupacao` decrescente. O índice `0` é a lixeira mais problemática.

---

## 4. Evolução mensal

Resumo mês a mês: média de ocupação, coletas e alertas. Use para **colunas** ou **linha**.

```
GET /api/Dashboard/condominio/{condominioId}/evolucao-mensal
```

**Query params:**

| Parâmetro | Tipo | Padrão |
|---|---|---|
| `meses` | número inteiro | `6` |

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/evolucao-mensal?meses=6
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Evolução mensal calculada.",
  "dados": [
    {
      "ano": 2024,
      "mes": 11,
      "mesNome": "nov/2024",
      "mediaOcupacaoGeral": 52.1,
      "totalColetas": 18,
      "totalAlertas": 9
    },
    {
      "ano": 2025,
      "mes": 1,
      "mesNome": "jan/2025",
      "mediaOcupacaoGeral": 58.3,
      "totalColetas": 24,
      "totalAlertas": 17
    }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/evolucao-mensal`, {
  params: { meses: 6 }
});
const evolucao = response.data.dados; // array ordenado do mês mais antigo para o mais recente
```

> Use `mesNome` como label do eixo X e `mediaOcupacaoGeral` ou `totalColetas` como eixo Y.

---

## 5. Eficiência da coleta

Compara coletas realizadas com coletas realmente necessárias por lixeira. Use para **barras agrupadas**.

```
GET /api/Dashboard/condominio/{condominioId}/eficiencia-coleta
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/eficiencia-coleta?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Eficiência calculada.",
  "dados": [
    {
      "sensorId": 1,
      "nomeSensor": "Lixeira Bloco A",
      "totalEsvaziamentos": 10,
      "esvaziamentosNecessarios": 7,
      "esvaziamentosEvitaveis": 3,
      "percentualEficiencia": 70.0
    }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/eficiencia-coleta`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const eficiencia = response.data.dados;
```

> `esvaziamentosEvitaveis` é o número de coletas que ocorreram antes da lixeira atingir o nível crítico (≥ 90%).

---

## 6. Tempo médio de enchimento

Quanto tempo cada lixeira demora para encher + previsão da próxima coleta necessária.

```
GET /api/Dashboard/condominio/{condominioId}/tempo-enchimento
```

Não possui parâmetros de filtro. Usa todo o histórico disponível para calcular a média.

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/tempo-enchimento
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Tempo médio de enchimento calculado.",
  "dados": [
    {
      "sensorId": 1,
      "nomeSensor": "Lixeira Bloco A",
      "tempoMedioHoras": 18.5,
      "nivelAtual": 62,
      "previsaoCheia": "2025-01-16T14:30:00Z"
    },
    {
      "sensorId": 2,
      "nomeSensor": "Lixeira Reciclável Bloco B",
      "tempoMedioHoras": null,
      "nivelAtual": 30,
      "previsaoCheia": null
    }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/tempo-enchimento`);
const tempos = response.data.dados;
```

> `tempoMedioHoras` e `previsaoCheia` podem ser `null` quando não há histórico de enchimento completo (do nível baixo até ≥ 90%) para o sensor.

---

## 7. Alertas e ocorrências

Situação atual de todas as lixeiras do condomínio: quais estão lotadas e quais estão offline.

```
GET /api/Dashboard/condominio/{condominioId}/alertas
```

Não possui parâmetros. Reflete o **estado atual** (tempo real).

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/alertas
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Alertas verificados.",
  "dados": {
    "totalAlertasCheio": 34,
    "sensoresLotadosAgora": 2,
    "sensoresOffline": 1,
    "detalhes": [
      {
        "sensorId": 1,
        "nomeSensor": "Lixeira Bloco A",
        "nivelAtual": 95,
        "ultimaLeitura": "2025-01-15T10:22:00Z",
        "lotado": true,
        "offline": false
      },
      {
        "sensorId": 3,
        "nomeSensor": "Lixeira Garagem",
        "nivelAtual": 0,
        "ultimaLeitura": "2025-01-13T08:00:00Z",
        "lotado": false,
        "offline": true
      }
    ]
  }
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/alertas`);
const { sensoresLotadosAgora, sensoresOffline, detalhes } = response.data.dados;

const lotadas = detalhes.filter(d => d.lotado);
const offline = detalhes.filter(d => d.offline);
```

> Um sensor é considerado **offline** se não enviou nenhuma leitura nas últimas **2 horas**.
> `totalAlertasCheio` conta alertas dos **últimos 30 dias**.

---

## 8. Impacto ambiental

Estimativas de kg reciclados, CO₂ evitado e árvores salvas no período. Use para **cards de impacto**.

```
GET /api/Dashboard/condominio/{condominioId}/impacto-ambiental
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/impacto-ambiental?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Impacto ambiental calculado.",
  "dados": {
    "kgReciclados": 96.0,
    "co2Evitado": 144.0,
    "arvoresSalvas": 0.96,
    "totalColetas": 24,
    "periodo": "01/01/2025 – 31/01/2025"
  }
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/impacto-ambiental`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const { kgReciclados, co2Evitado, arvoresSalvas } = response.data.dados;
```

> **Estimativas usadas:**
> - 1 leitura de sensor reciclável ≈ 2 kg coletados
> - 1 kg reciclado evita 1,5 kg de CO₂
> - 100 kg reciclados ≈ 1 árvore salva

---

## 9. Uso por dia da semana

Média de ocupação agrupada por dia da semana. Use para **heatmap** ou **barras**.

```
GET /api/Dashboard/condominio/{condominioId}/uso-dia-semana
```

**Query params opcionais:** `dataInicio`, `dataFim`

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/uso-dia-semana?dataInicio=2025-01-01&dataFim=2025-01-31
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Uso por dia da semana calculado.",
  "dados": [
    { "numeroDia": 0, "diaSemana": "Domingo",  "mediaOcupacao": 71.2, "totalLeituras": 340 },
    { "numeroDia": 1, "diaSemana": "Segunda",  "mediaOcupacao": 52.4, "totalLeituras": 410 },
    { "numeroDia": 2, "diaSemana": "Terça",    "mediaOcupacao": 49.0, "totalLeituras": 398 },
    { "numeroDia": 3, "diaSemana": "Quarta",   "mediaOcupacao": 50.3, "totalLeituras": 402 },
    { "numeroDia": 4, "diaSemana": "Quinta",   "mediaOcupacao": 53.1, "totalLeituras": 390 },
    { "numeroDia": 5, "diaSemana": "Sexta",    "mediaOcupacao": 68.9, "totalLeituras": 390 },
    { "numeroDia": 6, "diaSemana": "Sábado",   "mediaOcupacao": 74.0, "totalLeituras": 360 }
  ]
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/uso-dia-semana`, {
  params: { dataInicio: '2025-01-01', dataFim: '2025-01-31' }
});
const usoDia = response.data.dados; // sempre ordenado de Domingo (0) a Sábado (6)
```

> `numeroDia`: `0` = Domingo, `1` = Segunda … `6` = Sábado.
> Dias sem nenhuma leitura no período não aparecerão no array.

---

## 10. Economia estimada

Traduz coletas evitadas em valor financeiro. Use como **KPI principal** para o síndico.

```
GET /api/Dashboard/condominio/{condominioId}/economia
```

**Query params:**

| Parâmetro | Tipo | Padrão |
|---|---|---|
| `dataInicio` | ISO 8601 | Últimos 30 dias |
| `dataFim` | ISO 8601 | Hoje |
| `custoMedioColeta` | número (R$) | `150` |

**Exemplo de requisição:**
```
GET /api/Dashboard/condominio/1/economia?dataInicio=2025-01-01&dataFim=2025-01-31&custoMedioColeta=150
```

**Exemplo de resposta:**
```json
{
  "status": true,
  "mensagem": "Economia estimada calculada.",
  "dados": {
    "coletasRealizadas": 10,
    "coletasEvitadas": 3,
    "custoMedioColeta": 150.0,
    "economiaTotalEstimada": 450.0,
    "periodo": "01/01/2025 – 31/01/2025"
  }
}
```

**Como chamar com axios:**
```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/economia`, {
  params: {
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
    custoMedioColeta: 150
  }
});
const { economiaTotalEstimada, coletasEvitadas } = response.data.dados;
```

> Ajuste `custoMedioColeta` conforme o valor real cobrado pela empresa de coleta do condomínio.

---

## Tratamento de erros

Sempre verifique `response.data.status` antes de usar os dados:

```js
const response = await api.get(`/Dashboard/condominio/${condominioId}/alertas`);

if (!response.data.status) {
  console.error(response.data.mensagem);
  return;
}

const dados = response.data.dados;
```

Para erros de rede, envolva em `try/catch`:

```js
try {
  const response = await api.get(`/Dashboard/condominio/${condominioId}/alertas`);
  if (!response.data.status) throw new Error(response.data.mensagem);
  const dados = response.data.dados;
} catch (error) {
  console.error('Erro ao buscar alertas:', error.message);
}
```

---

## Referência rápida

| Endpoint | Método | Parâmetros extras | Gráfico sugerido |
|---|---|---|---|
| `/condominio/{id}` | GET | `dataInicio`, `dataFim` | Cards / Resumo |
| `/condominio/{id}/nivel-tempo` | GET | `dataInicio`, `dataFim`, `granularidade` | Linha (time series) |
| `/condominio/{id}/reciclavel` | GET | `dataInicio`, `dataFim` | Pizza / Barra empilhada |
| `/condominio/{id}/ranking` | GET | `dataInicio`, `dataFim` | Barra horizontal |
| `/condominio/{id}/evolucao-mensal` | GET | `meses` | Coluna / Linha |
| `/condominio/{id}/eficiencia-coleta` | GET | `dataInicio`, `dataFim` | Barras agrupadas |
| `/condominio/{id}/tempo-enchimento` | GET | — | KPI + Barra |
| `/condominio/{id}/alertas` | GET | — | Cards de alerta |
| `/condominio/{id}/impacto-ambiental` | GET | `dataInicio`, `dataFim` | Cards |
| `/condominio/{id}/uso-dia-semana` | GET | `dataInicio`, `dataFim` | Heatmap / Barra |
| `/condominio/{id}/economia` | GET | `dataInicio`, `dataFim`, `custoMedioColeta` | KPI |
