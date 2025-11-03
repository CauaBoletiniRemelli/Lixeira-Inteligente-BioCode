import React, { createContext, useState, useContext, ReactNode } from 'react';
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Implementar lógica de login aqui
      // const response = await api.post('/auth/login', { email, password });
      
      // Mock: Determina role baseado no email para teste
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
    } catch (error) {
      throw new Error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
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
