# 📱 Guia de Integração - Fluxo de Provisionamento de Sensores

## 🎯 Visão Geral do Fluxo

O novo sistema de provisionamento de sensores segue um fluxo em 4 etapas:

```
1. SensorFormScreen → 2. QRCodeScannerScreen → 3. SensorWiFiConfigScreen → 4. SensorSetupSuccessScreen
```

## 📝 Estrutura dos Dados

### SensorFormData (da tela 1)
```typescript
{
  nomeSensor: string;
  latitude: number;
  longitude: number;
  condominioId: number;
  condominioNome: string;
}
```

### QRCodeData (da tela 2)
```typescript
{
  provisionId: string;  // Ex: "1"
  deviceId: string;     // Ex: "DEVICE_ID_123"
  token: string;        // JWT token
}
```

## 🔌 Exemplo de Integração no Navigator

### Opção 1: Usando Stack Navigator (React Navigation)

```typescript
import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SensorFormScreen,
  QRCodeScannerScreen,
  SensorWiFiConfigScreen,
  SensorSetupSuccessScreen,
} from '../screens';
import type { SensorFormData } from '../screens/SensorFormScreen';
import type { QRCodeData } from '../screens/QRCodeScannerScreen';

type SensorProvisionStackParamList = {
  SensorForm: undefined;
  QRScanner: { sensorData: SensorFormData };
  WiFiConfig: { sensorData: SensorFormData; qrData: QRCodeData };
  Success: undefined;
};

const Stack = createStackNavigator<SensorProvisionStackParamList>();

export function SensorProvisionNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SensorForm" component={SensorFormScreenWrapper} />
      <Stack.Screen name="QRScanner" component={QRScannerScreenWrapper} />
      <Stack.Screen name="WiFiConfig" component={WiFiConfigScreenWrapper} />
      <Stack.Screen name="Success" component={SuccessScreenWrapper} />
    </Stack.Navigator>
  );
}

// Wrappers para conectar com o Stack Navigator
function SensorFormScreenWrapper({ navigation }: any) {
  return (
    <SensorFormScreen
      onBack={() => navigation.goBack()}
      onNext={(sensorData) => {
        navigation.navigate('QRScanner', { sensorData });
      }}
    />
  );
}

function QRScannerScreenWrapper({ navigation, route }: any) {
  const { sensorData } = route.params;
  
  return (
    <QRCodeScannerScreen
      onBack={() => navigation.goBack()}
      onScanSuccess={(qrData) => {
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
        navigation.navigate('Success');
      }}
    />
  );
}

function SuccessScreenWrapper({ navigation }: any) {
  return (
    <SensorSetupSuccessScreen
      onFinish={() => {
        // Volta para a tela principal
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
  SensorFormScreen,
  QRCodeScannerScreen,
  SensorWiFiConfigScreen,
  SensorSetupSuccessScreen,
} from '../screens';
import type { SensorFormData } from '../screens/SensorFormScreen';
import type { QRCodeData } from '../screens/QRCodeScannerScreen';

type ScreenType = 'form' | 'scanner' | 'wifi' | 'success';

export function SensorProvisionFlow() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('form');
  const [sensorData, setSensorData] = useState<SensorFormData | null>(null);
  const [qrData, setQRData] = useState<QRCodeData | null>(null);

  const handleBack = () => {
    switch (currentScreen) {
      case 'scanner':
        setCurrentScreen('form');
        break;
      case 'wifi':
        setCurrentScreen('scanner');
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
    setCurrentScreen('wifi');
  };

  const handleWiFiSuccess = () => {
    setCurrentScreen('success');
  };

  const handleFinish = () => {
    // Resetar e voltar para a tela inicial
    setCurrentScreen('form');
    setSensorData(null);
    setQRData(null);
  };

  // Renderizar a tela atual
  switch (currentScreen) {
    case 'form':
      return (
        <SensorFormScreen
          onBack={handleBack}
          onNext={handleFormNext}
        />
      );

    case 'scanner':
      return (
        <QRCodeScannerScreen
          onBack={handleBack}
          onScanSuccess={handleScanSuccess}
        />
      );

    case 'wifi':
      return sensorData && qrData ? (
        <SensorWiFiConfigScreen
          onBack={handleBack}
          sensorData={sensorData}
          qrData={qrData}
          onSuccess={handleWiFiSuccess}
        />
      ) : null;

    case 'success':
      return (
        <SensorSetupSuccessScreen
          onFinish={handleFinish}
        />
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
2. **Síndico escaneia QR** → Preenche dados do sensor
3. **App ativa provisionamento** → Backend gera sessionToken
4. **Dispositivo busca WiFi** → Usa sessionToken para obter credenciais
5. **Dispositivo confirma** → Sensor fica ativo no sistema

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
