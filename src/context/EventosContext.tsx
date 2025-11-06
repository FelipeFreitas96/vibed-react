import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Evento, Filtros, Localizacao, TipoOrdenacao, PrecoFiltro, Voto } from '../types';
import { obterLocalizacao, calcularDistancia } from '../utils/geolocalizacao';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from './AuthContext';

interface EventosContextType {
  eventos: Evento[];
  localizacaoUsuario: Localizacao | null;
  adicionarEvento: (evento: Omit<Evento, 'id' | 'criadoEm' | 'distancia' | 'criadoPor' | 'aprovado' | 'aprovadoPor' | 'aprovadoEm'>) => Promise<void>;
  eventosFiltrados: Evento[];
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  ordenacao: TipoOrdenacao;
  setOrdenacao: (ordenacao: TipoOrdenacao) => void;
  carregarLocalizacao: () => Promise<void>;
  carregarEventos: () => Promise<void>;
  buscarEventoPorId: (id: string) => Promise<Evento | undefined>;
  votarEvento: (eventoId: string, nota: number) => Promise<void>;
  obterMeuVoto: (eventoId: string) => Promise<number | null>;
  isLoading: boolean;
}

const EventosContext = createContext<EventosContextType | undefined>(undefined);

export const useEventos = () => {
  const context = useContext(EventosContext);
  if (!context) {
    throw new Error('useEventos deve ser usado dentro de EventosProvider');
  }
  return context;
};

interface EventosProviderProps {
  children: ReactNode;
}

export const EventosProvider: React.FC<EventosProviderProps> = ({ children }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState<Localizacao | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao>('distancia');
  const [votos, setVotos] = useState<Record<string, Voto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const carregarLocalizacao = async () => {
    try {
    const loc = await obterLocalizacao();
    setLocalizacaoUsuario(loc);
    } catch (error) {
      console.error('Erro ao carregar localização:', error);
    }
  };

  const carregarEventos = async () => {
    try {
      setIsLoading(true);
      
      // Construir query params para filtros
      const params = new URLSearchParams();
      
      if (filtros.data) params.append('data', filtros.data);
      if (filtros.turno) params.append('turno', filtros.turno);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.preco) params.append('preco', filtros.preco as string);
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.generoMusical && filtros.generoMusical.length > 0) {
        filtros.generoMusical.forEach(gen => params.append('generoMusical', gen));
      }
      if (filtros.tipoComida) params.append('tipoComida', filtros.tipoComida);
      if (filtros.temBrinquedoteca !== undefined) {
        params.append('temBrinquedoteca', filtros.temBrinquedoteca.toString());
      }
      if (filtros.publico) params.append('publico', filtros.publico);
      
      params.append('ordenacao', ordenacao);
      
      // Adicionar localização se disponível
      if (localizacaoUsuario) {
        params.append('latitude', localizacaoUsuario.latitude.toString());
        params.append('longitude', localizacaoUsuario.longitude.toString());
      }

      const queryString = params.toString();
      const endpoint = `/api/eventos${queryString ? `?${queryString}` : ''}`;
      
      const eventosData = await apiGet(endpoint, { requireAuth: false });
      
      // Converter eventos do backend para o formato do frontend
      const { formatarUrlImagem } = await import('../utils/api');
      const eventosFormatados: Evento[] = eventosData.map((evento: any) => ({
        ...evento,
        // Garantir que todos os campos opcionais estejam presentes
        avaliacao: evento.avaliacao || 0,
        distancia: evento.distancia,
        // Formatar URL da imagem se houver ID
        imagem: formatarUrlImagem(evento.imagem),
      }));
      
      setEventos(eventosFormatados);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      // Em caso de erro, manter eventos vazios
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar eventos quando filtros, ordenação ou localização mudarem
  useEffect(() => {
    carregarEventos();
  }, [filtros, ordenacao, localizacaoUsuario]);

  // Carregar localização e votos ao montar
  useEffect(() => {
    carregarLocalizacao();
    
    // Carregar votos salvos do localStorage (cache local)
    const votosSalvos = localStorage.getItem('vibed-votos');
    if (votosSalvos) {
      try {
        const votosParsed = JSON.parse(votosSalvos);
        setVotos(votosParsed);
      } catch (error) {
        console.error('Erro ao carregar votos:', error);
      }
    }
    
    // Carregar votos do backend se estiver logado
    if (user) {
      carregarVotosDoBackend();
    }
  }, [user]);
  
  const carregarVotosDoBackend = async () => {
    if (!user) return;
    
    // Carregar votos para cada evento
    const votosPromises = eventos.map(async (evento) => {
      try {
        const response = await apiGet(`/api/eventos/${evento.id}/voto`, { requireAuth: true });
        if (response.voto) {
          return {
            eventoId: evento.id,
            nota: response.voto.nota,
            data: response.voto.data || new Date().toISOString(),
          };
        }
        return null;
      } catch (error) {
        // Se não houver voto ou erro, retornar null
        return null;
      }
    });
    
    const votosArray = await Promise.all(votosPromises);
    const votosObj: Record<string, Voto> = {};
    
    votosArray.forEach((voto) => {
      if (voto) {
        votosObj[`voto-${voto.eventoId}`] = voto;
      }
    });
    
    setVotos(votosObj);
  };


  // Salvar votos no localStorage como cache
  useEffect(() => {
    if (Object.keys(votos).length > 0) {
      localStorage.setItem('vibed-votos', JSON.stringify(votos));
    }
  }, [votos]);

  // A avaliação dos eventos já vem do backend, não precisamos calcular aqui

  const adicionarEvento = async (eventoData: Omit<Evento, 'id' | 'criadoEm' | 'distancia' | 'criadoPor' | 'aprovado' | 'aprovadoPor' | 'aprovadoEm'>) => {
    try {
      // Criar evento via API
      const novoEvento = await apiPost('/api/eventos', eventoData, { requireAuth: true });
      
      // Formatar URL da imagem se houver
      const { formatarUrlImagem } = await import('../utils/api');
      const eventoFormatado = {
        ...novoEvento,
        imagem: formatarUrlImagem(novoEvento.imagem),
      };
      
      // Adicionar ao estado local (sem recarregar tudo para evitar duplicação)
      setEventos((prev) => {
        // Verificar se o evento já existe para evitar duplicação
        const existe = prev.find(e => e.id === eventoFormatado.id);
        if (existe) {
          return prev; // Já existe, não adicionar novamente
        }
        return [...prev, eventoFormatado];
      });
      
      // Não recarregar eventos aqui para evitar duplicação
      // O evento já foi adicionado ao estado local acima
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  };

  const buscarEventoPorId = async (id: string): Promise<Evento | undefined> => {
    // Primeiro, tentar buscar no estado local
    const eventoLocal = eventos.find((evento) => evento.id === id);
    if (eventoLocal) {
      return eventoLocal;
    }
    
    // Se não encontrar, buscar no backend
    // Se o usuário estiver logado, usar requireAuth: true para que o backend saiba que pode ser admin
    // Se não estiver logado, usar requireAuth: false (público)
    try {
      const evento = await apiGet(`/api/eventos/${id}`, { requireAuth: !!user });
      const { formatarUrlImagem } = await import('../utils/api');
      
      // Formatar URL da imagem
      const eventoFormatado = {
        ...evento,
        imagem: formatarUrlImagem(evento.imagem),
      };
      
      // Adicionar ao estado local se não estiver lá
      setEventos((prev) => {
        const existe = prev.find((e) => e.id === id);
        if (!existe) {
          return [...prev, eventoFormatado];
        }
        return prev;
      });
      
      return eventoFormatado;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return undefined;
    }
  };

  const votarEvento = async (eventoId: string, nota: number) => {
    try {
      // Votar via API
      const eventoAtualizado = await apiPost(
        `/api/eventos/${eventoId}/votar`,
        { nota },
        { requireAuth: true }
      );
      
      // Atualizar voto local
      const novoVoto: Voto = {
        eventoId,
        nota,
        data: new Date().toISOString(),
      };
      
      const votoKey = `voto-${eventoId}`;
      setVotos(prev => ({
        ...prev,
        [votoKey]: novoVoto,
      }));
      
      // Atualizar avaliação do evento no estado local
      setEventos((prev) =>
        prev.map((evento) =>
          evento.id === eventoId
            ? { ...evento, avaliacao: eventoAtualizado.avaliacao || evento.avaliacao }
            : evento
        )
      );
    } catch (error) {
      console.error('Erro ao votar:', error);
      throw error;
    }
  };

  const obterMeuVoto = async (eventoId: string): Promise<number | null> => {
    // Primeiro, tentar buscar no estado local
    const votoKey = `voto-${eventoId}`;
    const voto = votos[votoKey];
    if (voto) {
      return voto.nota;
    }
    
    // Se não encontrar e estiver logado, buscar no backend
    if (user) {
      try {
        const response = await apiGet(`/api/eventos/${eventoId}/voto`, { requireAuth: true });
        if (response.voto) {
          const novoVoto: Voto = {
            eventoId,
            nota: response.voto.nota,
            data: response.voto.data || new Date().toISOString(),
          };
          
          setVotos((prev) => ({
            ...prev,
            [votoKey]: novoVoto,
          }));
          
          return response.voto.nota;
        }
      } catch (error) {
        console.error('Erro ao buscar voto:', error);
      }
    }
    
    return null;
  };

  const eventosFiltrados = eventos
    .map((evento) => {
      // Calcular distância se tiver localização do usuário
      let distancia = undefined;
      if (localizacaoUsuario && evento.localizacao) {
        distancia = calcularDistancia(localizacaoUsuario, evento.localizacao);
      }
      return { ...evento, distancia };
    })
    .filter((evento) => {
      // Filtrar por tipo PRIMEIRO (antes de qualquer outro filtro)
      if (filtros.tipo) {
        if (evento.tipo !== filtros.tipo) {
          return false;
        }
      }
      // Filtrar por data
      if (filtros.data) {
        if (evento.recorrente) {
          // Para eventos recorrentes, usar apenas o dia da semana da data selecionada
          // Extrair o dia da semana da data selecionada (não usar a data específica)
          const [ano, mes, dia] = filtros.data.split('-').map(Number);
          const dataFiltro = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11
          const diaSemanaFiltro = dataFiltro.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
          
          // Verificar se o evento ocorre no dia da semana correspondente à data selecionada
          if (!evento.diasSemana || !evento.diasSemana.includes(diaSemanaFiltro as any)) {
            return false;
          }
        } else {
          // Para eventos pontuais, verificar se a data corresponde exatamente
          if (!evento.data) return false;
          const eventoData = new Date(evento.data).toISOString().split('T')[0];
          if (eventoData !== filtros.data) return false;
        }
      }

      // Filtrar por turno
      if (filtros.turno) {
        if (filtros.turno === 'madrugada') {
          // Eventos que ficam abertos até a madrugada (fechamento após meia-noite)
          const [horaFechamento] = evento.horarioFechamento.split(':').map(Number);
          if (horaFechamento >= 0 && horaFechamento < 6) {
            // Fechamento entre 00:00 e 06:00
            return true;
          }
          return false;
        } else {
          // Filtro normal por turno
          if (evento.turno !== filtros.turno) return false;
        }
      }


      // Filtros específicos por tipo
      if (filtros.tipo === 'balada') {
        if (filtros.publico && evento.publico !== filtros.publico) return false;
        if (filtros.generoMusical && filtros.generoMusical.length > 0) {
          // Verificar se o evento tem pelo menos um dos gêneros selecionados
          if (!evento.generoMusical || evento.generoMusical.length === 0) return false;
          const temGenero = filtros.generoMusical.some(genero => evento.generoMusical?.includes(genero));
          if (!temGenero) return false;
        }
      }
      
      if (filtros.tipo === 'show' || filtros.tipo === 'festival') {
        if (filtros.generoMusical && filtros.generoMusical.length > 0) {
          // Verificar se o evento tem pelo menos um dos gêneros selecionados
          if (!evento.generoMusical || evento.generoMusical.length === 0) return false;
          const temGenero = filtros.generoMusical.some(genero => evento.generoMusical?.includes(genero));
          if (!temGenero) return false;
        }
      }
      
      if (filtros.tipo === 'restaurante') {
        if (filtros.tipoComida && evento.tipoComida !== filtros.tipoComida) return false;
      }
      
      if (filtros.tipo === 'bar') {
        if (filtros.generoMusical && filtros.generoMusical.length > 0) {
          // Verificar se o evento tem pelo menos um dos gêneros selecionados
          if (!evento.generoMusical || evento.generoMusical.length === 0) return false;
          const temGenero = filtros.generoMusical.some(genero => evento.generoMusical?.includes(genero));
          if (!temGenero) return false;
        }
        if (filtros.temBrinquedoteca !== undefined && evento.temBrinquedoteca !== filtros.temBrinquedoteca) return false;
      }

      // Filtrar por preço (usando ranges)
      if (filtros.preco) {
        const filtroPreco = filtros.preco as PrecoFiltro;
        
        // Se uma data específica foi selecionada e o evento é recorrente, usar o preço do dia específico
        let precoEvento: string = evento.preco;
        let valorEntradaEvento: number | undefined = evento.valorEntrada;
        
        if (filtros.data && evento.recorrente && evento.horariosPorDia && evento.horariosPorDia.length > 0) {
          // Usar uma forma segura que não depende de timezone
          const [ano, mes, dia] = filtros.data.split('-').map(Number);
          const dataFiltro = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11
          const diaSemanaFiltro = dataFiltro.getDay();
          const horarioDia = evento.horariosPorDia.find((h: any) => h.dia === diaSemanaFiltro);
          
          if (horarioDia) {
            precoEvento = horarioDia.preco || 'gratuito';
            valorEntradaEvento = horarioDia.valorEntrada;
          }
        }
        
        if (filtroPreco === 'gratuito' && precoEvento !== 'gratuito') return false;
        
        if (filtroPreco === 'ate-50' && precoEvento === 'pago') {
          if (!valorEntradaEvento || valorEntradaEvento > 50) return false;
        }
        if (filtroPreco === 'ate-100' && precoEvento === 'pago') {
          if (!valorEntradaEvento || valorEntradaEvento > 100) return false;
        }
        if (filtroPreco === 'ate-200' && precoEvento === 'pago') {
          if (!valorEntradaEvento || valorEntradaEvento > 200) return false;
        }
        if (filtroPreco === 'qualquer-valor' && precoEvento !== 'pago') return false;
      }

      // Filtrar por busca textual
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        if (
          !evento.nome.toLowerCase().includes(busca) &&
          !evento.descricao.toLowerCase().includes(busca) &&
          !evento.endereco.toLowerCase().includes(busca)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (ordenacao) {
        case 'distancia':
      // Priorizar eventos mais próximos
      if (a.distancia !== undefined && b.distancia !== undefined) {
        return a.distancia - b.distancia;
      }
      if (a.distancia !== undefined) return -1;
      if (b.distancia !== undefined) return 1;
          // Se não tiver distância, ordenar por data (se existir)
          if (!a.data || !b.data) return 0;
          const dataA1 = new Date(a.data).getTime();
          const dataB1 = new Date(b.data).getTime();
          return dataA1 - dataB1;
        
        case 'nota':
          // Ordenar por nota (maior para menor)
          return b.avaliacao - a.avaliacao;
        
        case 'preco':
          // Ordenar por preço (menor para maior)
          const valorA = a.preco === 'gratuito' ? 0 : (a.valorEntrada || 999999);
          const valorB = b.preco === 'gratuito' ? 0 : (b.valorEntrada || 999999);
          return valorA - valorB;
        
        case 'data':
          // Ordenar por data (mais próximo para mais distante)
          // Eventos recorrentes vêm depois dos pontuais
          if (a.recorrente && !b.recorrente) return 1;
          if (!a.recorrente && b.recorrente) return -1;
          if (a.recorrente && b.recorrente) return 0;
          if (!a.data || !b.data) return 0;
          const dataA = new Date(a.data).getTime();
          const dataB = new Date(b.data).getTime();
          return dataA - dataB;
        
        case 'nome':
          // Ordenar por nome (alfabético)
          return a.nome.localeCompare(b.nome, 'pt-BR');
        
        default:
          return 0;
      }
    });

  return (
    <EventosContext.Provider
      value={{
        eventos,
        localizacaoUsuario,
        adicionarEvento,
        eventosFiltrados,
        filtros,
        setFiltros,
        ordenacao,
        setOrdenacao,
        carregarLocalizacao,
        carregarEventos,
        buscarEventoPorId,
        votarEvento,
        obterMeuVoto,
        isLoading,
      }}
    >
      {children}
    </EventosContext.Provider>
  );
};

