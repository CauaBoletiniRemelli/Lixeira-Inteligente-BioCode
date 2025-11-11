import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services';
import { mapTipoToRole, showConfirmAlert } from '../utils';
import { storage } from '../utils/storage';
import { notificationService } from '../services/notificationService';

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
            
            const userData = await storage.getUserData();
            const refreshToken = await storage.getRefreshToken();
            const accessToken = await storage.getAccessToken();

            if (userData && refreshToken && accessToken) {
                try {
                    const tokenStr = typeof accessToken === 'string' ? accessToken : accessToken.token;
                    const tokenData = JSON.parse(atob(tokenStr.split('.')[1]));
                    const expirationTime = tokenData.exp * 1000;
                    const isExpired = Date.now() >= expirationTime;

                    if (isExpired) {                        
                        try {
                            await authService.refreshToken();
                            const updatedUserData = await storage.getUserData();
                            
                            if (updatedUserData) {
                                const authenticatedUser: User = {
                                    id: updatedUserData.userId,
                                    name: updatedUserData.nome,
                                    email: updatedUserData.email,
                                    role: mapTipoToRole(updatedUserData.tipo ?? 0),
                                    condominiumId: updatedUserData.condominioId,
                                    condominiumName: updatedUserData.nomeCondominio,
                                };
                                
                                setUser(authenticatedUser);
                            }
                        } catch (refreshError) {
                            await storage.clearAll();
                            setUser(null);
                        }
                    } else {
                        
                        const authenticatedUser: User = {
                            id: userData.userId,
                            name: userData.nome,
                            email: userData.email,
                            role: mapTipoToRole(userData.tipo ?? 0),
                            condominiumId: userData.condominioId,
                            condominiumName: userData.nomeCondominio,
                        };
                        
                        setUser(authenticatedUser);
                        
                        notificationService.registerDevice(userData.userId).catch(err => {
                            console.error('❌ Erro ao registrar dispositivo:', err);
                        });
                    }
                } catch (tokenError) {
                    console.error('❌ Erro ao validar token:', tokenError);
                    await storage.clearAll();
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            await storage.clearAll();
            setUser(null);
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

            const { token: tokenObj, refreshToken, userId, email: userEmail, nome, tipo, condominioId, nomeCondominio } = response.dados;
            const role: UserRole = mapTipoToRole(tipo ?? 0);

            const authenticatedUser: User = {
                id: userId,
                name: nome,
                email: userEmail,
                role: role,
                condominiumId: condominioId,
                condominiumName: nomeCondominio,
            };

            setUser(authenticatedUser);
            
            notificationService.registerDevice(userId).catch(err => {
                console.error('❌ Erro ao registrar dispositivo para notificações:', err);
            });
        } catch (error: any) {
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

            console.error('❌ Erro detalhado no login:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
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

            const refreshToken = await storage.getRefreshToken();

            if (refreshToken) {
                try {
                    await authService.logout(refreshToken);
                } catch (error) {
                    console.log('❌ Erro ao fazer logout na API:', error);
                }
            }

            await storage.clearAll();
            setUser(null);
        } catch (error) {
            console.log('❌ Erro ao fazer logout:', error);
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
