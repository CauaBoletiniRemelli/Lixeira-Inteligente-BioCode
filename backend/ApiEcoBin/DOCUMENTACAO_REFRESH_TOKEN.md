# 📱 Documentação - RefreshToken no React Native + Expo

## 🎯 Objetivo
Manter o usuário autenticado no app sem necessidade de fazer login repetidamente, renovando automaticamente o Access Token quando ele expirar.

---

## 🔑 Conceitos Importantes

### Access Token
- **Validade**: 15 minutos
- **Uso**: Enviar em todas as requisições protegidas no header `Authorization`
- **Formato**: `Bearer {token}`

### Refresh Token
- **Validade**: 7 dias
- **Uso**: Renovar o Access Token quando ele expirar
- **Armazenamento**: SecureStore (criptografado no dispositivo)

---

## 📦 Instalação de Dependências

```bash
npx expo install expo-secure-store
npm install axios
```

---

## 🏗️ Estrutura de Arquivos Recomendada

```
src/
├── services/
│   ├── api.js              # Configuração do Axios
│   └── auth.js             # Funções de autenticação
├── contexts/
│   └── AuthContext.js      # Context de autenticação
└── utils/
    └── storage.js          # Funções de armazenamento
```

---

## 💾 1. Criar Serviço de Storage (utils/storage.js)

```javascript
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  APP_TOKEN: 'app_token',
};

export const storage = {
  // Salvar tokens
  async saveTokens(accessToken, refreshToken) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, JSON.stringify(accessToken));
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Erro ao salvar tokens:', error);
      throw error;
    }
  },

  // Buscar Access Token
  async getAccessToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error('Erro ao buscar access token:', error);
      return null;
    }
  },

  // Buscar Refresh Token
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Erro ao buscar refresh token:', error);
      return null;
    }
  },

  // Salvar dados do usuário
  async saveUserData(userData) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
    }
  },

  // Buscar dados do usuário
  async getUserData() {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  },

  // Salvar token do app
  async saveAppToken(appToken) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.APP_TOKEN, JSON.stringify(appToken));
    } catch (error) {
      console.error('Erro ao salvar app token:', error);
    }
  },

  // Buscar token do app
  async getAppToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.APP_TOKEN);
      return token ? JSON.parse(token) : null;
    } catch (error) {
      console.error('Erro ao buscar app token:', error);
      return null;
    }
  },

  // Limpar todos os dados
  async clearAll() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      // Não limpar APP_TOKEN - ele persiste entre logins de usuário
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  },
};
```

---

## 🌐 2. Configurar API com Interceptors (services/api.js)

```javascript
import axios from 'axios';
import { storage } from '../utils/storage';

const API_URL = 'https://sua-api.com/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variável para controlar se já está renovando o token
let isRefreshing = false;
let refreshSubscribers = [];

// Função para notificar os subscribers quando o token for renovado
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Adicionar subscriber para aguardar renovação do token
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// INTERCEPTOR DE REQUEST - Adiciona o token em todas as requisições
api.interceptors.request.use(
  async (config) => {
    // Buscar o token do usuário
    const accessToken = await storage.getAccessToken();
    
    if (accessToken && accessToken.token) {
      config.headers.Authorization = `Bearer ${accessToken.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPONSE - Renova o token automaticamente se expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 (Unauthorized) e não for a rota de refresh/login
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/RefreshToken') &&
      !originalRequest.url.includes('/Login')
    ) {
      // Se já está renovando, adiciona a requisição na fila
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Buscar o refresh token
        const refreshToken = await storage.getRefreshToken();
        const accessToken = await storage.getAccessToken();

        if (!refreshToken) {
          throw new Error('Refresh token não encontrado');
        }

        console.log('🔄 Renovando token...');

        // Chamar endpoint de refresh token
        const response = await axios.post(
          `${API_URL}/Auth/RefreshToken`,
          {
            refreshToken: refreshToken,
            accessToken: accessToken?.token || null,
          }
        );

        if (response.data.status && response.data.dados) {
          const { token, refreshToken: newRefreshToken } = response.data.dados;

          // Salvar novos tokens
          await storage.saveTokens(token, newRefreshToken);
          await storage.saveUserData(response.data.dados);

          console.log('✅ Token renovado com sucesso!');

          // Atualizar o header da requisição original
          originalRequest.headers.Authorization = `Bearer ${token.token}`;

          // Notificar todos os subscribers
          onRefreshed(token.token);
          isRefreshing = false;

          // Retentar a requisição original
          return api(originalRequest);
        } else {
          throw new Error('Falha ao renovar token');
        }
      } catch (refreshError) {
        console.error('❌ Erro ao renovar token:', refreshError);
        isRefreshing = false;
        refreshSubscribers = [];

        // Limpar storage e redirecionar para login
        await storage.clearAll();
        
        // Aqui você pode disparar um evento para fazer logout
        // Por exemplo, usando EventEmitter ou Navigation
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 3. Criar Serviço de Autenticação (services/auth.js)

```javascript
import axios from 'axios';
import api from './api';
import { storage } from '../utils/storage';

const API_URL = 'https://sua-api.com/api';

export const authService = {
  // Login do Aplicativo (primeira etapa)
  async appLogin() {
    try {
      const response = await axios.post(`${API_URL}/Auth/AppLogin`, {
        appId: 'SEU_APP_ID',
        appSecret: 'SEU_APP_SECRET',
      });

      if (response.data.status && response.data.dados) {
        await storage.saveAppToken(response.data.dados.token);
        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao autenticar aplicativo');
    } catch (error) {
      console.error('Erro no AppLogin:', error);
      throw error;
    }
  },

  // Login do Usuário (segunda etapa)
  async userLogin(email, password) {
    try {
      // Garantir que o app está autenticado
      let appToken = await storage.getAppToken();
      
      if (!appToken) {
        const appData = await this.appLogin();
        appToken = appData.token;
      }

      // Login do usuário com o token do app
      const response = await axios.post(
        `${API_URL}/Auth/Login`,
        {
          email,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${appToken.token}`,
          },
        }
      );

      if (response.data.status && response.data.dados) {
        const { token, refreshToken, ...userData } = response.data.dados;

        // Salvar tokens e dados do usuário
        await storage.saveTokens(token, refreshToken);
        await storage.saveUserData(response.data.dados);

        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao fazer login');
    } catch (error) {
      console.error('Erro no Login:', error);
      throw error;
    }
  },

  // Renovar Token Manualmente (se necessário)
  async refreshToken() {
    try {
      const refreshToken = await storage.getRefreshToken();
      const accessToken = await storage.getAccessToken();

      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await axios.post(`${API_URL}/Auth/RefreshToken`, {
        refreshToken: refreshToken,
        accessToken: accessToken?.token || null,
      });

      if (response.data.status && response.data.dados) {
        const { token, refreshToken: newRefreshToken } = response.data.dados;

        await storage.saveTokens(token, newRefreshToken);
        await storage.saveUserData(response.data.dados);

        return response.data.dados;
      }

      throw new Error(response.data.mensagem || 'Erro ao renovar token');
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      const refreshToken = await storage.getRefreshToken();

      if (refreshToken) {
        await api.post('/Auth/Logout', {
          refreshToken: refreshToken,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      await storage.clearAll();
    }
  },

  // Verificar se está autenticado
  async isAuthenticated() {
    const refreshToken = await storage.getRefreshToken();
    const userData = await storage.getUserData();
    return !!(refreshToken && userData);
  },
};
```

---

## 🎭 4. Criar Context de Autenticação (contexts/AuthContext.js)

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth';
import { storage } from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do usuário ao iniciar
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await storage.getUserData();
      const refreshToken = await storage.getRefreshToken();

      if (userData && refreshToken) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const userData = await authService.userLogin(email, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
```

---

## 🚀 5. Uso no App

### App.js

```javascript
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import Routes from './src/routes';

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
```

### Tela de Login

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Navegação será automática pelo Routes
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

### Fazer Requisições Protegidas

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import api from '../services/api';

export default function CondominiosScreen() {
  const [condominios, setCondominios] = useState([]);

  useEffect(() => {
    loadCondominios();
  }, []);

  const loadCondominios = async () => {
    try {
      // O token será adicionado automaticamente pelo interceptor
      const response = await api.get('/Condominios');
      
      if (response.data.status) {
        setCondominios(response.data.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar condomínios:', error);
      // Se o token expirar, o interceptor vai renovar automaticamente
    }
  };

  return (
    <View>
      {condominios.map((cond) => (
        <Text key={cond.id}>{cond.nome}</Text>
      ))}
    </View>
  );
}
```

---

## 🔄 Fluxo Completo

1. **App inicia** → Verifica se há `refreshToken` salvo
2. **Usuário faz login** → Recebe `accessToken` (15min) + `refreshToken` (7 dias)
3. **Tokens salvos** → `SecureStore` (criptografado)
4. **Requisições** → `accessToken` enviado automaticamente
5. **Token expira** → Interceptor detecta erro 401
6. **Renovação automática** → Chama `/RefreshToken` com o `refreshToken`
7. **Novos tokens** → Salva e retenta a requisição original
8. **Usuário continua** → Sem perceber nada!

---

## ⚠️ Importante

- ✅ **NUNCA** envie `refreshToken` em headers
- ✅ Use `SecureStore` para armazenamento (criptografado)
- ✅ Sempre use HTTPS em produção
- ✅ Implemente timeout nas requisições
- ✅ Trate erros de rede adequadamente
- ✅ Logout ao receber erro de refresh token inválido

---

## 🐛 Debugging

Para debugar problemas com RefreshToken:

```javascript
// Adicione logs no interceptor
console.log('🔑 Access Token:', await storage.getAccessToken());
console.log('🔄 Refresh Token:', await storage.getRefreshToken());
console.log('👤 User Data:', await storage.getUserData());
```

---

## 📝 Resumo

O sistema de RefreshToken mantém o usuário autenticado sem interrupções. O Axios interceptor detecta quando o token expira e renova automaticamente, tornando a experiência do usuário transparente e segura! 🚀
