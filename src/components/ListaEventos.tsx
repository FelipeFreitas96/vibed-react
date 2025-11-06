import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Tag, Empty } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  DollarOutlined,
  EnvironmentOutlined,
  TagOutlined,
  HeartOutlined,
  HeartFilled,
  StarFilled
} from '@ant-design/icons';
import { Evento } from '../types';
import { formatarDistancia } from '../utils/geolocalizacao';
import './ListaEventos.css';

const { Title, Text } = Typography;

interface ListaEventosProps {
  eventos: Evento[];
}

const ListaEventos: React.FC<ListaEventosProps> = ({ eventos }) => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  const handleCardClick = (eventoId: string) => {
    navigate(`/evento/${eventoId}`);
  };

  const toggleFavorito = (e: React.MouseEvent, eventoId: string) => {
    e.stopPropagation();
    setFavoritos(prev => {
      const novo = new Set(prev);
      if (novo.has(eventoId)) {
        novo.delete(eventoId);
      } else {
        novo.add(eventoId);
      }
      return novo;
    });
  };

  if (eventos.length === 0) {
    return (
      <Empty
        description="Nenhum evento encontrado"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
      >
        <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Adicione um novo evento ou ajuste os filtros
        </Text>
      </Empty>
    );
  }

  const formatarData = (evento: any) => {
    if (evento.recorrente && evento.diasSemana) {
      const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const diasSelecionados = evento.diasSemana
        .sort((a: number, b: number) => a - b)
        .map((dia: number) => diasNomes[dia])
        .join(', ');
      return `Toda semana: ${diasSelecionados}`;
    }
    if (evento.data) {
      const data = new Date(evento.data);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return 'Data não definida';
  };

  const formatarDataCompacta = (evento: any) => {
    if (evento.recorrente && evento.diasSemana) {
      const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const diasSelecionados = evento.diasSemana
        .sort((a: number, b: number) => a - b)
        .map((dia: number) => diasNomes[dia])
        .join(', ');
      return diasSelecionados;
    }
    if (evento.data) {
      const data = new Date(evento.data);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
    }
    return 'Recorrente';
  };

  const formatarTurno = (turno: string) => {
    const turnos: Record<string, string> = {
      manha: 'Manhã',
      tarde: 'Tarde',
      noite: 'Noite',
      madrugada: 'Madrugada',
    };
    return turnos[turno] || turno;
  };

  const formatarTipo = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string; gradient: string }> = {
      restaurante: { label: 'Restaurante', color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' },
      balada: { label: 'Balada', color: '#9B59B6', gradient: 'linear-gradient(135deg, #9B59B6, #BB86FC)' },
      show: { label: 'Show', color: '#3498DB', gradient: 'linear-gradient(135deg, #3498DB, #00B7FF)' },
      festival: { label: 'Festival', color: '#2ECC71', gradient: 'linear-gradient(135deg, #2ECC71, #01D9FF)' },
      bar: { label: 'Bar', color: '#F39C12', gradient: 'linear-gradient(135deg, #F39C12, #FFB84D)' },
    };
    return tipos[tipo] || { label: tipo, color: '#95A5A6', gradient: 'linear-gradient(135deg, #95A5A6, #BDC3C7)' };
  };

  const formatarPreco = (preco: string, valorEntrada?: number) => {
    if (preco === 'sem-entrada') {
      return 'Sem entrada';
    }
    if (preco === 'gratuito') {
      return 'Entrada grátis';
    }
    if (preco === 'pago' && valorEntrada !== undefined && valorEntrada !== null) {
      const valorFormatado = valorEntrada.toFixed(2).replace('.', ',');
      return `Entrada R$ ${valorFormatado}`;
    }
    return 'Entrada';
  };

  return (
    <div className="lista-eventos">
      {eventos.map((evento, index) => {
        const tipoInfo = formatarTipo(evento.tipo);
        const isFavorito = favoritos.has(evento.id);
        
        return (
          <Card
            key={evento.id}
            className="evento-card"
            hoverable
            onClick={() => handleCardClick(evento.id)}
            cover={
              evento.imagem && (
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
                  <div className="evento-info-overlay">
                    <div className="evento-info-overlay-top">
                      {evento.distancia !== undefined && (
                        <div className="evento-info-overlay-item">
                          <EnvironmentOutlined />
                          <span>{formatarDistancia(evento.distancia)}</span>
                        </div>
                      )}
                      <div className="evento-info-overlay-item">
                        <CalendarOutlined />
                        <span>{formatarDataCompacta(evento)}</span>
                      </div>
                      {evento.avaliacao > 0 && (
                        <div className="evento-info-overlay-item">
                          <StarFilled style={{ color: '#FFD700' }} />
                          <span>{evento.avaliacao.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`evento-favorito ${isFavorito ? 'ativo' : ''}`}
                    onClick={(e) => toggleFavorito(e, evento.id)}
                    aria-label="Favoritar"
                  >
                    {isFavorito ? <HeartFilled /> : <HeartOutlined />}
                  </button>
                </div>
              )
            }
            style={{ 
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="evento-conteudo">
              <Space direction="vertical" size={3} style={{ width: '100%', margin: 0 }}>
                <div className="evento-header">
                  <Title level={5} className="evento-nome">
                    {evento.nome}
                  </Title>
                </div>

                <Space direction="vertical" size={3} style={{ width: '100%', margin: 0 }}>
                  <Tag
                    icon={<TagOutlined />}
                    className="evento-tipo-tag"
                    style={{ 
                      background: tipoInfo.gradient,
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      padding: '2px 8px',
                      margin: 0,
                      fontSize: '10px',
                      lineHeight: '1.2'
                    }}
                  >
                    {tipoInfo.label}
                  </Tag>

                  <Space size={3} wrap style={{ width: '100%', margin: 0 }}>
                    <Text className="evento-info-text" style={{ margin: 0 }}>
                      <CalendarOutlined /> {formatarData(evento)}
                    </Text>
                    <Text className="evento-info-text" style={{ margin: 0 }}>
                      <ClockCircleOutlined /> {formatarTurno(evento.turno)}
                    </Text>
                  </Space>

                  {evento.preco !== 'sem-entrada' && (
                    <Text className="evento-info-text" style={{ margin: 0 }}>
                      <DollarOutlined /> {formatarPreco(evento.preco, evento.valorEntrada)}
                    </Text>
                  )}
                </Space>
              </Space>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ListaEventos;
