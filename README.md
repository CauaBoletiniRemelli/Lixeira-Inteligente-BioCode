# EcoBin — A Lixeira Automatizada

> Projeto da **Usina de Projetos Experimentais (UPX 3)** — Centro Universitário Facens, Sorocaba/SP · 2026
> Grupo **BioCode** · Orientadora: **Prof.ª Daniela Costa de Sena**

O **EcoBin** é um protótipo de lixeira inteligente e sustentável pensado para **condomínios**. Um **Arduino** com sensor de distância mede o nível de ocupação da lixeira e envia as leituras para uma **API em ASP.NET Core**, que grava os dados em **SQL Server** e os disponibiliza para um **aplicativo mobile em React Native (Expo)**. Lá, síndicos, coletores e moradores acompanham as lixeiras em um mapa, recebem alertas quando uma delas enche e registram a coleta de **óleo de cozinha usado**. O protótipo é alimentado por **energia solar** (painel fotovoltaico + bateria), e a API também recebe a telemetria de tensão do painel e da bateria.

---

## Sumário

- [Problema e proposta](#problema-e-proposta)
- [Como funciona](#como-funciona)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como executar localmente](#como-executar-localmente)
- [Fluxo de trabalho com Git](#fluxo-de-trabalho-com-git)
- [Integrantes](#integrantes)
- [Referências](#referências)

---

## Problema e proposta

Em muitos condomínios as lixeiras enchem antes da coleta, o que causa **transbordamento, mau cheiro e sujeira**. Além disso, o **óleo de cozinha usado** costuma ser descartado em pias e ralos, com impacto ambiental.

**Objetivo geral:** melhorar a gestão dos resíduos sólidos e do óleo de cozinha usado em condomínios, incentivando o descarte correto, a organização da coleta e a adoção de práticas sustentáveis.

**O EcoBin propõe:**

- monitorar automaticamente o volume de resíduos com sensores conectados ao Arduino;
- classificar a ocupação por cores (🟢 baixa · 🟠 intermediária · 🔴 cheia, hora da coleta);
- transmitir, armazenar e exibir esses dados no aplicativo, com mapa das lixeiras e alerta ao responsável;
- alimentar o sistema com energia solar, reduzindo a dependência da rede elétrica;
- oferecer um ponto adequado para armazenar o óleo de cozinha usado e registrar as coletas.

---

## Como funciona

```
 Painel solar ──► Bateria ──► Arduino + sensor de distância
                                    │
                                    │ POST /api/Telemetrias/arduino
                                    ▼
                         API ASP.NET Core (JWT) ──► SQL Server
                                    │
                                    ▼
                     Aplicativo mobile (React Native / Expo)
             mapa · níveis por cor · alertas · coleta de óleo · dashboard
```

1. O **sensor** mede a distância entre o topo da lixeira e os resíduos, e o **Arduino** converte essa medida em percentual de ocupação:

   ```
   ocupação (%) = (altura_útil − distância_medida) / altura_útil × 100
   ```

2. O Arduino se autentica na API (`POST /api/Auth/ArduinoLogin`) e envia a leitura para `POST /api/Telemetrias/arduino`, com o nível de lixo e, opcionalmente, bateria, temperatura, umidade e tensões do painel solar e da bateria.
3. A API grava a telemetria no SQL Server, atualiza o status do sensor e gera um **alerta de lixeira cheia** a partir de 90% de ocupação, enviado como notificação push.
4. No **aplicativo**, as lixeiras aparecem no mapa com a cor do nível de ocupação: 🟢 abaixo de 40%, 🟠 de 40% a 79% e 🔴 a partir de 80%.
5. A configuração de uma nova lixeira é feita pelo app: o administrador gera um **QR Code de provisionamento**, o app lê o código e envia as credenciais de Wi-Fi para o dispositivo.

### Perfis de usuário

| Perfil | O que faz no app |
|---|---|
| Administrador | Gerencia condomínios, usuários, sensores e QR Codes de provisionamento |
| Síndico | Acompanha as lixeiras e o dashboard do seu condomínio |
| Coletor | Vê as lixeiras que precisam de coleta no painel do coletor |
| Proprietário / condômino | Consulta as lixeiras do condomínio e registra o descarte de óleo |

---

## Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| **Hardware** | Arduino, sensor de distância, painel solar fotovoltaico e bateria |
| **Back-end (API)** | C# · ASP.NET Core 8 (Web API) · Entity Framework Core 8 · autenticação JWT Bearer · BCrypt (hash de senhas) · QRCoder · Swagger |
| **Banco de dados** | SQL Server (migrations do EF Core) |
| **Aplicativo mobile** | React Native 0.81 · Expo SDK 54 · TypeScript · Axios · expo-location (mapa) · expo-camera (leitura de QR Code) · OneSignal (notificações push) · react-native-chart-kit (gráficos) |
| **Landing Page** | HTML5, CSS3 e JavaScript |
| **Hospedagem da API** | MonsterASP.NET (`ecobinapi.runasp.net`) |
| **Versionamento** | Git e GitHub |

---

## Estrutura do repositório

```
Lixeira-Inteligente-BioCode/
├── backend/
│   └── ApiEcoBin/          # API ASP.NET Core
│       ├── Controllers/    # Endpoints (Auth, Telemetrias, Sensores, Condominios, Dashboard, OleoColetas...)
│       ├── Services/       # Regras de negócio
│       ├── Models/         # Entidades do banco
│       ├── Dto/            # Objetos de entrada e saída da API
│       ├── Data/           # AppDbContext (Entity Framework)
│       ├── Migrations/     # Migrations do banco de dados
│       └── Program.cs      # Configuração da aplicação (JWT, banco, Swagger)
├── mobile/
│   └── ecobin/             # Aplicativo React Native (Expo)
│       └── src/
│           ├── screens/    # Telas (mapa, dashboard, login, sensores, QR Code...)
│           ├── services/   # Chamadas à API
│           ├── components/ # Componentes reutilizáveis
│           ├── contexts/   # Contexto de autenticação
│           └── navigation/ # Rotas do app
├── landingpage/
│   └── index.html          # Página de apresentação do EcoBin
├── docs/                   # Documentação dos endpoints do dashboard
└── README.md
```

---

## Como executar localmente

### Pré-requisitos

- [Git](https://git-scm.com/)
- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads) (Express ou LocalDB já servem)
- [Node.js](https://nodejs.org/) (versão LTS) e [Yarn](https://classic.yarnpkg.com/)
- [Android Studio](https://developer.android.com/studio) com um emulador, ou um celular Android com depuração USB

### 1. Clonar o repositório

```bash
git clone https://github.com/CauaBoletiniRemelli/Lixeira-Inteligente-BioCode.git
cd Lixeira-Inteligente-BioCode
```

### 2. Configurar e rodar a API

```bash
cd backend/ApiEcoBin
```

Crie o arquivo `appsettings.Development.json` (ele não é versionado, porque guarda credenciais):

```json
{
  "ConnectionStrings": {
    "LocalConnection": "Server=localhost;Database=EcoBin;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "uma-chave-secreta-com-pelo-menos-32-caracteres",
    "Issuer": "ApiEcoBin",
    "Audience": "EcoBinApp"
  },
  "AppCredentials": {
    "AppId": "ecobin-mobile-app",
    "AppSecret": "segredo-do-app"
  },
  "ArduinoCredentials": {
    "ArduinoId": "ecobin-arduino",
    "ArduinoSecret": "segredo-do-arduino"
  },
  "OneSignal": {
    "AppId": "",
    "ApiKey": ""
  }
}
```

Depois crie o banco e suba a API:

```bash
dotnet restore
dotnet tool install --global dotnet-ef   # só na primeira vez
dotnet ef database update                # cria o banco a partir das migrations
dotnet run --launch-profile http
```

A API sobe em `http://localhost:5244` e a documentação interativa fica em **http://localhost:5244/swagger**.

> Os campos do `OneSignal` só são necessários para testar as notificações push. Sem eles, o restante da API funciona normalmente.

### 3. Configurar e rodar o aplicativo mobile

```bash
cd mobile/ecobin
yarn install
```

Crie o arquivo `.env` na pasta `mobile/ecobin`:

```env
API_URL=http://10.0.2.2:5244/api
APP_ID=ecobin-mobile-app
APP_SECRET=segredo-do-app
NODE_ENV=development
ENABLE_DEBUG=true
```

- `APP_ID` e `APP_SECRET` precisam ser iguais aos de `AppCredentials` no `appsettings.Development.json` da API.
- `10.0.2.2` é o endereço do computador visto de dentro do emulador Android. Em um celular físico, use o IP do computador na rede local (ex.: `http://192.168.0.10:5244/api`).
- Sem `.env`, o app usa por padrão a API publicada em `https://ecobinapi.runasp.net/api`.

Rode o app no Android:

```bash
yarn android
```

> O app usa bibliotecas nativas (OneSignal e câmera), por isso precisa de um build de desenvolvimento (`yarn android`). Ele não roda completo no Expo Go.

### 4. Landing Page

Abra `landingpage/index.html` direto no navegador, ou sirva a pasta com a extensão **Live Server** do VS Code.

### 5. Protótipo físico (Arduino)

O Arduino conversa com a API em duas etapas:

1. **Login:** `POST /api/Auth/ArduinoLogin` com as credenciais de `ArduinoCredentials`, que devolve um token JWT.
2. **Envio da leitura:** `POST /api/Telemetrias/arduino` com o header `Authorization: Bearer <token>` e um corpo como:

```json
{
  "sensorId": 1,
  "nivelLixo": 72.5,
  "distancia": 8.3,
  "bateria": 86,
  "tensaoBateria": 3.9,
  "tensaoPainel": 5.4
}
```

Somente `sensorId` e `nivelLixo` (0 a 100) são obrigatórios. Os demais campos de energia solar são opcionais e, quando enviados, aparecem no dashboard do app.

> **Dica de teste:** valide cada parte separadamente — sensor → alimentação solar/bateria → envio para a API (dá para simular o Arduino pelo Swagger) → exibição no app — antes de integrar tudo.

---

## Fluxo de trabalho com Git

O desenvolvimento foi organizado em branches por etapa, integradas na `main` via Pull Request:

| Branch | Uso |
|---|---|
| `main` | Versão estável, apresentada no vídeo |
| `criacao-backend` | Criação inicial da API, banco de dados e autenticação |
| `front-end` | Desenvolvimento do aplicativo mobile |
| `2-semestre-backend` | Evoluções do 2º semestre: tipos de lixeira, condôminos, dashboard, energia solar e coleta de óleo |

**Para contribuir:**

```bash
git checkout main
git pull
git checkout -b feature/minha-funcionalidade
# ...alterações...
git add .
git commit -m "feat(api): cria endpoint de coleta de óleo"
git push -u origin feature/minha-funcionalidade
# abra um Pull Request para a main no GitHub
```

**Padrão de mensagens de commit** ([Conventional Commits](https://www.conventionalcommits.org/pt-br/)):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `refactor:` reorganização de código
- `chore:` configurações e manutenção

A participação de cada integrante pode ser conferida em **Insights → Contributors** no GitHub ou com:

```bash
git shortlog -sn --all
```

---

## Integrantes

**Grupo BioCode**

| Integrante | RA |
|---|---|
| Alexssandro Gabriel de Almeida Silva | 252584 |
| Arthur Scatena de Souza | 252675 |
| Cauã Boletini Remelli | 252587 |
| Erick Arruda Rodrigues | 252619 |
| Lucas Ratti *(líder)* | 252540 |

**Orientadora:** Prof.ª Daniela Costa de Sena

---

## Referências

- ARDUINO. *Arduino UNO Rev3: documentation*. Disponível em: Arduino Docs.
- EMPRESA DE PESQUISA ENERGÉTICA (EPE). *Balanço Energético Nacional 2026: ano base 2025*. Rio de Janeiro: EPE, 2026.
- SOSUNOVA, I.; PORRAS, J. IoT-enabled smart waste management systems for smart cities: a systematic review. *IEEE Access*, v. 10, p. 73326-73363, 2022. DOI: 10.1109/ACCESS.2022.3188308.
- ZOUMPOULIS, P. et al. Smart bins for enhanced resource recovery and sustainable urban waste practices in smart cities: a systematic literature review. *Cities*, v. 152, 105150, 2024. DOI: 10.1016/j.cities.2024.105150.
- ZUCATTO, L. C.; WELLE, I.; SILVA, T. N. Cadeia reversa do óleo de cozinha: coordenação, estrutura e aspectos relacionais. *Revista de Administração de Empresas*, v. 53, n. 5, p. 442-453, 2013. DOI: 10.1590/S0034-75902013000500003.

---

<p align="center">Feito pelo grupo BioCode · Facens 2026</p>
