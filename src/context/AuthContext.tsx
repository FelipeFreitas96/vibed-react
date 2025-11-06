import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  nivelAcesso?: 'admin' | 'user'; // Nível de acesso do usuário
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const storedUser = localStorage.getItem('vibed-user');
    const storedToken = localStorage.getItem('vibed-token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      console.log('📂 Usuário carregado do localStorage:', parsedUser);
      console.log('📂 nivelAcesso no localStorage:', parsedUser.nivelAcesso);
      setUser(parsedUser);
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      
      // Log para debug
      console.log('📥 Resposta do backend no login:', data);
      console.log('📥 nivelAcesso recebido:', data.nivelAcesso);
      
      // Criar user data a partir da resposta do backend
      const userData: User = {
        id: data.userId,
        nome: data.nome || email.split('@')[0],
        email: data.email || email,
        nivelAcesso: data.nivelAcesso || 'user', // Nível de acesso do backend
      };

      // Log para debug
      console.log('💾 UserData criado:', userData);
      console.log('💾 nivelAcesso no userData:', userData.nivelAcesso);

      const authToken = data.token;

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('vibed-user', JSON.stringify(userData));
      localStorage.setItem('vibed-token', authToken);
      
      // Verificar se foi salvo corretamente
      const savedUser = JSON.parse(localStorage.getItem('vibed-user') || '{}');
      console.log('✅ UserData salvo no localStorage:', savedUser);
      console.log('✅ nivelAcesso no localStorage:', savedUser.nivelAcesso);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (nome: string, email: string, senha: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar');
      }

      const data = await response.json();
      
      // Criar user data a partir da resposta do backend
      const userData: User = {
        id: data.userId,
        nome: data.nome || nome,
        email: data.email || email,
        nivelAcesso: data.nivelAcesso || 'user', // Nível de acesso do backend
      };

      const authToken = data.token;

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('vibed-user', JSON.stringify(userData));
      localStorage.setItem('vibed-token', authToken);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vibed-user');
    localStorage.removeItem('vibed-token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

