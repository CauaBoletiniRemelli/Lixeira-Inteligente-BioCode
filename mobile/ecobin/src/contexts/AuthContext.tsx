import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const USER_STORAGE_KEY = '@ecobin:user';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Carrega o usuário salvo ao iniciar o app
    useEffect(() => {
        loadStoredUser();
    }, []);

    const loadStoredUser = async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);

            let role: UserRole = 'coletor';
            if (email.includes('admin')) {
                role = 'admin';
            } else if (email.includes('sindico')) {
                role = 'sindico';
            }

            const mockUser: User = {
                id: '1',
                name: email.includes('admin') ? 'Admin' : email.includes('sindico') ? 'Síndico' : 'Coletor',
                email: email,
                role: role,
            };

            setUser(mockUser);
            // Salva o usuário no AsyncStorage
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
        } catch (error) {
            throw new Error('Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
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
