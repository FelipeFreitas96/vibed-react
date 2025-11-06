import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, Tag, Empty, message, Spin, Tabs, Image } from 'antd';
import { 
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Evento, SugestaoAlteracao } from '../types';
import Header from '../components/Header';
import './AdminPendentes.css';

// Evento customizado para notificar o Header sobre mudanças
const NOTIFICATION_UPDATE_EVENT = 'vibed-notifications-update';

const { Title, Text } = Typography;

const AdminPendentes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoAlteracao[]>([]);
  const [fotos, setFotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('eventos');

  useEffect(() => {
    // Verificar se é admin
    if (!user || user.nivelAcesso !== 'admin') {
      message.error('Você não tem permissão para acessar esta página');
      navigate('/');
      return;
    }

    carregarTudo();
  }, [user, navigate]);

  const carregarEventosPendentes = async () => {
    try {
      const eventosPendentes = await apiGet('/api/eventos/pendentes', { requireAuth: true });
      const { formatarUrlImagem } = await import('../utils/api');
      const eventosFormatados = Array.isArray(eventosPendentes) 
        ? eventosPendentes.map((evento: any) => ({
            ...evento,
            imagem: formatarUrlImagem(evento.imagem),
          }))
        : [];
      setEventos(eventosFormatados);
    } catch (error: any) {
      console.error('Erro ao carregar eventos pendentes:', error);
      message.error('Erro ao carregar eventos pendentes');
      setEventos([]);
    }
  };

  const carregarSugestoesPendentes = async () => {
    try {
      const sugestoesPendentes = await apiGet('/api/sugestoes/pendentes', { requireAuth: true });
      const { formatarUrlImagem } = await import('../utils/api');
      const sugestoesFormatadas = Array.isArray(sugestoesPendentes)
        ? sugestoesPendentes.map((sugestao: any) => ({
            ...sugestao,
            imagem: formatarUrlImagem(sugestao.imagem),
          }))
        : [];
      setSugestoes(sugestoesFormatadas);
    } catch (error: any) {
      console.error('Erro ao carregar sugestões pendentes:', error);
      message.error('Erro ao carregar sugestões pendentes');
      setSugestoes([]);
    }
  };

  const carregarFotosPendentes = async () => {
    try {
      const fotosPendentes = await apiGet('/api/fotos/pendentes', { requireAuth: true });
      const { formatarUrlImagem } = await import('../utils/api');
      const fotosFormatadas = Array.isArray(fotosPendentes)
        ? fotosPendentes.map((foto: any) => ({
            ...foto,
            imagem: formatarUrlImagem(foto.imagem),
          }))
        : [];
      setFotos(fotosFormatadas);
    } catch (error: any) {
      console.error('Erro ao carregar fotos pendentes:', error);
      message.error('Erro ao carregar fotos pendentes');
      setFotos([]);
    }
  };

  const carregarTudo = async () => {
    setIsLoading(true);
    await Promise.all([
      carregarEventosPendentes(),
      carregarSugestoesPendentes(),
      carregarFotosPendentes()
    ]);
    setIsLoading(false);
  };

  const handleAprovarEvento = async (eventoId: string) => {
    try {
      await apiPost(`/api/eventos/${eventoId}/aprovar`, {}, { requireAuth: true });
      message.success('Evento aprovado com sucesso!');
      carregarEventosPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao aprovar evento:', error);
      message.error(error.message || 'Erro ao aprovar evento');
    }
  };

  const handleRejeitarEvento = async (eventoId: string) => {
    try {
      await apiPost(`/api/eventos/${eventoId}/rejeitar`, {}, { requireAuth: true });
      message.success('Evento rejeitado com sucesso!');
      carregarEventosPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao rejeitar evento:', error);
      message.error(error.message || 'Erro ao rejeitar evento');
    }
  };

  const handleAprovarSugestao = async (sugestaoId: string) => {
    try {
      await apiPost(`/api/sugestoes/${sugestaoId}/aprovar`, {}, { requireAuth: true });
      message.success('Sugestão aprovada e alterações aplicadas ao evento!');
      carregarSugestoesPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao aprovar sugestão:', error);
      message.error(error.message || 'Erro ao aprovar sugestão');
    }
  };

  const handleRejeitarSugestao = async (sugestaoId: string) => {
    try {
      await apiPost(`/api/sugestoes/${sugestaoId}/rejeitar`, {}, { requireAuth: true });
      message.success('Sugestão rejeitada');
      carregarSugestoesPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao rejeitar sugestão:', error);
      message.error(error.message || 'Erro ao rejeitar sugestão');
    }
  };

  const handleAprovarFoto = async (fotoId: string) => {
    try {
      await apiPost(`/api/fotos/${fotoId}/aprovar`, {}, { requireAuth: true });
      message.success('Foto aprovada e adicionada ao evento!');
      carregarFotosPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao aprovar foto:', error);
      message.error(error.message || 'Erro ao aprovar foto');
    }
  };

  const handleRejeitarFoto = async (fotoId: string) => {
    try {
      await apiPost(`/api/fotos/${fotoId}/rejeitar`, {}, { requireAuth: true });
      message.success('Foto rejeitada');
      carregarFotosPendentes(); // Recarregar lista
      // Notificar o Header para atualizar a contagem
      window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT));
    } catch (error: any) {
      console.error('Erro ao rejeitar foto:', error);
      message.error(error.message || 'Erro ao rejeitar foto');
    }
  };

  if (!user || user.nivelAcesso !== 'admin') {
    return null;
  }

  return (
    <div className="admin-pendentes">
      <Header />
      <div className="admin-pendentes-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          className="btn-voltar"
          shape="round"
        >
          Voltar
        </Button>

        <Title level={1} className="admin-pendentes-title">
          Pendentes de Aprovação
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'eventos',
              label: (
                <span>
                  <CheckCircleOutlined /> Eventos ({eventos.length})
                </span>
              ),
              children: (
                <>
                  {isLoading ? (
                    <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
                  ) : eventos.length === 0 ? (
                    <Empty 
                      description="Nenhum evento pendente de aprovação"
                      style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '2rem' }}
                    />
                  ) : (
                    <div className="eventos-pendentes-list">
                      {eventos.map((evento) => (
                        <Card
                          key={evento.id}
                          className="evento-pendente-card"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            marginBottom: '1rem',
                          }}
                        >
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div className="evento-pendente-header">
                              <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                                {evento.nome}
                              </Title>
                              <Tag 
                                color="orange"
                                style={{ 
                                  background: 'rgba(255, 165, 0, 0.2)',
                                  borderColor: 'rgba(255, 165, 0, 0.4)',
                                  color: '#FFA500',
                                }}
                              >
                                ⏳ Pendente
                              </Tag>
                            </div>

                            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Tipo:</strong> {evento.tipo} | <strong>Endereço:</strong> {evento.endereco}
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '8px' }}>
                              👤 Criado por: {evento.criadorNome || evento.criadorEmail || 'Usuário desconhecido'}
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                              📅 Data de criação: {evento.criadoEm ? new Date(evento.criadoEm).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </Text>

                            {evento.descricao && (
                              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {evento.descricao}
                              </Text>
                            )}

                            <Space wrap size="small" style={{ width: '100%' }}>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleAprovarEvento(evento.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #2ECC71, #01D9FF)',
                                  border: 'none',
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Aprovar
                              </Button>
                              <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => handleRejeitarEvento(evento.id)}
                                style={{
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Rejeitar
                              </Button>
                              <Button
                                onClick={() => navigate(`/evento/${evento.id}`)}
                                style={{
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Ver Detalhes
                              </Button>
                            </Space>
                          </Space>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ),
            },
            {
              key: 'sugestoes',
              label: (
                <span>
                  <EditOutlined /> Sugestões ({sugestoes.length})
                </span>
              ),
              children: (
                <>
                  {isLoading ? (
                    <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
                  ) : sugestoes.length === 0 ? (
                    <Empty 
                      description="Nenhuma sugestão pendente de aprovação"
                      style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '2rem' }}
                    />
                  ) : (
                    <div className="eventos-pendentes-list">
                      {sugestoes.map((sugestao) => (
                        <Card
                          key={sugestao.id}
                          className="evento-pendente-card"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            marginBottom: '1rem',
                          }}
                        >
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div className="evento-pendente-header">
                              <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                                <EditOutlined style={{ marginRight: 8 }} />
                                {sugestao.eventoNome || 'Evento'}
                              </Title>
                              <Tag 
                                color="purple"
                                style={{ 
                                  background: 'rgba(91, 46, 255, 0.2)',
                                  borderColor: 'rgba(91, 46, 255, 0.4)',
                                  color: '#5B2EFF',
                                }}
                              >
                                ✏️ Sugestão
                              </Tag>
                            </div>

                            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Evento:</strong> {sugestao.eventoNome} | <strong>Endereço:</strong> {sugestao.endereco || '-'}
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '8px' }}>
                              👤 Sugerido por: {sugestao.usuarioNome || sugestao.usuarioEmail || 'Usuário desconhecido'}
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                              📅 Data de criação: {sugestao.criadaEm ? new Date(sugestao.criadaEm).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </Text>

                            {sugestao.comentario && (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                <Text strong style={{ color: '#FFFFFF', fontSize: 12, display: 'block', marginBottom: '4px' }}>
                                  💬 Motivo da Alteração:
                                </Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                                  {sugestao.comentario}
                                </Text>
                              </div>
                            )}

                            <Space wrap size="small" style={{ width: '100%' }}>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleAprovarSugestao(sugestao.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #2ECC71, #01D9FF)',
                                  border: 'none',
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Aprovar
                              </Button>
                              <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => handleRejeitarSugestao(sugestao.id)}
                                style={{
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Rejeitar
                              </Button>
                              <Button
                                onClick={() => navigate(`/admin/sugestoes/${sugestao.id}`)}
                                style={{
                                  background: 'rgba(91, 46, 255, 0.2)',
                                  borderColor: 'rgba(91, 46, 255, 0.4)',
                                  color: '#5B2EFF',
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Ver Diferenças
                              </Button>
                            </Space>
                          </Space>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ),
            },
            {
              key: 'fotos',
              label: (
                <span>
                  <PictureOutlined /> Fotos ({fotos.length})
                </span>
              ),
              children: (
                <>
                  {isLoading ? (
                    <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
                  ) : fotos.length === 0 ? (
                    <Empty 
                      description="Nenhuma foto pendente de aprovação"
                      style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '2rem' }}
                    />
                  ) : (
                    <div className="eventos-pendentes-list">
                      {fotos.map((foto) => (
                        <Card
                          key={foto.id}
                          className="evento-pendente-card"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            marginBottom: '1rem',
                          }}
                        >
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div className="evento-pendente-header">
                              <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                                <PictureOutlined style={{ marginRight: 8 }} />
                                Foto para {foto.eventoNome || 'Evento'}
                              </Title>
                              <Tag 
                                color="blue"
                                style={{ 
                                  background: 'rgba(1, 217, 255, 0.2)',
                                  borderColor: 'rgba(1, 217, 255, 0.4)',
                                  color: '#01D9FF',
                                }}
                              >
                                📸 Foto
                              </Tag>
                            </div>

                            <Image
                              src={foto.imagem}
                              alt={`Foto sugerida para ${foto.eventoNome}`}
                              style={{
                                width: '100%',
                                maxHeight: '300px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                              preview={{
                                mask: <div style={{ color: '#FFFFFF' }}>Ver</div>
                              }}
                            />

                            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Evento:</strong> {foto.eventoNome || 'Evento'} | <strong>Endereço:</strong> -
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '8px' }}>
                              👤 Sugerido por: {foto.usuarioNome || foto.usuarioEmail || 'Usuário desconhecido'}
                            </Text>
                            
                            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                              📅 Data de criação: {foto.criadaEm ? new Date(foto.criadaEm).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </Text>

                            <Space wrap size="small" style={{ width: '100%' }}>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleAprovarFoto(foto.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #2ECC71, #01D9FF)',
                                  border: 'none',
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Aprovar
                              </Button>
                              <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => handleRejeitarFoto(foto.id)}
                                style={{
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Rejeitar
                              </Button>
                              <Button
                                onClick={() => navigate(`/evento/${foto.eventoId}`)}
                                style={{
                                  background: 'rgba(1, 217, 255, 0.2)',
                                  borderColor: 'rgba(1, 217, 255, 0.4)',
                                  color: '#01D9FF',
                                  flex: 1,
                                  minWidth: '100px',
                                }}
                              >
                                Ver Evento
                              </Button>
                            </Space>
                          </Space>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminPendentes;

