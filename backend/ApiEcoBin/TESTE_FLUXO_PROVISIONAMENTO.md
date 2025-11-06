# 🧪 Guia de Teste Completo - Fluxo de Provisionamento de Sensores

## 📋 Pré-requisitos
Antes de começar, você precisa:
1. Ter um usuário ADMIN criado no sistema
2. Ter um condomínio criado
3. Fazer login como ADMIN para obter o token JWT

---

## 🔐 Passo 0: Login como Admin

**Endpoint:** `POST /api/Auth/login`

**Body:**
```json
{
  "email": "admin@example.com",
  "senha": "SuaSenha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

**⚠️ IMPORTANTE:** Copie o `token` e clique em "Authorize" no Swagger, cole o token.

---

## 📍 Passo 1: Criar um Provisionamento

**Endpoint:** `POST /api/Provisionamentos/criar` 🔒 (Admin Only)

**Body:**
```json
{
  "sensorId": 1,
  "usuarioId": 1,
  "expiracaoDias": 7
}
```

**Resposta:**
```json
{
  "status": true,
  "mensagem": "Provisionamento criado com sucesso.",
  "dados": {
    "id": 1,
    "sensorId": 1,
    "usuarioId": 1,
    "expiracao": "2025-11-13T00:00:00Z",
    "usado": false,
    "criadoEm": "2025-11-06T10:30:00Z"
  }
}
```

**📝 Anote:** `id: 1` (você vai usar no próximo passo)

---

## 🎨 Passo 2: Gerar QR Code

**Endpoint:** `GET /api/Provisionamentos/gerar-qr/1` 🔒 (Admin Only)

**Parâmetro:** `provisionId = 1` (o ID do passo anterior)

**Resposta:** Imagem PNG do QR Code

**📸 O QR Code contém:**
```
1|DEVICE_ID_123|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Formato: `provisionId|deviceId|jwt`

**💡 Para testar:** Salve a imagem e use um leitor de QR Code para ver o conteúdo.

---

## 📱 Passo 3: Síndico Ativa o Provisionamento (Simula o App)

**Endpoint:** `POST /api/Provisionamentos/ativar-qr` 🔒 (Requer autenticação)

**⚠️ Primeiro:** Faça login como SÍNDICO e pegue o token dele.

**Body:**
```json
{
  "provisionId": "1",
  "deviceId": "DEVICE_ID_123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "condominioId": 1,
  "nomeSensor": "Lixeira Bloco A",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "wifiSSID": "MinhaRedeWiFi",
  "wifiPassword": "SenhaSegura123"
}
```

**Campos:**
- `provisionId`, `deviceId`, `token`: Extraídos do QR Code
- `condominioId`: ID do condomínio
- `nomeSensor`: Nome amigável do sensor
- `latitude/longitude`: Localização GPS
- `wifiSSID/wifiPassword`: Credenciais da rede Wi-Fi

**Resposta:**
```json
{
  "status": true,
  "dados": {
    "success": true,
    "deviceId": "DEVICE_ID_123",
    "sensorId": 1,
    "sessionToken": "ABC123XYZ789==",
    "sessionExpires": "2025-11-06T10:50:00Z",
    "message": "Provisionamento criado. Use sessionToken para configurar o sensor via AP."
  }
}
```

**📝 Anote:** 
- `sessionToken: "ABC123XYZ789=="` 
- `deviceId: "DEVICE_ID_123"`

---

## 📡 Passo 4: Dispositivo Busca Credenciais Wi-Fi

**Endpoint:** `GET /api/Devices/{deviceId}/wifi-credentials?sessionToken={token}` 🌐 (Público)

**Exemplo:**
```
GET /api/Devices/DEVICE_ID_123/wifi-credentials?sessionToken=ABC123XYZ789==
```

**Resposta:**
```json
{
  "status": true,
  "mensagem": "Credenciais Wi-Fi recuperadas com sucesso.",
  "dados": {
    "ssid": "MinhaRedeWiFi",
    "password": "SenhaSegura123",
    "sessionExpires": "2025-11-06T10:50:00Z",
    "deviceId": "DEVICE_ID_123"
  }
}
```

**✅ O dispositivo agora tem:**
- SSID da rede
- Senha da rede
- Pode se conectar ao Wi-Fi!

---

## ✅ Passo 5: Dispositivo Confirma Configuração

**Endpoint:** `POST /api/Devices/{deviceId}/confirm-config` 🌐 (Público)

**URL:** `POST /api/Devices/DEVICE_ID_123/confirm-config`

**Body:**
```json
{
  "deviceId": "DEVICE_ID_123",
  "sessionToken": "ABC123XYZ789==",
  "success": true
}
```

**Resposta:**
```json
{
  "status": true,
  "mensagem": "Sensor confirmado e ativado.",
  "dados": true
}
```

**🎉 Pronto!** O sensor está:
- ✅ Conectado ao Wi-Fi
- ✅ Registrado no sistema
- ✅ Ativo e pronto para uso

---

## 🔍 Verificação Final

**Endpoint:** `GET /api/Sensores/{condominioId}` 🔒 (Autenticado)

**Exemplo:** `GET /api/Sensores/1`

**Resposta:**
```json
{
  "status": true,
  "mensagem": "Sensores do condomínio retornados.",
  "dados": [
    {
      "id": 1,
      "deviceId": "DEVICE_ID_123",
      "nome": "Lixeira Bloco A",
      "condominioId": 1,
      "latitude": -23.5505,
      "longitude": -46.6333,
      "status": 1,
      "ultimaConexao": "2025-11-06T10:45:00Z"
    }
  ]
}
```

---

## 🚨 Possíveis Erros e Soluções

### ❌ "Token expirado"
- O JWT do QR Code expira em **1 dia**
- Solução: Gere um novo QR Code

### ❌ "Session expirado"
- O sessionToken expira em **10 minutos**
- Solução: Reinicie do Passo 3

### ❌ "Provisionamento já usado"
- Cada provisionamento só pode ser usado **uma vez**
- Solução: Crie um novo provisionamento

### ❌ "deviceId incompatível"
- O deviceId no body deve ser o mesmo da URL
- Solução: Verifique se os IDs estão corretos

---

## 📊 Resumo do Fluxo

```
[Admin] → Cria Provisionamento → Gera QR Code
                                      ↓
[Síndico] → Escaneia QR → Preenche dados → Ativa Provisionamento
                                              ↓
                                        Recebe SessionToken
                                              ↓
[Dispositivo] → Busca Wi-Fi com SessionToken → Conecta à Rede
                                                      ↓
                                               Confirma Config
                                                      ↓
                                                [Sensor Ativo] ✅
```

---

## 🎯 Ordem de Teste no Swagger

1. **POST** `/api/Auth/login` (como Admin)
2. **Authorize** (cole o token)
3. **POST** `/api/Provisionamentos/criar`
4. **GET** `/api/Provisionamentos/gerar-qr/{id}`
5. **POST** `/api/Provisionamentos/ativar-qr`
6. **GET** `/api/Devices/{deviceId}/wifi-credentials`
7. **POST** `/api/Devices/{deviceId}/confirm-config`
8. **GET** `/api/Sensores/{condominioId}`

---

## ✨ Dicas

- Use o **Postman** ou **Insomnia** para testes mais complexos
- Verifique os logs do backend em caso de erro
- O sessionToken tem validade curta, seja rápido nos testes
- Para desenvolvimento, considere aumentar o tempo de expiração

**Pronto para testar! 🚀**
