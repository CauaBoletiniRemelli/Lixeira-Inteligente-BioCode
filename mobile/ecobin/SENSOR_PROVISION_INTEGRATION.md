# 📱 Guia de Integração - Fluxo de Provisionamento de Sensores

## 🎯 Visão Geral do Fluxo

O sistema de provisionamento de sensores segue um fluxo em 3 etapas:

```
1. QRCodeScannerScreen → 2. SensorFormScreen → 3. SensorWiFiConfigScreen
```

Após a configuração WiFi bem-sucedida, é exibida uma confirmação de sucesso por 3 segundos e então retorna automaticamente para a tela inicial.

## 📝 Estrutura dos Dados

### QRCodeData (da tela 1)
```typescript
{
  provisionId: string;  // Ex: "1"
  deviceId: string;     // Ex: "DEVICE_ID_123"
  token: string;        // JWT token
}
```

### SensorFormData (da tela 2)
```typescript
{
  nomeSensor: string;
  latitude: number;
  longitude: number;
  condominioId: number;
  condominioNome: string;
}
```

## 🔌 Exemplo de Integração no Navigator

### Opção 1: Usando Stack Navigator (React Navigation)

```typescript
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  QRCodeScannerScreen,
  SensorFormScreen,
  SensorWiFiConfigScreen,
} from '../screens';
import type { SensorFormData } from '../screens/SensorFormScreen';
import type { QRCodeData } from '../screens/QRCodeScannerScreen';

type SensorProvisionStackParamList = {
  QRScanner: undefined;
  SensorForm: { qrData: QRCodeData };
  WiFiConfig: { sensorData: SensorFormData; qrData: QRCodeData };
};

const Stack = createStackNavigator<SensorProvisionStackParamList>();

export function SensorProvisionNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="QRScanner" component={QRScannerScreenWrapper} />
      <Stack.Screen name="SensorForm" component={SensorFormScreenWrapper} />
      <Stack.Screen name="WiFiConfig" component={WiFiConfigScreenWrapper} />
    </Stack.Navigator>
  );
}

// Wrappers para conectar com o Stack Navigator
function QRScannerScreenWrapper({ navigation }: any) {
  return (
    <QRCodeScannerScreen
      onBack={() => navigation.goBack()}
      onScanSuccess={(qrData) => {
        navigation.navigate('SensorForm', { qrData });
      }}
    />
  );
}

function SensorFormScreenWrapper({ navigation, route }: any) {
  const { qrData } = route.params;
  
  return (
    <SensorFormScreen
      onBack={() => navigation.goBack()}
      onNext={(sensorData) => {
        navigation.navigate('WiFiConfig', { sensorData, qrData });
      }}
    />
  );
}

function WiFiConfigScreenWrapper({ navigation, route }: any) {
  const { sensorData, qrData } = route.params;
  
  return (
    <SensorWiFiConfigScreen
      onBack={() => navigation.goBack()}
      sensorData={sensorData}
      qrData={qrData}
      onSuccess={() => {
        // A tela WiFiConfig já mostra confirmação de sucesso e volta automaticamente
        navigation.popToTop();
      }}
    />
  );
}
```

### Opção 2: Gerenciamento de Estado Manual (sem React Navigation)

```typescript
import React, { useState } from 'react';
import {
  QRCodeScannerScreen,
  SensorFormScreen,
  SensorWiFiConfigScreen,
} from '../screens';
import type { SensorFormData } from '../screens/SensorFormScreen';
import type { QRCodeData } from '../screens/QRCodeScannerScreen';

type ScreenType = 'scanner' | 'form' | 'wifi';

export function SensorProvisionFlow() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('scanner');
  const [sensorData, setSensorData] = useState<SensorFormData | null>(null);
  const [qrData, setQRData] = useState<QRCodeData | null>(null);

  const handleBack = () => {
    switch (currentScreen) {
      case 'form':
        setCurrentScreen('scanner');
        break;
      case 'wifi':
        setCurrentScreen('form');
        break;
      default:
        // Volta para a tela anterior do app
        break;
    }
  };

  const handleFormNext = (data: SensorFormData) => {
    setSensorData(data);
    setCurrentScreen('scanner');
  };

  const handleScanSuccess = (data: QRCodeData) => {
    setQRData(data);
    setCurrentScreen('form');
  };

  const handleFormNext = (data: SensorFormData) => {
    setSensorData(data);
    setCurrentScreen('wifi');
  };

  const handleWiFiSuccess = () => {
    // Resetar e voltar para a tela inicial
    // (A tela WiFiConfig já mostra confirmação de sucesso por 3s)
    setCurrentScreen('scanner');
    setSensorData(null);
    setQRData(null);
  };

  // Renderizar a tela atual
  switch (currentScreen) {
    case 'scanner':
      return (
        <QRCodeScannerScreen
          onBack={handleBack}
          onScanSuccess={handleScanSuccess}
        />
      );

    case 'form':
      return qrData ? (
        <SensorFormScreen
          onBack={handleBack}
          onNext={handleFormNext}
        />
      ) : null;

    case 'wifi':
      return sensorData && qrData ? (
        <SensorWiFiConfigScreen
          onBack={handleBack}
          sensorData={sensorData}
          qrData={qrData}
          onSuccess={handleWiFiSuccess}
        />
      ) : null;
      );

    default:
      return null;
  }
}
```

## 🏠 Adicionando Botão no HomeScreen

```typescript
// No HomeScreen.tsx, adicione:

interface HomeScreenProps {
  // ... outras props
  onNavigateToSensorProvision?: () => void;
}

// Dentro do componente, adicione um card/botão:

<MenuCard
  title="Cadastrar Sensor"
  subtitle="Adicionar novo sensor ao sistema"
  iconComponent={
    <MaterialCommunityIcons
      name="chip"
      size={60}
      color={COLORS.primary}
    />
  }
  onPress={() => onNavigateToSensorProvision?.()}
/>
```

## 🗺️ Adicionando Botão no MapScreen

```typescript
// No MapScreen.tsx, adicione um FAB (Floating Action Button):

<TouchableOpacity
  style={styles.fabButton}
  onPress={() => onNavigateToSensorProvision?.()}
>
  <Ionicons name="add" size={24} color={COLORS.text.white} />
  <Text style={styles.fabText}>Novo Sensor</Text>
</TouchableOpacity>

// Styles
fabButton: {
  position: 'absolute',
  bottom: SPACING.xl,
  right: SPACING.xl,
  backgroundColor: COLORS.primary,
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.sm,
  paddingHorizontal: SPACING.lg,
  paddingVertical: SPACING.md,
  borderRadius: BORDER_RADIUS.full,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},
```

## 🔐 Controle de Permissões

```typescript
// Mostrar botão apenas para Admin e Síndico
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();
const canAddSensor = user?.role === 'admin' || user?.role === 'sindico';

{canAddSensor && (
  <MenuCard
    title="Cadastrar Sensor"
    subtitle="Adicionar novo sensor ao sistema"
    iconComponent={<MaterialCommunityIcons name="chip" size={60} color={COLORS.primary} />}
    onPress={() => onNavigateToSensorProvision?.()}
  />
)}
```

## 📡 Serviços Disponíveis

### ProvisionamentoService
```typescript
import { provisionamentoService } from '../services';

// Criar provisionamento (ADMIN apenas - para gerar QR Code)
const response = await provisionamentoService.criar({
  sensorId: 1,
  usuarioId: user.id,
  expiracaoDias: 7,
});

// Ativar QR (SÍNDICO/ADMIN - feito automaticamente na WiFiConfigScreen)
const ativarResponse = await provisionamentoService.ativarQR({
  provisionId: qrData.provisionId,
  deviceId: qrData.deviceId,
  token: qrData.token,
  condominioId: sensorData.condominioId,
  nomeSensor: sensorData.nomeSensor,
  latitude: sensorData.latitude,
  longitude: sensorData.longitude,
  wifiSSID: ssid,
  wifiPassword: password,
});
```

### DeviceService
```typescript
import { deviceService } from '../services';

// Confirmar configuração (feito automaticamente na WiFiConfigScreen)
const confirmResponse = await deviceService.confirmConfig(deviceId, {
  deviceId: deviceId,
  sessionToken: sessionToken,
  success: true,
});
```

## 🎯 Fluxo Backend (Resumo)

1. **Admin cria provisionamento** → Gera QR Code
2. **Usuário escaneia QR** → Captura token e deviceId
3. **Usuário preenche dados** → Nome, localização, condomínio
4. **App ativa provisionamento** → Backend gera sessionToken
5. **Dispositivo busca WiFi** → Usa sessionToken para obter credenciais
6. **Dispositivo confirma** → Sensor fica ativo no sistema

## 📋 Ordem do Fluxo no App

### Passo 1: QR Code Scanner
- Usuário escaneia o QR Code do sensor físico
- QR Code contém: `provisionId`, `deviceId`, `token`
- Dados salvos em memória para próximas telas

### Passo 2: Formulário do Sensor
- Usuário preenche nome do sensor
- Seleciona localização no mapa (ou digita coordenadas)
- Seleciona condomínio (admin) ou usa condomínio fixo (síndico)
- Dados validados antes de avançar

### Passo 3: Configuração WiFi
- Usuário informa SSID e senha da rede WiFi
- App envia todos os dados para o backend
- Backend registra o sensor e retorna sessionToken
- Tela mostra confirmação de sucesso por 3 segundos
- Retorna automaticamente para tela inicial

## ✅ Validações Importantes

- ✅ Latitude: -90 a 90
- ✅ Longitude: -180 a 180
- ✅ SSID e senha WiFi: obrigatórios
- ✅ Condomínio: obrigatório (fixo para síndico, selecionável para admin)
- ✅ Nome do sensor: obrigatório

## 🐛 Tratamento de Erros

Todos os erros são tratados automaticamente pelas telas com:
- Alertas visuais
- Mensagens amigáveis
- Logs detalhados no console
- Possibilidade de tentar novamente

## 📱 Próximos Passos

1. Adicionar o botão no HomeScreen ou MapScreen
2. Integrar com o navigator principal
3. Testar o fluxo completo
4. Ajustar estilos conforme necessário
