# Integração ESP32 - Sensor EcoBin

## 📋 Visão Geral

Este documento descreve como integrar o dispositivo ESP32 com o sistema de provisionamento via QR Code.

## 🔄 Fluxo Completo de Provisionamento

### 1️⃣ **App Mobile - Criação do QR Code**
```
Admin cria QR Code via app
↓
POST /api/Provisionamentos/criar-com-sensor
↓
Backend cria sensor placeholder + provisionamento
↓
QR Code gerado: "provisionId|deviceId|jwtToken"
```

### 2️⃣ **App Mobile - Escaneamento e Configuração**
```
Usuário escaneia QR Code
↓
Preenche credenciais WiFi no app
↓
POST /api/Provisionamentos/ativar-qr
  {
    provisionId, deviceId, token,
    condominioId, nomeSensor, latitude, longitude,
    wifiSSID, wifiPassword
  }
↓
Backend retorna: sessionToken + sensorId
```

### 3️⃣ **ESP32 - Modo Access Point**
O ESP32 deve iniciar em modo AP com as seguintes características:

**Configurações do AP:**
- SSID: `EcoBin-[deviceId]` (ex: `EcoBin-36b639656e264ea0`)
- Senha: Pode ser fixa ou vir do QR Code
- IP: `192.168.4.1` (padrão ESP32)

**Endpoints que o ESP32 deve expor:**

#### GET /credentials
Retorna as credenciais WiFi configuradas pelo app

```json
{
  "ssid": "DIR-842-1F3B",
  "password": "59872146",
  "sessionToken": "ORm6zycemtz5m6G3FwamaEqY1fQGy3PK",
  "sensorId": 1
}
```

### 4️⃣ **ESP32 - Conexão WiFi**

```cpp
// Pseudocódigo C++ para ESP32
void setup() {
  // 1. Iniciar em modo AP
  WiFi.softAP("EcoBin-" + deviceId, "senha123");
  
  // 2. Iniciar servidor HTTP no AP
  server.on("/credentials", handleGetCredentials);
  server.begin();
  
  // 3. Aguardar credenciais do backend
  while (!credentialsReceived) {
    server.handleClient();
    delay(100);
  }
  
  // 4. Tentar conectar ao WiFi configurado
  WiFi.begin(wifiSSID, wifiPassword);
  
  // 5. Aguardar conexão (timeout 30s)
  int timeout = 30000;
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(500);
    timeout -= 500;
  }
  
  // 6. Confirmar configuração com backend
  bool success = (WiFi.status() == WL_CONNECTED);
  confirmConfiguration(success);
  
  // 7. Desligar AP e continuar em modo estação
  WiFi.softAPdisconnect(true);
}
```

### 5️⃣ **ESP32 - Confirmação de Configuração**

O ESP32 **DEVE** chamar este endpoint após tentar conectar ao WiFi:

```
POST https://ecobinapi.runasp.net/api/Devices/{deviceId}/confirm-config
Content-Type: application/json

{
  "deviceId": "36b639656e264ea086d53f2ffb224a14",
  "sessionToken": "ORm6zycemtz5m6G3FwamaEqY1fQGy3PK",
  "success": true  // true se conectou, false se falhou
}
```

**Resposta de Sucesso:**
```json
{
  "dados": true,
  "mensagem": "Configuração confirmada com sucesso",
  "status": true
}
```

**Resposta de Falha:**
```json
{
  "dados": false,
  "mensagem": "Dispositivo não conseguiu conectar ao Wi-Fi.",
  "status": false
}
```

## 🔧 Exemplo de Implementação ESP32

### Bibliotecas Necessárias
```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
```

### Código Completo

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configurações
const char* deviceId = "36b639656e264ea086d53f2ffb224a14";
const char* apPassword = "ecobin123";
const char* apiBaseUrl = "https://ecobinapi.runasp.net/api";

// Variáveis globais
WebServer server(80);
String wifiSSID = "";
String wifiPassword = "";
String sessionToken = "";
int sensorId = 0;
bool credentialsReceived = false;

// Endpoint para fornecer credenciais
void handleGetCredentials() {
  StaticJsonDocument<200> doc;
  doc["ssid"] = wifiSSID;
  doc["password"] = wifiPassword;
  doc["sessionToken"] = sessionToken;
  doc["sensorId"] = sensorId;
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
}

// Buscar credenciais do backend
void fetchCredentialsFromBackend() {
  HTTPClient http;
  String url = String(apiBaseUrl) + "/Devices/" + deviceId + "/credentials";
  
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + sessionToken);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    StaticJsonDocument<300> doc;
    deserializeJson(doc, payload);
    
    wifiSSID = doc["dados"]["ssid"].as<String>();
    wifiPassword = doc["dados"]["password"].as<String>();
    sessionToken = doc["dados"]["sessionToken"].as<String>();
    sensorId = doc["dados"]["sensorId"].as<int>();
    
    credentialsReceived = true;
    
    Serial.println("✅ Credenciais recebidas:");
    Serial.println("SSID: " + wifiSSID);
    Serial.println("Session Token: " + sessionToken);
  } else {
    Serial.println("❌ Erro ao buscar credenciais: " + String(httpCode));
  }
  
  http.end();
}

// Confirmar configuração com backend
void confirmConfiguration(bool success) {
  HTTPClient http;
  String url = String(apiBaseUrl) + "/Devices/" + deviceId + "/confirm-config";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["sessionToken"] = sessionToken;
  doc["success"] = success;
  
  String body;
  serializeJson(doc, body);
  
  int httpCode = http.POST(body);
  
  if (httpCode == 200) {
    Serial.println("✅ Configuração confirmada com sucesso!");
  } else {
    Serial.println("❌ Erro ao confirmar configuração: " + String(httpCode));
    Serial.println(http.getString());
  }
  
  http.end();
}

// Conectar ao WiFi
bool connectToWiFi() {
  Serial.println("📡 Conectando ao WiFi: " + wifiSSID);
  
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int timeout = 30000; // 30 segundos
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(500);
    Serial.print(".");
    timeout -= 500;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Conectado ao WiFi!");
    Serial.println("IP: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\n❌ Falha ao conectar ao WiFi");
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🚀 EcoBin Sensor - Iniciando...");
  Serial.println("Device ID: " + String(deviceId));
  
  // 1. Iniciar Access Point
  Serial.println("📡 Iniciando Access Point...");
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("EcoBin-" + String(deviceId).substring(0, 16), apPassword);
  
  Serial.println("✅ AP Iniciado:");
  Serial.println("SSID: EcoBin-" + String(deviceId).substring(0, 16));
  Serial.println("IP: " + WiFi.softAPIP().toString());
  
  // 2. Iniciar servidor HTTP
  server.on("/credentials", handleGetCredentials);
  server.begin();
  Serial.println("✅ Servidor HTTP iniciado");
  
  // 3. Aguardar credenciais por 5 minutos
  Serial.println("⏳ Aguardando provisionamento...");
  unsigned long startTime = millis();
  
  while (!credentialsReceived && (millis() - startTime < 300000)) {
    // Verificar periodicamente se há credenciais no backend
    if (millis() - startTime > 10000) { // Após 10s, começar a buscar
      static unsigned long lastCheck = 0;
      if (millis() - lastCheck > 5000) { // Verificar a cada 5s
        fetchCredentialsFromBackend();
        lastCheck = millis();
      }
    }
    
    server.handleClient();
    delay(100);
  }
  
  if (!credentialsReceived) {
    Serial.println("⚠️ Timeout - Credenciais não recebidas");
    Serial.println("Reiniciando em modo AP...");
    return;
  }
  
  // 4. Conectar ao WiFi
  bool connected = connectToWiFi();
  
  // 5. Confirmar configuração
  confirmConfiguration(connected);
  
  // 6. Desligar AP se conectou com sucesso
  if (connected) {
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    Serial.println("✅ Provisionamento concluído!");
  } else {
    Serial.println("⚠️ Mantendo AP ativo para nova tentativa");
  }
}

void loop() {
  // Seu código principal aqui
  // Enviar leituras do sensor, etc.
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi desconectado, tentando reconectar...");
    connectToWiFi();
  }
  
  delay(1000);
}
```

## 📊 Sequência Completa

```
[APP] Escaneia QR Code
  ↓
[APP] POST /Provisionamentos/ativar-qr
  ↓
[BACKEND] Salva credenciais WiFi
  ↓
[BACKEND] Retorna sessionToken
  ↓
[ESP32] GET /Devices/{deviceId}/credentials (polling a cada 5s)
  ↓
[ESP32] Recebe WiFi SSID + Password
  ↓
[ESP32] Tenta conectar ao WiFi
  ↓
[ESP32] POST /Devices/{deviceId}/confirm-config
  ↓
[BACKEND] Atualiza status do sensor
  ↓
✅ Provisionamento concluído
```

## 🔐 Segurança

1. **Session Token**: Válido por tempo limitado (definido no backend)
2. **Device ID**: Único por dispositivo, impossível de adivinhar
3. **JWT Token**: Protege o QR Code contra falsificação
4. **HTTPS**: Todas as comunicações com backend devem usar SSL

## 🐛 Troubleshooting

### ESP32 não recebe credenciais
- Verificar se o Device ID está correto
- Confirmar que o QR Code foi ativado via app
- Checar conexão com internet (para buscar credenciais)

### Falha ao conectar WiFi
- Validar SSID e senha
- Verificar sinal WiFi
- Tentar WiFi 2.4GHz (ESP32 não suporta 5GHz)

### Erro 400 no confirm-config
- Verificar formato do JSON
- Confirmar que sessionToken é válido
- Checar se não expirou

## 📝 Notas Importantes

- O ESP32 precisa ter RTC ou NTP configurado para validar JWT
- Recomenda-se salvar credenciais WiFi na EEPROM após conexão bem-sucedida
- Implementar timeout e retry logic para robustez
- Adicionar LED de status para feedback visual do processo

