import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Space, Button, Typography, Tag, Descriptions, Empty, message, Popconfirm } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  TagOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { SugestaoAlteracao } from '../types';
import Header from '../components/Header';
import './AdminSugestoes.css';

const { Title, Text } = Typography;

const AdminSugestoes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sugestoes, setSugestoes] = useState<SugestaoAlteracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  // Verificar se é admin
  useEffect(() => {
    if (user && user.nivelAcesso !== 'admin') {
      message.warning('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/');
    }
  }, [user, navigate]);

  // Carregar sugestões pendentes
  useEffect(() => {
    const carregarSugestoes = async () => {
      if (!user || user.nivelAcesso !== 'admin') return;
      
      try {
        setLoading(true);
        const data = await apiGet('/api/sugestoes/pendentes', { requireAuth: true });
        setSugestoes(data);
      } catch (error: any) {
        console.error('Erro ao carregar sugestões:', error);
        message.error('Erro ao carregar sugestões pendentes');
      } finally {
        setLoading(false);
      }
    };

    carregarSugestoes();
  }, [user]);

  // Aprovar sugestão
  const handleAprovar = async (sugestaoId: string) => {
    try {
      setProcessando(sugestaoId);
      await apiPost(`/api/sugestoes/${sugestaoId}/aprovar`, {}, { requireAuth: true });
      message.success('Sugestão aprovada e alterações aplicadas ao evento!');
      
      // Atualizar lista
      const data = await apiGet('/api/sugestoes/pendentes', { requireAuth: true });
      setSugestoes(data);
      
      // Disparar evento para atualizar notificações
      window.dispatchEvent(new CustomEvent('vibed-notifications-update'));
    } catch (error: any) {
      console.error('Erro ao aprovar sugestão:', error);
      message.error(error.message || 'Erro ao aprovar sugestão');
    } finally {
      setProcessando(null);
    }
  };

  // Rejeitar sugestão
  const handleRejeitar = async (sugestaoId: string, motivoRejeicao?: string) => {
    try {
      setProcessando(sugestaoId);
      await apiPost(`/api/sugestoes/${sugestaoId}/rejeitar`, { motivoRejeicao }, { requireAuth: true });
      message.success('Sugestão rejeitada');
      
      // Atualizar lista
      const data = await apiGet('/api/sugestoes/pendentes', { requireAuth: true });
      setSugestoes(data);
      
      // Disparar evento para atualizar notificações
      window.dispatchEvent(new CustomEvent('vibed-notifications-update'));
    } catch (error: any) {
      console.error('Erro ao rejeitar sugestão:', error);
      message.error(error.message || 'Erro ao rejeitar sugestão');
    } finally {
      setProcessando(null);
    }
  };

  // Ver detalhes do evento
  const handleVerDetalhes = (eventoId: string) => {
    navigate(`/evento/${eventoId}`);
  };

  if (!user || user.nivelAcesso !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-sugestoes">
        <Header />
        <div className="admin-sugestoes-container">
          <Empty 
            description="Carregando sugestões..."
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-sugestoes">
      <Header />
      <div className="admin-sugestoes-container">
        <Title level={2} style={{ color: '#FFFFFF', marginBottom: '24px' }}>
          Sugestões de Alterações Pendentes
        </Title>

        {sugestoes.length === 0 ? (
          <Empty 
            description="Nenhuma sugestão pendente"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          />
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {sugestoes.map((sugestao) => (
              <Card
                key={sugestao.id}
                className="sugestao-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        {sugestao.eventoNome || 'Evento'}
                      </Title>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
                        Sugerido por: {sugestao.usuarioNome || sugestao.usuarioEmail || 'Usuário desconhecido'}
                      </Text>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
                        {new Date(sugestao.criadaEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Space>
                  </div>

                  <Descriptions 
                    column={1} 
                    bordered 
                    size="small"
                    className="sugestao-descriptions"
                    items={[
                      ...(sugestao.nome ? [{
                        key: 'nome',
                        label: 'Nome',
                        children: sugestao.nome,
                      }] : []),
                      ...(sugestao.descricao !== undefined ? [{
                        key: 'descricao',
                        label: 'Descrição',
                        children: sugestao.descricao || '(vazio)',
                      }] : []),
                      ...(sugestao.tipo ? [{
                        key: 'tipo',
                        label: <><TagOutlined /> Tipo</>,
                        children: sugestao.tipo,
                      }] : []),
                      ...(sugestao.data ? [{
                        key: 'data',
                        label: <><CalendarOutlined /> Data</>,
                        children: new Date(sugestao.data).toLocaleDateString('pt-BR'),
                      }] : []),
                      ...(sugestao.horarioAbertura || sugestao.horarioFechamento ? [{
                        key: 'horarios',
                        label: <><ClockCircleOutlined /> Horários</>,
                        children: `${sugestao.horarioAbertura || 'N/A'} - ${sugestao.horarioFechamento || 'N/A'}`,
                      }] : []),
                      ...(sugestao.preco !== undefined ? [{
                        key: 'preco',
                        label: <><DollarOutlined /> Valor de Entrada</>,
                        children: sugestao.preco === 'pago' && sugestao.valorEntrada 
                          ? `R$ ${sugestao.valorEntrada.toFixed(2)}`
                          : sugestao.preco === 'gratuito' 
                            ? 'Entrada grátis'
                            : 'Sem entrada',
                      }] : []),
                      ...(sugestao.endereco ? [{
                        key: 'endereco',
                        label: <><EnvironmentOutlined /> Endereço</>,
                        children: sugestao.endereco,
                      }] : []),
                    ]}
                  />

                  <Space 
                    wrap 
                    size="small" 
                    style={{ width: '100%' }}
                    className="sugestao-actions"
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleAprovar(sugestao.id)}
                      loading={processando === sugestao.id}
                      style={{
                        background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
                        border: 'none',
                        flex: 1,
                        minWidth: '100px',
                      }}
                    >
                      Aprovar
                    </Button>
                    <Popconfirm
                      title="Rejeitar sugestão"
                      description="Tem certeza que deseja rejeitar esta sugestão?"
                      onConfirm={() => handleRejeitar(sugestao.id)}
                      okText="Sim"
                      cancelText="Não"
                    >
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        loading={processando === sugestao.id}
                        style={{
                          flex: 1,
                          minWidth: '100px',
                        }}
                      >
                        Rejeitar
                      </Button>
                    </Popconfirm>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => handleVerDetalhes(sugestao.eventoId)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#FFFFFF',
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
          </Space>
        )}
      </div>
    </div>
  );
};

export default AdminSugestoes;

