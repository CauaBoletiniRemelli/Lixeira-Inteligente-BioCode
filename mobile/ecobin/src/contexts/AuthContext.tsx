import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { authService } from '../services';
import { mapTipoToRole } from '../utils';

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

const USER_STORAGE_KEY = '@ecobin:user';
const TOKEN_STORAGE_KEY = '@ecobin:token';
const REFRESH_TOKEN_STORAGE_KEY = '@ecobin:refreshToken';

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
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        
        try {
            const loginData = { Email: email, Password: password };
            const response = await authService.login(loginData);

            if (!response.status || !response.dados) {
                throw new Error(response.mensagem || 'Erro ao fazer login');
            }

            const { token: tokenObj, refreshToken, userId, email: userEmail, nome, tipo, condominiumId, condominiumName } = response.dados;

            const token = typeof tokenObj === 'string' ? tokenObj : tokenObj.token;

            const role: UserRole = mapTipoToRole(tipo ?? 0);

            const authenticatedUser: User = {
                id: userId,
                name: nome,
                email: userEmail,
                role: role,
                condominiumId: condominiumId,
                condominiumName: condominiumName,
            };

            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
            await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

            setUser(authenticatedUser);
        } catch (error: any) {
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            
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
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
            
            if (refreshToken) {
                try {
                    await authService.logout(refreshToken);
                } catch (error) {
                    console.error('Erro ao fazer logout na API:', error);
                }
            }

            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
            await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            
            setUser(null);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
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
