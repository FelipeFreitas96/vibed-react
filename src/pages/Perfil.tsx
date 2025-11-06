import React, { useEffect, useState } from 'react';
import { Card, Typography, Statistic, Row, Col, Spin } from 'antd';
import { 
  UserOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TipoEvento } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/api';
import Header from '../components/Header';
import './Perfil.css';

const { Title, Text } = Typography;

interface EstatisticasPerfil {
  lugaresAdicionados: number;
  lugaresVisitados: number;
  preferenciasPorTipo: Record<TipoEvento, number>;
  preferenciasPorTurno: Record<string, number>;
  reputacao: number;
}

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [estatisticas, setEstatisticas] = useState<EstatisticasPerfil>({
    lugaresAdicionados: 0,
    lugaresVisitados: 0,
    preferenciasPorTipo: {
      restaurante: 0,
      balada: 0,
      show: 0,
      festival: 0,
      bar: 0,
    },
    preferenciasPorTurno: {
      manha: 0,
      tarde: 0,
      noite: 0,
      madrugada: 0,
    },
    reputacao: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Buscar estatísticas do backend
        // As visitas são baseadas nos votos dados pelos usuários
        const dados = await apiGet('/api/perfil', { requireAuth: true });
        console.log('📊 Estatísticas recebidas:', dados);
        setEstatisticas({
          lugaresAdicionados: dados.lugaresAdicionados || 0,
          lugaresVisitados: dados.lugaresVisitados || 0,
          preferenciasPorTipo: dados.preferenciasPorTipo || {
            restaurante: 0,
            balada: 0,
            show: 0,
            festival: 0,
            bar: 0,
          },
          preferenciasPorTurno: dados.preferenciasPorTurno || {
            manha: 0,
            tarde: 0,
            noite: 0,
            madrugada: 0,
          },
          reputacao: dados.reputacao !== undefined && dados.reputacao !== null ? dados.reputacao : 0,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarEstatisticas();
  }, [user]);

  const formatarTipo = (tipo: TipoEvento): string => {
    const tipos: Record<TipoEvento, string> = {
      restaurante: 'Restaurante',
      balada: 'Balada',
      show: 'Show',
      festival: 'Festival',
      bar: 'Bar',
    };
    return tipos[tipo] || tipo;
  };

  const formatarTurno = (turno: string): string => {
    const turnos: Record<string, string> = {
      manha: 'Manhã',
      tarde: 'Tarde',
      noite: 'Noite',
      madrugada: 'Madrugada',
    };
    return turnos[turno] || turno;
  };

  // Preparar dados para gráfico de pizza (tipos)
  const dadosGraficoTipos = Object.entries(estatisticas.preferenciasPorTipo)
    .filter(([_, valor]) => valor > 0)
    .map(([tipo, valor]) => ({
      name: formatarTipo(tipo as TipoEvento),
      value: valor,
    }));

  // Preparar dados para gráfico de barras (turnos)
  const dadosGraficoTurnos = Object.entries(estatisticas.preferenciasPorTurno)
    .filter(([_, valor]) => valor > 0)
    .map(([turno, valor]) => ({
      name: formatarTurno(turno),
      value: valor,
    }));

  const COLORS = ['#5B2EFF', '#01D9FF', '#FF006E', '#00B7FF', '#FFD700', '#FF6B6B'];

  if (!user) {
    return (
      <div className="perfil">
        <Header />
        <div className="perfil-container">
          <Title level={1} className="perfil-title">
            <UserOutlined /> Meu Perfil
          </Title>
          <Card className="stat-card">
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Faça login para ver suas estatísticas
            </Text>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil">
      <Header />
      <div className="perfil-container">
        <Title level={1} className="perfil-title">
          <UserOutlined /> Meu Perfil
        </Title>

        {isLoading ? (
          <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="Lugares Adicionados"
                    value={estatisticas.lugaresAdicionados}
                    prefix={<PlusCircleOutlined />}
                    valueStyle={{ color: '#5B2EFF' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="Lugares Visitados"
                    value={estatisticas.lugaresVisitados}
                    prefix={<EyeOutlined />}
                    valueStyle={{ color: '#01D9FF' }}
                  />
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    Baseado nas suas avaliações
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="stat-card">
                  <Statistic
                    title="Reputação"
                    value={estatisticas.reputacao !== undefined && estatisticas.reputacao !== null ? estatisticas.reputacao : 0}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ 
                      color: (estatisticas.reputacao || 0) >= 0 ? '#2ECC71' : '#FF6B6B' 
                    }}
                  />
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    Pontos de contribuição
                  </Text>
                </Card>
              </Col>
            </Row>

            {dadosGraficoTipos.length > 0 && (
              <Card className="chart-card" style={{ marginBottom: '2rem' }}>
                <Title level={3} style={{ color: '#FFFFFF', marginBottom: '1.5rem' }}>
                  <TrophyOutlined /> Preferências por Tipo de Rolê
                </Title>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosGraficoTipos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props;
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoTipos.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {dadosGraficoTurnos.length > 0 && (
              <Card className="chart-card">
                <Title level={3} style={{ color: '#FFFFFF', marginBottom: '1.5rem' }}>
                  Preferências por Turno
                </Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGraficoTurnos}>
                    <XAxis dataKey="name" stroke="#FFFFFF" />
                    <YAxis stroke="#FFFFFF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E1E20', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#FFFFFF'
                      }}
                    />
                    <Bar dataKey="value" fill="#5B2EFF" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {!isLoading && dadosGraficoTipos.length === 0 && dadosGraficoTurnos.length === 0 && (
              <Card className="empty-card">
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Avalie alguns lugares para ver suas estatísticas e preferências!
                </Text>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Perfil;
