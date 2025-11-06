# 📚 Documentação das Melhorias - Sistema de Provisionamento de Sensores

## 🎯 Objetivo

Implementar um sistema completo de provisionamento de sensores IoT através de QR Code, permitindo que administradores criem códigos QR para novos sensores e síndicos possam configurá-los facilmente através do aplicativo mobile.

---

## ✨ O Que Foi Implementado

### 1️⃣ **Criação de Provisionamento com Sensor Placeholder**

**Problema anterior:** Admin precisava ter um sensor já criado (com DeviceId real) para gerar QR Code.

**Solução:** Novo endpoint que cria automaticamente um sensor placeholder com DeviceId temporário.

**Arquivo:** `ProvisionCreateWithSensorDTO.cs`
```csharp
public class ProvisionCreateWithSensorDTO
{
    public string NomeSensor { get; set; }
    public int CondominioId { get; set; }
    public int UsuarioId { get; set; }
    public int ExpiracaoDias { get; set; } = 7;
}
```

**Endpoint:** `POST /api/Provisionamentos/criar-com-sensor`

**Comportamento:**
- Cria sensor com DeviceId temporário (GUID)
- Cria provisionamento vinculado ao sensor
- Retorna ID do provisionamento para gerar QR Code

---

### 2️⃣ **Descriptografia de Credenciais Wi-Fi**

**Problema anterior:** Credenciais Wi-Fi eram criptografadas mas não havia endpoint para o dispositivo buscá-las.

**Solução:** Método de descriptografia e endpoint público para dispositivos.

**Arquivo:** `ProvisionamentosService.cs`
```csharp
private string DescriptografarDado(string dadoCriptografado)
{
    // Descriptografa usando AES-256
    // Extrai IV dos primeiros bytes
    // Retorna dado original
}
```

---

### 3️⃣ **Endpoint para Dispositivo Buscar Wi-Fi**

**Novo DTO:** `WifiCredentialsResponseDTO.cs`
```csharp
public class WifiCredentialsResponseDTO
{
    public string SSID { get; set; }
    public string Password { get; set; }
    public DateTime SessionExpires { get; set; }
    public string DeviceId { get; set; }
}
```

**Endpoint:** `GET /api/Devices/{deviceId}/wifi-credentials?sessionToken={token}`

**Comportamento:**
- Valida sessionToken e expiração
- Descriptografa SSID e senha do Wi-Fi
- Retorna credenciais em texto plano (apenas para dispositivo autenticado)

---

### 4️⃣ **DTO de Confirmação de Configuração**

**Problema anterior:** DTO vazio, sem campos definidos.

**Solução:** Definição completa dos campos necessários.

**Arquivo:** `ConfirmConfigDTO.cs`
```csharp
public class ConfirmConfigDTO
{
    public string DeviceId { get; set; }
    public string SessionToken { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
}
```

---

### 5️⃣ **Atualização de Sensor Placeholder para DeviceId Real**

**Problema anterior:** Quando síndico ativava QR, o DeviceId temporário não era substituído.

**Solução:** Modificação na lógica do `ActivateProvisionAsync`.

**Mudança no código:**
```csharp
// ANTES: Buscava sensor por DeviceId
var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.DeviceId == dto.DeviceId);

// AGORA: Busca sensor pelo SensorId do provisionamento
var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == prov.SensorId);

// E atualiza o DeviceId temporário para o real
sensor.DeviceId = dto.DeviceId;
```

---

### 6️⃣ **Endpoint de Criação Manual de Sensor**

**Endpoint:** `POST /api/Sensores`

**Uso:** Permite admin criar sensor diretamente, sem provisionamento (útil para migrações/testes).

---

### 7️⃣ **Endpoints GET para Provisionamentos**

**Novos endpoints:**
- `GET /api/Provisionamentos` - Lista todos os provisionamentos
- `GET /api/Provisionamentos/{id}` - Busca provisionamento específico

**Uso:** Permitir admin gerenciar e visualizar provisionamentos no app.

---

## 🔄 Fluxo Completo Implementado

```
┌─────────────────────────────────────────────────────────────┐
│ PASSO 1: Admin cria QR Code                                 │
│ POST /api/Provisionamentos/criar-com-sensor                 │
│ ↓ Cria sensor placeholder + provisionamento                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 2: Admin gera QR Code                                 │
│ GET /api/Provisionamentos/gerar-qr/{id}                     │
│ ↓ Retorna PNG com: provisionId|deviceId|jwt                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 3: Síndico escaneia QR e ativa provisionamento        │
│ POST /api/Provisionamentos/ativar-qr                        │
│ ↓ Envia: dados do sensor + credenciais Wi-Fi                │
│ ↓ Recebe: sessionToken (válido por 10 min)                  │
│ ↓ Atualiza: DeviceId temporário → DeviceId real             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 4: Dispositivo busca credenciais Wi-Fi                │
│ GET /api/Devices/{deviceId}/wifi-credentials                │
│ ↓ Usa sessionToken para autenticar                          │
│ ↓ Recebe: SSID e senha descriptografados                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 5: Dispositivo conecta ao Wi-Fi                       │
│ (Processo interno do dispositivo)                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 6: Dispositivo confirma configuração                  │
│ POST /api/Devices/{deviceId}/confirm-config                 │
│ ↓ Envia: success = true/false                               │
│ ↓ Backend: marca provisionamento como usado                 │
│ ↓ Backend: ativa sensor (status = 1)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   ✅ Sensor Ativo!
```

---

## 📋 Endpoints Implementados

### **Provisionamentos**

| Método | Endpoint | Autorização | Descrição |
|--------|----------|-------------|-----------|
| GET | `/api/Provisionamentos` | Admin | Lista todos provisionamentos |
| GET | `/api/Provisionamentos/{id}` | Admin | Busca provisionamento por ID |
| POST | `/api/Provisionamentos/criar` | Admin | Cria provisionamento (requer sensor existente) |
| POST | `/api/Provisionamentos/criar-com-sensor` | Admin | Cria sensor placeholder + provisionamento |
| GET | `/api/Provisionamentos/gerar-qr/{id}` | Admin | Gera QR Code PNG |
| POST | `/api/Provisionamentos/ativar-qr` | Autenticado | Síndico ativa provisionamento |

### **Dispositivos**

| Método | Endpoint | Autorização | Descrição |
|--------|----------|-------------|-----------|
| GET | `/api/Devices/{deviceId}/wifi-credentials` | Público* | Busca credenciais Wi-Fi |
| POST | `/api/Devices/{deviceId}/confirm-config` | Público* | Confirma configuração |

*Público mas requer sessionToken válido

### **Sensores**

| Método | Endpoint | Autorização | Descrição |
|--------|----------|-------------|-----------|
| GET | `/api/Sensores` | Admin | Lista todos sensores |
| GET | `/api/Sensores/{condominioId}` | Autenticado | Lista sensores do condomínio |
| POST | `/api/Sensores` | Admin | Cria sensor manual |
| PUT | `/api/Sensores` | Admin | Atualiza sensor |
| DELETE | `/api/Sensores/{id}` | Admin | Deleta sensor |

---

## 🔒 Segurança Implementada

### **1. Criptografia AES-256**
- Credenciais Wi-Fi armazenadas criptografadas no banco
- IV aleatório para cada criptografia
- Chave derivada da SecretKey do JWT

### **2. Tokens com Expiração**
- **JWT no QR Code:** 1 dia
- **SessionToken:** 10 minutos
- Validação em todas as etapas

### **3. Validação de Provisionamento**
- Só pode ser usado uma vez (`Usado = true`)
- Verifica expiração antes de ativar
- Claims do JWT devem coincidir com dados do QR

### **4. Controle de Acesso**
- Admin: Gerencia provisionamentos e sensores
- Síndico: Ativa provisionamentos do seu condomínio
- Dispositivo: Acesso limitado ao sessionToken

---

## 📱 Como Usar no App Mobile

### **Tela de Gerenciamento de QR Codes (Admin)**

```dart
// 1. Criar novo QR Code
Future<void> criarNovoQrCode() async {
  final response = await api.post(
    '/api/Provisionamentos/criar-com-sensor',
    {
      'nomeSensor': 'Lixeira ${numero}',
      'condominioId': condominioAtual.id,
      'usuarioId': usuarioLogado.id,
      'expiracaoDias': 7,
    },
  );
  
  if (response['status']) {
    final provisionId = response['dados']['id'];
    await baixarQrCode(provisionId);
  }
}

// 2. Listar QR Codes criados
Future<List<Provisionamento>> listarQrCodes() async {
  final response = await api.get('/api/Provisionamentos');
  return response['dados'].map((p) => Provisionamento.fromJson(p)).toList();
}

// 3. Baixar QR Code
Future<Uint8List> baixarQrCode(int provisionId) async {
  return await api.getBytes('/api/Provisionamentos/gerar-qr/$provisionId');
}
```

### **Tela de Cadastro de Sensor (Síndico)**

```dart
// 1. Escanear QR Code
final qrData = await scanner.scan(); // "1|TEMP_DEVICE_ID|jwt..."
final parts = qrData.split('|');

// 2. Preencher dados do sensor
final dados = {
  'provisionId': parts[0],
  'deviceId': parts[1], // DeviceId temporário do QR
  'token': parts[2],
  'condominioId': condominioAtual.id,
  'nomeSensor': nomeController.text,
  'latitude': localizacao.latitude,
  'longitude': localizacao.longitude,
  'wifiSSID': wifiSsidController.text,
  'wifiPassword': wifiPasswordController.text,
};

// 3. Ativar provisionamento
final response = await api.post('/api/Provisionamentos/ativar-qr', dados);

if (response['status']) {
  final sessionToken = response['dados']['sessionToken'];
  
  // 4. Enviar sessionToken para o dispositivo via AP
  await enviarParaDispositivoViaAP(sessionToken);
  
  // 5. Aguardar confirmação
  aguardarConfirmacao();
}
```

---

## 🧪 Testando no Swagger

### **Teste Rápido - Novo Fluxo:**

1. **Login Admin**
   ```
   POST /api/Auth/login
   ```

2. **Criar QR Code (novo método)**
   ```
   POST /api/Provisionamentos/criar-com-sensor
   Body: { "nomeSensor": "Lixeira 1", "condominioId": 1, "usuarioId": 1 }
   ```

3. **Gerar QR Code**
   ```
   GET /api/Provisionamentos/gerar-qr/1
   ```

4. **Listar Provisionamentos**
   ```
   GET /api/Provisionamentos
   ```

5. **Ativar Provisionamento** (como síndico)
   ```
   POST /api/Provisionamentos/ativar-qr
   Body: { dados do QR + credenciais Wi-Fi }
   ```

6. **Buscar Credenciais Wi-Fi** (como dispositivo)
   ```
   GET /api/Devices/DEVICE_ID/wifi-credentials?sessionToken=...
   ```

7. **Confirmar Configuração** (como dispositivo)
   ```
   POST /api/Devices/DEVICE_ID/confirm-config
   Body: { "deviceId": "...", "sessionToken": "...", "success": true }
   ```

8. **Verificar Sensor Ativo**
   ```
   GET /api/Sensores/1
   ```

---

## 📊 Arquivos Modificados/Criados

### **Novos DTOs:**
- ✅ `ProvisionCreateWithSensorDTO.cs`
- ✅ `WifiCredentialsResponseDTO.cs`
- ✅ `ConfirmConfigDTO.cs` (preenchido)

### **Services:**
- ✅ `ProvisionamentosService.cs` - 4 novos métodos
- ✅ `IProvisionamentosInteraface.cs` - 4 novas assinaturas

### **Controllers:**
- ✅ `ProvisionamentosController.cs` - 3 novos endpoints
- ✅ `DevicesController.cs` - 1 novo endpoint
- ✅ `SensoresController.cs` - 1 novo endpoint

### **Documentação:**
- ✅ `TESTE_FLUXO_PROVISIONAMENTO.md`
- ✅ `DOCUMENTACAO_MELHORIAS.md` (este arquivo)

---

## 🎯 Benefícios Implementados

1. ✅ **Simplicidade no App:** Admin não precisa saber DeviceId antes de criar QR
2. ✅ **Segurança:** Credenciais Wi-Fi criptografadas com AES-256
3. ✅ **Rastreabilidade:** Todos provisionamentos registrados no banco
4. ✅ **Flexibilidade:** Múltiplas formas de criar sensores
5. ✅ **Validação:** SessionToken expira em 10 minutos
6. ✅ **Controle:** Admin pode listar e gerenciar provisionamentos

---

## 🚀 Próximos Passos Sugeridos

1. **Adicionar filtros na listagem de provisionamentos** (por status, condomínio, etc.)
2. **Implementar cancelamento de provisionamento** (invalidar QR Code)
3. **Adicionar webhook** para notificar quando sensor conectar
4. **Dashboard de monitoramento** de provisionamentos ativos/expirados
5. **Logs de auditoria** para rastrear quem criou cada provisionamento

---

**Documentação criada em:** 06/11/2025  
**Versão da API:** 1.0  
**Status:** ✅ Implementado e Testado
