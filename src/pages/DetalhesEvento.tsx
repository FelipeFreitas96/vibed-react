import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Space, Typography, Tag, Rate, Empty, message, Dropdown, MenuProps, Modal, Upload, Image, Select } from 'antd';
import { 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  TagOutlined,
  FileTextOutlined,
  EditOutlined,
  MoreOutlined,
  PictureOutlined,
  PlusOutlined,
  WarningOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useEventos } from '../context/EventosContext';
import { useAuth } from '../context/AuthContext';
import { formatarDistancia, calcularDistancia } from '../utils/geolocalizacao';
import { apiGet, apiDelete } from '../utils/api';
import Header from '../components/Header';
import './DetalhesEvento.css';

const { Title, Text, Paragraph } = Typography;

const DetalhesEvento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { buscarEventoPorId, votarEvento, obterMeuVoto, localizacaoUsuario } = useEventos();
  const { user } = useAuth();
  const [minhaNota, setMinhaNota] = useState<number | null>(null);
  const [evento, setEvento] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fotos, setFotos] = useState<any[]>([]);
  const [isLoadingFotos, setIsLoadingFotos] = useState(false);
  const [modalFotos, setModalFotos] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [categoriaFoto, setCategoriaFoto] = useState<string>('interior');
  const [vaiGanharRecompensa, setVaiGanharRecompensa] = useState<boolean>(true);
  const [fotosNaCategoria, setFotosNaCategoria] = useState<number>(0);
  const [limiteCategoria, setLimiteCategoria] = useState<number>(3);
  const [distanciaAtual, setDistanciaAtual] = useState<number | null>(null);
  const [podeAvaliar, setPodeAvaliar] = useState(false);

  // Carregar evento quando o id mudar
  useEffect(() => {
    const carregarEvento = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const eventoData = await buscarEventoPorId(id);
        setEvento(eventoData);
        // Não precisamos mais salvar visitas no localStorage
        // As visitas são baseadas nos votos dados pelos usuários
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarEvento();
  }, [id, buscarEventoPorId]);

  // Carregar meu voto quando o componente montar ou o id mudar
  useEffect(() => {
    const carregarVoto = async () => {
      if (!id) return;
      
      try {
        const voto = await obterMeuVoto(id);
        setMinhaNota(voto);
      } catch (error) {
        console.error('Erro ao carregar voto:', error);
      }
    };
    
    carregarVoto();
  }, [id, obterMeuVoto, user]);

  // Carregar fotos do evento
  useEffect(() => {
    const carregarFotos = async () => {
      if (!id) return;
      
      setIsLoadingFotos(true);
      try {
        const fotosData = await apiGet(`/api/eventos/${id}/fotos`, { requireAuth: false });
        const { formatarUrlImagem } = await import('../utils/api');
        const fotosFormatadas = Array.isArray(fotosData)
          ? fotosData.map((foto: any) => ({
              ...foto,
              imagem: formatarUrlImagem(foto.imagem),
            }))
          : [];
        setFotos(fotosFormatadas);
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
        setFotos([]);
      } finally {
        setIsLoadingFotos(false);
      }
    };
    
    carregarFotos();
  }, [id]);

  // Limites por categoria
  const limitesPorCategoria: Record<string, number> = {
    cardapio: 5,
    fachada: 1,
    interior: 3
  };

  // Verificar se vai ganhar recompensa e contar fotos na categoria
  useEffect(() => {
    if (!id || !categoriaFoto) {
      setVaiGanharRecompensa(true);
      setFotosNaCategoria(0);
      setLimiteCategoria(limitesPorCategoria[categoriaFoto] || 3);
      return;
    }

    // Contar fotos aprovadas nesta categoria para este evento
    const fotosNaCategoriaAtual = fotos.filter(
      (foto) => foto.categoria === categoriaFoto
    ).length;

    setFotosNaCategoria(fotosNaCategoriaAtual);
    setLimiteCategoria(limitesPorCategoria[categoriaFoto] || 3);

    // Verificar se o usuário já tem foto aprovada nesta categoria para este evento
    if (user) {
      const jaTemFotoNaCategoria = fotos.some(
        (foto) => foto.usuarioId === user.id && foto.categoria === categoriaFoto
      );
      setVaiGanharRecompensa(!jaTemFotoNaCategoria);
    } else {
      setVaiGanharRecompensa(true);
    }
  }, [categoriaFoto, fotos, user, id]);

  // Verificar distância e se pode avaliar
  useEffect(() => {
    if (!evento || !id) return;

    // Verificar se já esteve no local (salvo no localStorage)
    const localStorageKey = `visitou-${id}`;
    const jaEsteveNoLocal = localStorage.getItem(localStorageKey) === 'true';

    // Calcular distância atual se tiver localização do usuário e do evento
    if (localizacaoUsuario && evento.localizacao) {
      const distancia = calcularDistancia(localizacaoUsuario, evento.localizacao);
      setDistanciaAtual(distancia);
      
      // Se estiver a menos de 1km (1000m), salvar que esteve no local
      if (distancia < 1000) {
        localStorage.setItem(localStorageKey, 'true');
        setPodeAvaliar(true);
      } else {
        // Se não estiver perto, só pode avaliar se já esteve no local antes
        setPodeAvaliar(jaEsteveNoLocal);
      }
    } else {
      // Se não tiver localização, verificar se já esteve no local
      setPodeAvaliar(jaEsteveNoLocal);
    }
  }, [evento, localizacaoUsuario, id]);

  const handleVotar = async (nota: number) => {
    if (!id) return;
    
    if (!user) {
      message.warning('Você precisa estar logado para votar');
      navigate('/login');
      return;
    }
    
    try {
      await votarEvento(id, nota);
      setMinhaNota(nota);
      message.success(`Você avaliou este evento com ${nota.toFixed(1)} estrelas!`);
    } catch (error: any) {
      message.error(error.message || 'Erro ao votar no evento');
    }
  };

  if (isLoading) {
    return (
      <div className="detalhes-evento">
        <Header />
        <div className="detalhes-evento-container">
          <Empty 
            description="Carregando evento..."
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          />
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="detalhes-evento">
        <Header />
        <div className="detalhes-evento-container">
          <Empty 
            description="Evento não encontrado"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <Button 
              type="primary" 
              onClick={() => navigate('/')}
              shape="round"
              className="btn-primary-gradient"
            >
              Voltar
            </Button>
          </Empty>
        </div>
      </div>
    );
  }



  const formatarTipo = () => {
    const tipos: Record<string, { label: string; color: string; gradient: string }> = {
      restaurante: { label: 'Restaurante', color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' },
      balada: { label: 'Balada', color: '#9B59B6', gradient: 'linear-gradient(135deg, #9B59B6, #BB86FC)' },
      show: { label: 'Show', color: '#3498DB', gradient: 'linear-gradient(135deg, #3498DB, #00B7FF)' },
      festival: { label: 'Festival', color: '#2ECC71', gradient: 'linear-gradient(135deg, #2ECC71, #01D9FF)' },
      bar: { label: 'Bar', color: '#F39C12', gradient: 'linear-gradient(135deg, #F39C12, #FFB84D)' },
    };
    return tipos[evento.tipo] || { label: evento.tipo, color: '#95A5A6', gradient: 'linear-gradient(135deg, #95A5A6, #BDC3C7)' };
  };

  const formatarPreco = (preco: string, valorEntrada?: number) => {
    if (preco === 'gratuito') {
      return 'Entrada grátis';
    }
    if (preco === 'pago' && valorEntrada !== undefined && valorEntrada !== null) {
      const valorFormatado = valorEntrada.toFixed(2).replace('.', ',');
      return `R$ ${valorFormatado}`;
    }
    return 'Entrada grátis'; // Default para gratuito
  };

  const formatarGeneroMusical = (genero: string) => {
    const generos: Record<string, string> = {
      rock: '🎸 Rock',
      pop: '🎵 Pop',
      sertanejo: '🎤 Sertanejo',
      funk: '🎧 Funk',
      eletronica: '🎹 Eletrônica',
      indie: '🎪 Indie',
      'hip-hop': '🎤 Hip-Hop',
      reggae: '🎵 Reggae',
      samba: '🥁 Samba',
      pagode: '🎺 Pagode',
      forro: '🪕 Forró',
    };
    return generos[genero] || genero.charAt(0).toUpperCase() + genero.slice(1);
  };

  const formatarTipoComida = (tipo: string) => {
    const tipos: Record<string, string> = {
      brasileira: '🇧🇷 Brasileira',
      italiana: '🇮🇹 Italiana',
      japonesa: '🇯🇵 Japonesa',
      mexicana: '🇲🇽 Mexicana',
      francesa: '🇫🇷 Francesa',
      chinesa: '🇨🇳 Chinesa',
      indiana: '🇮🇳 Indiana',
      vegana: '🌱 Vegana',
      vegetariana: '🥗 Vegetariana',
      'fast-food': '🍔 Fast Food',
      churrasco: '🥩 Churrasco',
      pizzaria: '🍕 Pizzaria',
    };
    return tipos[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  const tipoInfo = formatarTipo();

  return (
    <div className="detalhes-evento">
      <Header />
      <div className="detalhes-evento-container">
        <Space 
          direction="horizontal" 
          size="small" 
          align="center"
          style={{ width: '100%', marginBottom: '1rem', justifyContent: 'space-between' }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="btn-voltar"
            shape="round"
            size="small"
          >
            Voltar
          </Button>
          {user && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'sugerir-alteracoes',
                    label: 'Sugerir Alterações',
                    icon: <EditOutlined />,
                    onClick: () => {
                      // Salvar dados do evento no localStorage para pré-preenchimento
                      localStorage.setItem('sugestaoEvento', JSON.stringify(evento));
                      navigate('/adicionar?sugestao=true');
                    }
                  },
                  {
                    key: 'adicionar-fotos',
                    label: 'Adicionar Fotos',
                    icon: <PictureOutlined />,
                    onClick: () => {
                      setModalFotos(true);
                    }
                  },
                  ...(user?.nivelAcesso === 'admin' ? [
                    {
                      type: 'divider' as const,
                    },
                    {
                      key: 'deletar-evento',
                      label: 'Deletar Evento',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => {
                        Modal.confirm({
                          title: 'Deletar Evento',
                          content: 'Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.',
                          okText: 'Deletar',
                          okType: 'danger',
                          cancelText: 'Cancelar',
                          onOk: async () => {
                            try {
                              await apiDelete(`/api/eventos/${id}`, { requireAuth: true });
                              message.success('Evento deletado com sucesso!');
                              navigate('/');
                            } catch (error: any) {
                              message.error(error.message || 'Erro ao deletar evento');
                            }
                          }
                        });
                      }
                    }
                  ] : [])
                ] as MenuProps['items']
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                icon={<MoreOutlined />}
                shape="circle"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Dropdown>
          )}
        </Space>

        {evento.imagem && (
          <div className="evento-imagem-capa">
            <img
              src={evento.imagem}
              alt={evento.nome}
              className="evento-imagem"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="evento-imagem-overlay"></div>
          </div>
        )}

        <Card className="evento-card-detalhes">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={1} className="evento-nome-detalhes">
                {evento.nome}
              </Title>
              <div className="evento-info-linha">
                {evento.distancia !== undefined && (
                  <Tag 
                    icon={<EnvironmentOutlined />} 
                    className="evento-distancia-tag-detalhes"
                    style={{ 
                      background: 'rgba(0, 183, 255, 0.2)',
                      borderColor: 'rgba(0, 183, 255, 0.4)',
                      color: '#00B7FF',
                      margin: 0,
                    }}
                  >
                    {formatarDistancia(evento.distancia)}
                  </Tag>
                )}
                {evento.avaliacao > 0 && (
                  <div className="evento-avaliacao-container">
                    <span style={{ color: '#FFD700', fontSize: '18px', lineHeight: 1 }}>⭐</span>
                    <Text className="evento-avaliacao-numero-detalhes">
                      {evento.avaliacao.toFixed(1)}
                    </Text>
                  </div>
                )}
              </div>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                
                {user && podeAvaliar && (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      {minhaNota !== null ? 'Sua avaliação:' : 'Avalie este evento:'}
                    </Text>
                    {distanciaAtual !== null && distanciaAtual >= 1000 && (
                      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontStyle: 'italic' }}>
                        Você já esteve neste local anteriormente
                      </Text>
                    )}
                    <Rate
                      value={minhaNota || 0}
                      onChange={handleVotar}
                      allowHalf
                      className="evento-rate-votar"
                    />
                  </Space>
                )}
                {user && !podeAvaliar && distanciaAtual !== null && (
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontStyle: 'italic' }}>
                    Você precisa estar a menos de 1km de distância para avaliar este evento
                  </Text>
                )}
                {user && !podeAvaliar && distanciaAtual === null && (
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontStyle: 'italic' }}>
                    Ative sua localização para avaliar este evento
                  </Text>
                )}
              </Space>
            </div>

            <Tag
              icon={<TagOutlined />}
              className="evento-tipo-tag-detalhes"
              style={{ 
                background: tipoInfo.gradient,
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 600,
                padding: '6px 16px',
                fontSize: 14,
              }}
            >
              {tipoInfo.label}
            </Tag>

            {evento.descricao && (
              <Card 
                size="small" 
                className="evento-descricao-card"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 16 }}>
                    <FileTextOutlined /> Descrição
                  </Text>
                  <Paragraph style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
                    {evento.descricao}
                  </Paragraph>
                </Space>
              </Card>
            )}

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Horários */}
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                    <ClockCircleOutlined /> Horários
                  </Text>
                  {evento.recorrente && evento.horariosPorDia && evento.horariosPorDia.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {evento.horariosPorDia
                        .sort((a: any, b: any) => a.dia - b.dia)
                        .map((horario: any) => {
                          const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                          return (
                            <div key={horario.dia} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
                              <strong>{diasNomes[horario.dia]}:</strong> {horario.horarioAbertura} - {horario.horarioFechamento}
                              <span style={{ marginLeft: '8px' }}>
                                {horario.preco === 'pago' && horario.valorEntrada && horario.valorEntrada > 0 ? (
                                  <span style={{ color: '#FFD700' }}>• R$ {horario.valorEntrada.toFixed(2)}</span>
                                ) : (
                                  <span style={{ color: '#2ECC71' }}>• Gratuito</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                    </Space>
                  ) : (
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
                      {evento.horarioAbertura} - {evento.horarioFechamento}
                    </Text>
                  )}
                </Space>
              </Card>

              {/* Valor de Entrada (apenas para eventos não recorrentes) */}
              {!(evento.recorrente && evento.horariosPorDia && evento.horariosPorDia.length > 0) && (
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      <DollarOutlined /> Valor de Entrada
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
                      {formatarPreco(evento.preco, evento.valorEntrada)}
                    </Text>
                  </Space>
                </Card>
              )}

              {/* Gêneros Musicais */}
              {evento.generoMusical && evento.generoMusical.length > 0 && (
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      🎵 Gêneros Musicais
                    </Text>
                    <Space wrap>
                      {evento.generoMusical.map((genero: string) => (
                        <Tag 
                          key={genero}
                          style={{ 
                            background: 'rgba(91, 46, 255, 0.2)',
                            borderColor: 'rgba(91, 46, 255, 0.4)',
                            color: '#5B2EFF',
                          }}
                        >
                          {formatarGeneroMusical(genero)}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Card>
              )}

              {/* Tipo de Comida */}
              {evento.tipoComida && (
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      🍽️ Tipo de Comida
                    </Text>
                    <Tag 
                      style={{ 
                        background: 'rgba(255, 107, 107, 0.2)',
                        borderColor: 'rgba(255, 107, 107, 0.4)',
                        color: '#FF6B6B',
                      }}
                    >
                      {formatarTipoComida(evento.tipoComida)}
                    </Tag>
                  </Space>
                </Card>
              )}

              {/* Público */}
              {evento.publico && (
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      👥 Público
                    </Text>
                    <Tag 
                      style={{ 
                        background: evento.publico === 'LGBT' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(155, 89, 182, 0.2)',
                        borderColor: evento.publico === 'LGBT' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(155, 89, 182, 0.4)',
                        color: evento.publico === 'LGBT' ? '#FF6B6B' : '#9B59B6',
                      }}
                    >
                      {evento.publico === 'LGBT' ? '🏳️‍🌈 LGBT' : '👥 Hetero'}
                    </Tag>
                  </Space>
                </Card>
              )}

              {/* Brinquedoteca */}
              {evento.tipo === 'bar' && evento.temBrinquedoteca !== undefined && (
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                      🧒 Brinquedoteca
                    </Text>
                    <Tag 
                      style={{ 
                        background: evento.temBrinquedoteca ? 'rgba(46, 204, 113, 0.2)' : 'rgba(149, 165, 166, 0.2)',
                        borderColor: evento.temBrinquedoteca ? 'rgba(46, 204, 113, 0.4)' : 'rgba(149, 165, 166, 0.4)',
                        color: evento.temBrinquedoteca ? '#2ECC71' : '#95A5A6',
                      }}
                    >
                      {evento.temBrinquedoteca ? '✅ Sim' : '❌ Não'}
                    </Tag>
                  </Space>
                </Card>
              )}

              {/* Endereço */}
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                    <EnvironmentOutlined /> Endereço
                  </Text>
                  <Button
                    type="link"
                    onClick={() => {
                      // Abrir Google Maps com o endereço ou coordenadas
                      let url: string;
                      
                      if (evento.localizacao && evento.localizacao.latitude && evento.localizacao.longitude) {
                        // Se tiver coordenadas, usar coordenadas (abre direto no app do Maps no mobile)
                        url = `https://www.google.com/maps?q=${evento.localizacao.latitude},${evento.localizacao.longitude}`;
                      } else {
                        // Se não tiver coordenadas, usar o endereço
                        const enderecoCodificado = encodeURIComponent(evento.endereco);
                        url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;
                      }
                      
                      window.open(url, '_blank');
                    }}
                    style={{ 
                      padding: 0,
                      height: 'auto',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: 16,
                      textAlign: 'left',
                      textDecoration: 'underline',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      display: 'block',
                    }}
                  >
                    {evento.endereco}
                  </Button>
                </Space>
              </Card>
            </Space>
          </Space>
        </Card>

        {/* Álbum de Fotos */}
        <Card 
          className="evento-card-detalhes"
          style={{ marginTop: '24px' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ color: '#FFFFFF', margin: 0 }}>
                <PictureOutlined /> Álbum de Fotos
              </Title>
              {user && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalFotos(true)}
                  shape="round"
                  size="small"
                >
                  Adicionar Fotos
                </Button>
              )}
            </div>
            
            {isLoadingFotos ? (
              <Empty description="Carregando fotos..." />
            ) : fotos.length === 0 ? (
              <Empty 
                description="Nenhuma foto adicionada ainda"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              />
            ) : (
              <Image.PreviewGroup>
                <div className="album-fotos" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  {fotos.map((foto) => (
                    <div key={foto.id} style={{ position: 'relative' }}>
                      <Image
                        src={foto.imagem}
                        alt={`Foto do evento ${evento.nome}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        preview={{
                          mask: <div style={{ color: '#FFFFFF' }}>Ver</div>
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            )}
          </Space>
        </Card>
      </div>

      {/* Modal para adicionar fotos */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PictureOutlined style={{ fontSize: 20, color: '#5B2EFF' }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>Adicionar Fotos</span>
          </div>
        }
        open={modalFotos}
        onCancel={() => {
          setModalFotos(false);
          setFileList([]);
          setCategoriaFoto('interior');
          setVaiGanharRecompensa(true);
          setFotosNaCategoria(0);
          setLimiteCategoria(3);
        }}
        onOk={async () => {
          if (fileList.length === 0) {
            message.warning('Selecione pelo menos uma foto');
            return;
          }

          if (!categoriaFoto) {
            message.warning('Selecione uma categoria para a foto');
            return;
          }

          // Verificar limite de fotos por categoria
          const fotosRestantes = limiteCategoria - fotosNaCategoria;
          if (fotosRestantes <= 0) {
            message.error(`Limite de ${limiteCategoria} foto(s) atingido para a categoria selecionada!`);
            return;
          }

          if (fileList.length > fotosRestantes) {
            message.warning(`Você pode adicionar apenas ${fotosRestantes} foto(s) nesta categoria. Remova ${fileList.length - fotosRestantes} foto(s) da lista.`);
            return;
          }

          try {
            for (const file of fileList) {
              // Criar FormData para enviar arquivo
              const formData = new FormData();
              if (file.originFileObj) {
                formData.append('imagem', file.originFileObj);
              } else {
                // Se não tiver originFileObj, tentar converter base64 para blob
                const response = await fetch(file.thumbUrl || file.url || '');
                const blob = await response.blob();
                formData.append('imagem', blob, file.name || 'foto.jpg');
              }
              formData.append('categoria', categoriaFoto);
              
              // Fazer upload usando FormData
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/eventos/${id}/fotos`, {
                method: 'POST',
                headers: {
                  'x-user-id': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).id : '',
                },
                body: formData
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro ao fazer upload da foto' }));
                throw new Error(errorData.error || 'Erro ao fazer upload da foto');
              }
            }
            
            message.success('Fotos enviadas com sucesso! Aguarde aprovação de um administrador.');
            setModalFotos(false);
            setFileList([]);
            setCategoriaFoto('interior');
            
            // Recarregar fotos aprovadas (não inclui fotos pendentes)
            const fotosData = await apiGet(`/api/eventos/${id}/fotos`, { requireAuth: false });
            const { formatarUrlImagem } = await import('../utils/api');
            const fotosFormatadas = Array.isArray(fotosData)
              ? fotosData.map((foto: any) => ({
                  ...foto,
                  imagem: formatarUrlImagem(foto.imagem),
                }))
              : [];
            setFotos(fotosFormatadas);
          } catch (error: any) {
            message.error(error.message || 'Erro ao adicionar fotos');
          }
        }}
        okText="Enviar Fotos"
        cancelText="Cancelar"
        width={600}
        className="modal-adicionar-fotos"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Seção de Categoria */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TagOutlined style={{ color: '#5B2EFF', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>Categoria da foto</Text>
            </div>
            <Select
              value={categoriaFoto}
              onChange={setCategoriaFoto}
              style={{ width: '100%' }}
              size="large"
              options={[
                { label: '📋 Cardápio', value: 'cardapio' },
                { label: '🏢 Fachada', value: 'fachada' },
                { label: '🏠 Interior', value: 'interior' },
              ]}
            />
          </div>

          {/* Divisor */}
          <div style={{ 
            height: 1, 
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            margin: '8px 0'
          }} />

          {/* Informações da Categoria */}
          <div style={{
            background: 'rgba(91, 46, 255, 0.1)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(91, 46, 255, 0.2)'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PictureOutlined style={{ color: fotosNaCategoria >= limiteCategoria ? '#ff4d4f' : '#1890ff', fontSize: 16 }} />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
                    Fotos nesta categoria
                  </Text>
                </div>
                <Tag 
                  color={fotosNaCategoria >= limiteCategoria ? 'red' : 'blue'}
                  style={{ 
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 12
                  }}
                >
                  {fotosNaCategoria} / {limiteCategoria}
                </Tag>
              </div>
              
              {fotosNaCategoria >= limiteCategoria && (
                <div style={{ 
                  marginTop: 8,
                  padding: 8,
                  background: 'rgba(255, 77, 79, 0.15)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 77, 79, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <WarningOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />
                  <Text type="danger" style={{ fontSize: 12, margin: 0 }}>
                    Limite de fotos atingido para esta categoria!
                  </Text>
                </div>
              )}
            </Space>
          </div>

          {/* Informações de Recompensa */}
          {user && (
            <div style={{
              background: vaiGanharRecompensa 
                ? 'rgba(82, 196, 26, 0.1)' 
                : 'rgba(255, 141, 0, 0.1)',
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${vaiGanharRecompensa ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 141, 0, 0.2)'}`
            }}>
              {vaiGanharRecompensa ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <TrophyOutlined style={{ color: '#52c41a', fontSize: 20, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: '#52c41a', fontSize: 14, display: 'block', marginBottom: 4 }}>
                      Recompensa Disponível
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block' }}>
                      Você ganhará <strong style={{ color: '#52c41a' }}>+10 pontos</strong> se esta foto for aprovada!
                    </Text>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <InfoCircleOutlined style={{ color: '#fa8c16', fontSize: 20, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ color: '#fa8c16', fontSize: 14, display: 'block', marginBottom: 4 }}>
                      Sem Recompensa Adicional
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block' }}>
                      Você já tem uma foto aprovada nesta categoria. Não ganhará pontos adicionais.
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divisor */}
          <div style={{ 
            height: 1, 
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            margin: '8px 0'
          }} />

          {/* Área de Upload */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusOutlined style={{ color: '#5B2EFF', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>Selecionar Fotos</Text>
            </div>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => {
                setFileList(newFileList);
              }}
              onRemove={(file) => {
                setFileList(prev => prev.filter(f => f.uid !== file.uid));
              }}
              beforeUpload={(file) => {
                // Criar preview local
                const reader = new FileReader();
                reader.onload = (e) => {
                  const result = e.target?.result as string;
                  const newFile = {
                    uid: file.uid,
                    name: file.name,
                    status: 'done' as const,
                    url: result,
                    thumbUrl: result,
                    originFileObj: file // Manter o arquivo original para upload
                  };
                  setFileList(prev => [...prev, newFile]);
                };
                reader.readAsDataURL(file);
                return false; // Prevent auto upload
              }}
              multiple
              accept="image/*"
              maxCount={limiteCategoria - fotosNaCategoria}
              className="upload-fotos-custom"
            >
              {fileList.length >= (limiteCategoria - fotosNaCategoria) ? null : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <PlusOutlined style={{ fontSize: 24, color: '#5B2EFF', marginBottom: 8 }} />
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Adicionar</div>
                </div>
              )}
            </Upload>
            {limiteCategoria - fotosNaCategoria > 0 && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8, textAlign: 'center' }}>
                Você pode adicionar até {limiteCategoria - fotosNaCategoria} foto(s) restante(s)
              </Text>
            )}
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default DetalhesEvento;
    