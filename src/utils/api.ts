/**
 * Utilitário para fazer chamadas à API do backend
 * 
 * A URL da API é configurada através da variável de ambiente VITE_API_URL.
 * Crie um arquivo .env na raiz do projeto mobile/ com:
 * VITE_API_URL=https://api.piracuiba.com
 * 
 * Para desenvolvimento local:
 * VITE_API_URL=http://localhost:3001
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Formata a URL da imagem baseada no ID da imagem
 * Todas as imagens são processadas e salvas como WebP
 */
export const formatarUrlImagem = (imagemId: string | undefined | null): string | undefined => {
  if (!imagemId) return undefined;
  
  // Todas as imagens são processadas e salvas como WebP
  return `${API_URL}/photos/${imagemId}.webp`;
};

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Faz uma requisição à API com autenticação automática
 */
export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {}
): Promise<Response> => {
  const { requireAuth = false, headers = {}, ...fetchOptions } = options;

  // Obter token e userId do localStorage
  const token = localStorage.getItem('vibed-token');
  const userStr = localStorage.getItem('vibed-user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  // Log para debug
  if (requireAuth) {
    console.log('🔐 Autenticação:', {
      hasToken: !!token,
      hasUser: !!user,
      userId: userId,
      user: user
    });

    if (!userId) {
      console.error('❌ Erro: requireAuth=true mas userId não encontrado no localStorage');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
  }

  // Headers padrão
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Adicionar header de autenticação se necessário
  if (requireAuth && userId) {
    defaultHeaders['x-user-id'] = userId;
    // Enviar também nome e email do usuário se disponíveis
    if (user?.nome) {
      defaultHeaders['x-user-nome'] = user.nome;
    }
    if (user?.email) {
      defaultHeaders['x-user-email'] = user.email;
    }
  }

  // Se houver token, adicionar ao header Authorization
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: defaultHeaders,
  });

  return response;
};

/**
 * Faz uma requisição GET
 */
export const apiGet = async (
  endpoint: string,
  options: ApiOptions = {}
): Promise<any> => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
};

/**
 * Faz uma requisição POST
 */
export const apiPost = async (
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<any> => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
};

/**
 * Faz uma requisição PUT
 */
export const apiPut = async (
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<any> => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
};

/**
 * Faz uma requisição DELETE
 */
export const apiDelete = async (
  endpoint: string,
  options: ApiOptions = {}
): Promise<any> => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
};

