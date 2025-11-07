import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { authService } from '../services';
import { mapTipoToRole, showConfirmAlert } from '../utils';
import { STORAGE_KEYS } from '../config/env';

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    initialLoading: boolean;
    hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const USER_STORAGE_KEY = STORAGE_KEYS.USER_DATA;
const TOKEN_STORAGE_KEY = STORAGE_KEYS.USER_TOKEN;
const REFRESH_TOKEN_STORAGE_KEY = STORAGE_KEYS.REFRESH_TOKEN;

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        loadStoredUser();
    }, []);

    const loadStoredUser = async () => {
        try {
            setInitialLoading(true);
            const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
            const userToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
            
            if (storedUser && userToken && refreshToken) {
                try {
                    const tokenData = JSON.parse(atob(userToken.split('.')[1]));
                    const expirationTime = tokenData.exp * 1000;
                    const isExpired = Date.now() >= expirationTime;
                    
                    if (isExpired) {
                        console.log('🔄 Token expirado ao carregar app, renovando...');
                        const { refreshUserToken } = await import('../services/api');
                        const success = await refreshUserToken();
                        
                        if (success) {
                            console.log('✅ Token renovado com sucesso ao carregar app');
                            const updatedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                            setUser(updatedUser ? JSON.parse(updatedUser) : JSON.parse(storedUser));
                        } else {
                            console.log('❌ Falha ao renovar token, usuário precisa fazer login');
                            await clearStoredData();
                        }
                    } else {
                        console.log('✅ Token válido ao carregar app');
                        setUser(JSON.parse(storedUser));
                    }
                } catch (tokenError) {
                    console.error('❌ Erro ao validar token:', tokenError);
                    // Se houver erro ao validar o token, limpa os dados e força novo login
                    await clearStoredData();
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            await clearStoredData();
        } finally {
            setInitialLoading(false);
        }
    };
    
    const clearStoredData = async () => {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        setUser(null);
    };

    const login = async (email: string, password: string) => {
        setLoading(true);

        try {
            const loginData = { Email: email, Password: password };

            const response = await authService.login(loginData);

            if (!response.status || !response.dados) {
                throw new Error(response.mensagem || 'Erro ao fazer login');
            }

            const { token: tokenObj, refreshToken, userId, email: userEmail, nome, tipo, condominioId, nomeCondominio } = response.dados;

            const token = typeof tokenObj === 'string' ? tokenObj : tokenObj.token;

            const role: UserRole = mapTipoToRole(tipo ?? 0);

            const authenticatedUser: User = {
                id: userId,
                name: nome,
                email: userEmail,
                role: role,
                condominiumId: condominioId,
                condominiumName: nomeCondominio,
            };

            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
            await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

            setUser(authenticatedUser);
        } catch (error: any) {
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

            console.error('❌ Erro detalhado no login:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                hasResponse: !!error.response,
                hasRequest: !!error.request
            });

            if (error.response) {
                if (error.response.data?.mensagem) {
                    errorMessage = error.response.data.mensagem;
                } else if (error.response.status === 401) {
                    errorMessage = 'E-mail ou senha incorretos.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Serviço não encontrado. Verifique sua conexão.';
                } else if (error.response.status >= 500) {
                    errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
                }
            } else if (error.request) {
                errorMessage = 'Erro de conexão. Verifique sua internet.';
            }

            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            const confirmed = await showConfirmAlert(
                'Realizar Logout',
                `Tem certeza que deseja realizar logout?`,
                'Sim',
                'Não'
            );

            if (!confirmed) return;

            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

            if (refreshToken) {
                try {
                    await authService.logout(refreshToken);
                } catch (error) {
                    console.log('Erro ao fazer logout na API:', error);
                }
            }

            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
            await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

            setUser(null);
        } catch (error) {
            console.log('Erro ao fazer logout:', error);
        }
    };

    const hasPermission = (requiredRoles: UserRole[]) => {
        if (!user) return false;
        return requiredRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
                loading,
                initialLoading,
                hasPermission,
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
