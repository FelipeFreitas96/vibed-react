/**
 * Utilitário para extrair informações de links do Google Maps/Places
 */

interface GooglePlaceInfo {
  nome?: string;
  endereco?: string;
  localizacao?: {
    latitude: number;
    longitude: number;
  };
  horarios?: {
    [key: string]: {
      abertura?: string;
      fechamento?: string;
    };
  };
  imagemUrl?: string;
}

/**
 * Extrai o Place ID de um link do Google Maps/Places
 */
const extrairPlaceId = (url: string): string | null => {
  // Formato: https://www.google.com/maps/place/.../@lat,lng,.../data=...
  // ou: https://maps.google.com/?cid=...
  // ou: https://www.google.com/maps/place/Nome+do+Lugar/@lat,lng,zoom/data=...
  
  // Tentar extrair do formato /place/.../@
  const placeMatch = url.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }
  
  // Tentar extrair coordenadas
  const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    return `${coordMatch[1]},${coordMatch[2]}`;
  }
  
  // Tentar extrair CID
  const cidMatch = url.match(/[?&]cid=(\d+)/);
  if (cidMatch) {
    return cidMatch[1];
  }
  
  return null;
};

/**
 * Extrai coordenadas de um link do Google Maps
 */
const extrairCoordenadas = (url: string): { latitude: number; longitude: number } | null => {
  const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
    };
  }
  
  // Tentar formato ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return {
      latitude: parseFloat(qMatch[1]),
      longitude: parseFloat(qMatch[2]),
    };
  }
  
  return null;
};

/**
 * Extrai o nome do lugar de um link do Google Maps
 */
const extrairNome = (url: string): string | null => {
  // Formato: /place/Nome+do+Lugar/@
  const placeMatch = url.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    const nome = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    // Remover informações extras que podem vir no nome
    return nome.split('/')[0].trim();
  }
  
  return null;
};

/**
 * Busca informações detalhadas fazendo scraping do Google Maps
 */
const buscarDetalhesViaScraping = async (
  url: string,
  placeId?: string,
  coordenadas?: { latitude: number; longitude: number }
): Promise<GooglePlaceInfo | null> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Chamar endpoint do backend que faz scraping do Google Maps
    const response = await fetch(`${API_URL}/api/google-places/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        placeId,
        coordenadas,
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      nome: data.nome,
      endereco: data.endereco,
      localizacao: data.localizacao,
      horarios: data.horarios,
      imagemUrl: data.imagemUrl,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes via scraping:', error);
    return null;
  }
};

/**
 * Processa um link do Google Maps/Places e retorna informações extraídas
 */
export const processarLinkGoogle = async (url: string): Promise<GooglePlaceInfo | null> => {
  if (!url || !url.includes('google.com/maps') && !url.includes('maps.google.com')) {
    return null;
  }
  
  const info: GooglePlaceInfo = {};
  
  // Extrair nome
  const nome = extrairNome(url);
  if (nome) {
    info.nome = nome;
  }
  
  // Extrair coordenadas
  const coordenadas = extrairCoordenadas(url);
  if (coordenadas) {
    info.localizacao = coordenadas;
  }
  
  // Extrair Place ID
  const placeId = extrairPlaceId(url);
  
  // Tentar buscar detalhes via scraping
  const detalhesScraping = await buscarDetalhesViaScraping(url, placeId || undefined, coordenadas || undefined);
  if (detalhesScraping) {
    // Mesclar informações do scraping com informações extraídas do link
    return {
      nome: detalhesScraping.nome || info.nome,
      endereco: detalhesScraping.endereco || info.endereco,
      localizacao: detalhesScraping.localizacao || info.localizacao || undefined,
      horarios: detalhesScraping.horarios,
      imagemUrl: detalhesScraping.imagemUrl,
    };
  }
  
  // Se não conseguiu via API, retornar pelo menos o que extraiu do link
  if (info.nome || info.localizacao) {
    return info;
  }
  
  return null;
};

/**
 * Valida se uma URL é um link válido do Google Maps/Places
 */
export const validarLinkGoogle = (url: string): boolean => {
  if (!url) return false;
  
  const googleMapsPatterns = [
    /google\.com\/maps/,
    /maps\.google\.com/,
    /goo\.gl\/maps/,
  ];
  
  return googleMapsPatterns.some(pattern => pattern.test(url));
};

