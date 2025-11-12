# Documentação - API de Notificações Push (OneSignal)

## Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Exemplos de Uso no React Native](#exemplos-de-uso-no-react-native)
4. [Fluxo Completo de Implementação](#fluxo-completo-de-implementação)

---

## Configuração Inicial

### 1. Instalar Dependências
```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Configurar OneSignal no App
```bash
npm install react-native-onesignal
```

### 3. Configuração do app.json
```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "development"
        }
      ]
    ]
  }
}
```

---

## Endpoints Disponíveis

### Base URL
```
https://seu-servidor.com/api/ExpoTokens
```

### Autenticação
Todos os endpoints requerem autenticação via Bearer Token no header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 1. Salvar Token do Dispositivo

**Endpoint:** `POST /api/ExpoTokens/token`

**Quando usar:** Ao fazer login ou quando o app é iniciado pela primeira vez.

**Body:**
```json
{
  "usuarioId": 1,
  "token": "player_id_do_onesignal",
  "dispositivo": "iPhone 14 Pro",
  "plataforma": "iOS"
}
```

**Exemplo React Native:**
```javascript
import OneSignal from 'react-native-onesignal';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const salvarTokenNotificacao = async (usuarioId, authToken) => {
  try {
    // Obter o Player ID do OneSignal
    const deviceState = await OneSignal.getDeviceState();
    const playerId = deviceState.userId;

    const response = await fetch('https://seu-servidor.com/api/ExpoTokens/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usuarioId: usuarioId,
        token: playerId,
        dispositivo: `${Device.brand} ${Device.modelName}`,
        plataforma: Device.osName, // 'iOS' ou 'Android'
      }),
    });

    const data = await response.json();
    
    if (data.status) {
      console.log('Token salvo com sucesso:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
};
```

---

## 2. Listar Tokens do Usuário

**Endpoint:** `GET /api/ExpoTokens/tokens/usuario/{usuarioId}`

**Exemplo:**
```javascript
const listarTokensUsuario = async (usuarioId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/tokens/usuario/${usuarioId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Tokens:', data.dados);
      return data.dados;
    }
  } catch (error) {
    console.error('Erro ao listar tokens:', error);
  }
};
```

---

## 3. Desativar Token

**Endpoint:** `DELETE /api/ExpoTokens/token/{tokenId}`

**Quando usar:** Ao fazer logout.

**Exemplo:**
```javascript
const desativarToken = async (tokenId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/token/${tokenId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Token desativado:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao desativar token:', error);
  }
};
```

---

## 4. Enviar Notificação para Usuário Específico

**Endpoint:** `POST /api/ExpoTokens/notificacoes/enviar-usuario/{usuarioId}`

**Body:**
```json
{
  "titulo": "Lixeira Cheia",
  "mensagem": "A lixeira do bloco A está 95% cheia",
  "dados": "{\"tipo\":\"alerta\",\"sensorId\":123}"
}
```

**Exemplo:**
```javascript
const enviarNotificacaoParaUsuario = async (usuarioId, notificacao, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/enviar-usuario/${usuarioId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          dados: JSON.stringify(notificacao.dados), // Objeto como string JSON
        }),
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Notificação enviada:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
```

---

## 5. Enviar Notificação para Condomínio (Admin)

**Endpoint:** `POST /api/ExpoTokens/notificacoes/enviar-condominio/{condominioId}`

**Requer:** Permissão de Admin (`AdminOnly` policy)

**Body:**
```json
{
  "titulo": "Manutenção Programada",
  "mensagem": "Haverá manutenção no sistema amanhã às 10h",
  "dados": "{\"tipo\":\"manutencao\"}"
}
```

**Exemplo:**
```javascript
const enviarNotificacaoParaCondominio = async (condominioId, notificacao, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/enviar-condominio/${condominioId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          dados: JSON.stringify(notificacao.dados),
        }),
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log(`${data.dados.length} notificações enviadas`);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
```

---

## 6. Enviar para Tipo de Usuário no Condomínio (Admin)

**Endpoint:** `POST /api/ExpoTokens/notificacoes/enviar-condominio-tipo`

**Body:**
```json
{
  "condominioId": 1,
  "tipoUsuario": 1,
  "titulo": "Atenção Síndicos",
  "mensagem": "Reunião de síndicos amanhã às 19h",
  "dados": "{\"tipo\":\"reuniao\"}"
}
```

**Tipos de Usuário:**
- `0` = Admin
- `1` = Sindico
- `2` = Morador

**Exemplo:**
```javascript
const enviarParaTipoUsuario = async (notificacao, authToken) => {
  try {
    const response = await fetch(
      'https://seu-servidor.com/api/ExpoTokens/notificacoes/enviar-condominio-tipo',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condominioId: notificacao.condominioId,
          tipoUsuario: notificacao.tipoUsuario, // 0, 1 ou 2
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          dados: JSON.stringify(notificacao.dados),
        }),
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Notificações enviadas:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
```

---

## 7. Listar Notificações do Usuário

**Endpoint:** `GET /api/ExpoTokens/notificacoes/usuario/{usuarioId}`

**Exemplo:**
```javascript
const listarNotificacoes = async (usuarioId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/usuario/${usuarioId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      return data.dados; // Array de notificações
    }
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
  }
};
```

---

## 8. Listar Notificações Não Lidas

**Endpoint:** `GET /api/ExpoTokens/notificacoes/usuario/{usuarioId}/nao-lidas`

**Exemplo:**
```javascript
const listarNotificacoesNaoLidas = async (usuarioId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/usuario/${usuarioId}/nao-lidas`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log(`${data.dados.length} notificações não lidas`);
      return data.dados;
    }
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
  }
};
```

---

## 9. Marcar Notificação como Lida

**Endpoint:** `PUT /api/ExpoTokens/notificacoes/{notificacaoId}/marcar-lida`

**Exemplo:**
```javascript
const marcarComoLida = async (notificacaoId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/${notificacaoId}/marcar-lida`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Notificação marcada como lida');
    }
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
  }
};
```

---

## 10. Marcar Todas como Lidas

**Endpoint:** `PUT /api/ExpoTokens/notificacoes/usuario/{usuarioId}/marcar-todas-lidas`

**Exemplo:**
```javascript
const marcarTodasComoLidas = async (usuarioId, authToken) => {
  try {
    const response = await fetch(
      `https://seu-servidor.com/api/ExpoTokens/notificacoes/usuario/${usuarioId}/marcar-todas-lidas`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.status) {
      console.log('Todas marcadas como lidas:', data.mensagem);
    }
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
  }
};
```

---

## Fluxo Completo de Implementação

### 1. Arquivo de Serviço (notificationService.js)

```javascript
import OneSignal from 'react-native-onesignal';
import * as Device from 'expo-device';

const API_BASE_URL = 'https://seu-servidor.com/api/ExpoTokens';

class NotificationService {
  constructor() {
    this.authToken = null;
    this.usuarioId = null;
  }

  setCredentials(token, userId) {
    this.authToken = token;
    this.usuarioId = userId;
  }

  async initializeOneSignal(oneSignalAppId) {
    OneSignal.setAppId(oneSignalAppId);
    
    // Listener para notificações abertas
    OneSignal.setNotificationOpenedHandler((notification) => {
      console.log('Notificação aberta:', notification);
      const data = notification.notification.additionalData;
      // Navegue para a tela apropriada baseado nos dados
    });

    // Listener para notificações recebidas
    OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
      const notification = notificationReceivedEvent.getNotification();
      console.log('Notificação recebida:', notification);
      notificationReceivedEvent.complete(notification);
    });

    // Solicitar permissão
    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
      console.log('Permissão de notificação:', response);
    });
  }

  async registrarDispositivo(usuarioId) {
    try {
      const deviceState = await OneSignal.getDeviceState();
      const playerId = deviceState.userId;

      if (!playerId) {
        console.error('Player ID não disponível');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: usuarioId,
          token: playerId,
          dispositivo: `${Device.brand} ${Device.modelName}`,
          plataforma: Device.osName,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
      throw error;
    }
  }

  async listarNotificacoes() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificacoes/usuario/${this.usuarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        }
      );

      const data = await response.json();
      return data.dados || [];
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      return [];
    }
  }

  async listarNaoLidas() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificacoes/usuario/${this.usuarioId}/nao-lidas`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        }
      );

      const data = await response.json();
      return data.dados || [];
    } catch (error) {
      console.error('Erro ao listar não lidas:', error);
      return [];
    }
  }

  async marcarComoLida(notificacaoId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificacoes/${notificacaoId}/marcar-lida`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      throw error;
    }
  }

  async marcarTodasComoLidas() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificacoes/usuario/${this.usuarioId}/marcar-todas-lidas`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }
}

export default new NotificationService();
```

### 2. Uso no App.js ou Componente Principal

```javascript
import React, { useEffect } from 'react';
import NotificationService from './services/notificationService';

const ONESIGNAL_APP_ID = 'seu-onesignal-app-id';

function App() {
  useEffect(() => {
    // Inicializar OneSignal
    NotificationService.initializeOneSignal(ONESIGNAL_APP_ID);
  }, []);

  const handleLogin = async (token, usuarioId) => {
    // Após login bem-sucedido
    NotificationService.setCredentials(token, usuarioId);
    
    // Registrar dispositivo para notificações
    await NotificationService.registrarDispositivo(usuarioId);
  };

  return (
    // Seu app
  );
}

export default App;
```

### 3. Componente de Lista de Notificações

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import NotificationService from '../services/notificationService';

export default function NotificationsScreen() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = async () => {
    const todas = await NotificationService.listarNotificacoes();
    const naoLidasArray = await NotificationService.listarNaoLidas();
    
    setNotificacoes(todas);
    setNaoLidas(naoLidasArray.length);
  };

  const handleMarcarLida = async (notificacaoId) => {
    await NotificationService.marcarComoLida(notificacaoId);
    carregarNotificacoes(); // Recarregar lista
  };

  const handleMarcarTodasLidas = async () => {
    await NotificationService.marcarTodasComoLidas();
    carregarNotificacoes();
  };

  const renderNotificacao = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.lida && styles.unread
      ]}
      onPress={() => handleMarcarLida(item.id)}
    >
      <Text style={styles.titulo}>{item.titulo}</Text>
      <Text style={styles.mensagem}>{item.mensagem}</Text>
      <Text style={styles.data}>
        {new Date(item.dataEnvio).toLocaleString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notificações ({naoLidas} não lidas)
        </Text>
        {naoLidas > 0 && (
          <TouchableOpacity onPress={handleMarcarTodasLidas}>
            <Text style={styles.marcarTodas}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notificacoes}
        renderItem={renderNotificacao}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  marcarTodas: {
    color: '#007AFF',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  unread: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mensagem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  data: {
    fontSize: 12,
    color: '#999',
  },
});
```

---

## Resumo de Permissões

| Endpoint | Autenticação | Permissão Especial |
|----------|--------------|-------------------|
| Salvar Token | ✅ | - |
| Listar Tokens | ✅ | - |
| Desativar Token | ✅ | - |
| Enviar para Todos | ✅ | Admin Only |
| Enviar para Usuários | ✅ | Admin Only |
| Enviar para Usuário | ✅ | - |
| Enviar para Condomínio | ✅ | Admin Only |
| Enviar para Tipo | ✅ | Admin Only |
| Listar Notificações | ✅ | - |
| Listar Não Lidas | ✅ | - |
| Marcar como Lida | ✅ | - |
| Marcar Todas Lidas | ✅ | - |

---

## Observações Importantes

1. **Token OneSignal vs Token de Auth:** O "token" salvo no endpoint `/token` é o Player ID do OneSignal, não o token JWT de autenticação.

2. **Campo Dados:** O campo `dados` aceita uma string JSON com informações extras que serão enviadas com a notificação.

3. **Permissões Admin:** Endpoints marcados como "Admin Only" só podem ser acessados por usuários com `TipoUsuario = Admin`.

4. **Atualização Automática:** Se você salvar um token para o mesmo usuário e dispositivo, ele será atualizado automaticamente, não duplicado.

5. **OneSignal AppId e ApiKey:** Configure no arquivo `appsettings.json` do backend:
```json
{
  "OneSignal": {
    "AppId": "seu-app-id",
    "ApiKey": "sua-api-key"
  }
}
```
