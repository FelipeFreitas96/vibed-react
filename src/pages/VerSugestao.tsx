import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Tag, Empty, message, Spin, Divider, Button, Image } from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { apiGet, apiPost, formatarUrlImagem } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './VerSugestao.css';

const { Title, Text } = Typography;

const VerSugestao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diferencas, setDiferencas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const carregarDiferencas = async () => {
      try {
        setIsLoading(true);
        const diferencasData = await apiGet(`/api/sugestoes/${id}/diferencas`, { requireAuth: true });
        setDiferencas(diferencasData);
      } catch (error: any) {
        console.error('Erro ao carregar diferenças:', error);
        message.error('Erro ao carregar diferenças');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDiferencas();
  }, [id]);

  const handleAprovar = async () => {
    if (!diferencas || !id) return;
    
    try {
      setProcessando(true);
      await apiPost(`/api/sugestoes/${id}/aprovar`, {}, { requireAuth: true });
      message.success('Sugestão aprovada e alterações aplicadas ao evento!');
      window.dispatchEvent(new CustomEvent('vibed-notifications-update'));
      navigate('/admin/pendentes');
    } catch (error: any) {
      console.error('Erro ao aprovar sugestão:', error);
      message.error(error.message || 'Erro ao aprovar sugestão');
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!diferencas || !id) return;
    
    try {
      setProcessando(true);
      await apiPost(`/api/sugestoes/${id}/rejeitar`, {}, { requireAuth: true });
      message.success('Sugestão rejeitada');
      window.dispatchEvent(new CustomEvent('vibed-notifications-update'));
      navigate('/admin/pendentes');
    } catch (error: any) {
      console.error('Erro ao rejeitar sugestão:', error);
      message.error(error.message || 'Erro ao rejeitar sugestão');
    } finally {
      setProcessando(false);
    }
  };

  const formatarCampo = (campo: string, valor: any): string => {
    if (valor === undefined || valor === null) return '-';
    
    switch (campo) {
      case 'tipo':
        const tipos: Record<string, string> = {
          restaurante: '🍽️ Restaurante',
          balada: '🎉 Balada',
          show: '🎤 Show',
          festival: '🎪 Festival',
          bar: '🍺 Bar',
        };
        return tipos[valor] || valor;
      case 'preco':
        if (valor === 'pago') return '💵 Entrada paga';
        if (valor === 'gratuito') return '🆓 Entrada grátis';
        if (valor === 'sem-entrada') return '🚫 Sem entrada';
        return valor;
      case 'publico':
        return valor === 'LGBT' ? '🏳️‍🌈 LGBT' : '👥 Hetero';
      case 'temBrinquedoteca':
        return valor ? '✅ Sim' : '❌ Não';
      case 'generoMusical':
        if (Array.isArray(valor)) {
          const generos: Record<string, string> = {
            rock: '🎸 Rock',
            pop: '🎵 Pop',
            sertanejo: '🎤 Sertanejo',
            funk: '🎧 Funk',
            eletronica: '🎹 Eletrônica',
            indie: '🎨 Indie',
            'hip-hop': '🎤 Hip-Hop',
            reggae: '🌴 Reggae',
            samba: '🎺 Samba',
            pagode: '🎸 Pagode',
            forro: '🎶 Forró',
          };
          return valor.map((g: string) => generos[g] || g).join(', ');
        }
        return '-';
      case 'data':
        if (!valor) return '-';
        return new Date(valor).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      case 'valorEntrada':
        return valor ? `R$ ${valor.toFixed(2)}` : '-';
      default:
        return String(valor);
    }
  };

  const formatarDiferencas = () => {
    if (!diferencas || !diferencas.diferencas) return [];
    
    const campos: Array<{ key: string; label: string; original: any; sugerido: any; isImage?: boolean }> = [];
    const difs = diferencas.diferencas;
    
    // Mapear as diferenças retornadas pelo backend
    if (difs.nome) {
      campos.push({
        key: 'nome',
        label: 'Nome',
        original: difs.nome.original,
        sugerido: difs.nome.sugerido,
      });
    }
    
    if (difs.descricao) {
      campos.push({
        key: 'descricao',
        label: 'Descrição',
        original: difs.descricao.original || '-',
        sugerido: difs.descricao.sugerido || '-',
      });
    }
    
    if (difs.tipo) {
      campos.push({
        key: 'tipo',
        label: 'Tipo',
        original: difs.tipo.original,
        sugerido: difs.tipo.sugerido,
      });
    }
    
    if (difs.data) {
      campos.push({
        key: 'data',
        label: 'Data',
        original: difs.data.original,
        sugerido: difs.data.sugerido,
      });
    }
    
    if (difs.horarioAbertura || difs.horarioFechamento) {
      const horarioAberturaOriginal = difs.horarioAbertura?.original || '-';
      const horarioFechamentoOriginal = difs.horarioFechamento?.original || '-';
      const horarioAberturaSugerido = difs.horarioAbertura?.sugerido || horarioAberturaOriginal;
      const horarioFechamentoSugerido = difs.horarioFechamento?.sugerido || horarioFechamentoOriginal;
      
      campos.push({
        key: 'horarios',
        label: 'Horários',
        original: `${horarioAberturaOriginal} - ${horarioFechamentoOriginal}`,
        sugerido: `${horarioAberturaSugerido} - ${horarioFechamentoSugerido}`,
      });
    }
    
    if (difs.preco) {
      const precoOriginal = formatarCampo('preco', difs.preco.original);
      const precoSugerido = formatarCampo('preco', difs.preco.sugerido);
      const valorOriginal = difs.preco.valorOriginal ? `R$ ${difs.preco.valorOriginal.toFixed(2)}` : '';
      const valorSugerido = difs.preco.valorSugerido ? `R$ ${difs.preco.valorSugerido.toFixed(2)}` : '';
      
      campos.push({
        key: 'preco',
        label: 'Valor de Entrada',
        original: `${precoOriginal}${valorOriginal ? ` (${valorOriginal})` : ''}`,
        sugerido: `${precoSugerido}${valorSugerido ? ` (${valorSugerido})` : ''}`,
      });
    }
    
    if (difs.endereco) {
      campos.push({
        key: 'endereco',
        label: 'Endereço',
        original: difs.endereco.original,
        sugerido: difs.endereco.sugerido,
      });
    }
    
    if (difs.localizacao) {
      const locOriginal = difs.localizacao.original 
        ? `${difs.localizacao.original.latitude}, ${difs.localizacao.original.longitude}`
        : '-';
      const locSugerido = difs.localizacao.sugerido
        ? `${difs.localizacao.sugerido.latitude}, ${difs.localizacao.sugerido.longitude}`
        : '-';
      
      campos.push({
        key: 'localizacao',
        label: 'Localização (Lat/Lng)',
        original: locOriginal,
        sugerido: locSugerido,
      });
    }
    
    if (difs.imagem) {
      campos.push({
        key: 'imagem',
        label: 'Imagem',
        original: difs.imagem.original || null, // ID da imagem original
        sugerido: difs.imagem.sugerido || null, // ID da imagem sugerida
        isImage: true, // Flag para identificar que é imagem
      });
    }
    
    if (difs.recorrente) {
      campos.push({
        key: 'recorrente',
        label: 'Recorrente',
        original: difs.recorrente.original ? 'Sim' : 'Não',
        sugerido: difs.recorrente.sugerido ? 'Sim' : 'Não',
      });
    }
    
    if (difs.diasSemana) {
      const diasSemanaNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const diasOriginal = difs.diasSemana.original.map((d: number) => diasSemanaNomes[d]).join(', ') || '-';
      const diasSugerido = difs.diasSemana.sugerido.map((d: number) => diasSemanaNomes[d]).join(', ') || '-';
      
      campos.push({
        key: 'diasSemana',
        label: 'Dias da Semana',
        original: diasOriginal,
        sugerido: diasSugerido,
      });
    }
    
    if (difs.generoMusical) {
      campos.push({
        key: 'generoMusical',
        label: 'Gêneros Musicais',
        original: Array.isArray(difs.generoMusical.original) ? difs.generoMusical.original : [],
        sugerido: Array.isArray(difs.generoMusical.sugerido) ? difs.generoMusical.sugerido : [],
      });
    }
    
    if (difs.tipoComida) {
      campos.push({
        key: 'tipoComida',
        label: 'Tipo de Comida',
        original: difs.tipoComida.original || '-',
        sugerido: difs.tipoComida.sugerido || '-',
      });
    }
    
    if (difs.publico) {
      campos.push({
        key: 'publico',
        label: 'Público',
        original: difs.publico.original ? formatarCampo('publico', difs.publico.original) : '-',
        sugerido: difs.publico.sugerido ? formatarCampo('publico', difs.publico.sugerido) : '-',
      });
    }
    
    if (difs.temBrinquedoteca) {
      campos.push({
        key: 'temBrinquedoteca',
        label: 'Tem Brinquedoteca',
        original: difs.temBrinquedoteca.original !== null ? formatarCampo('temBrinquedoteca', difs.temBrinquedoteca.original) : '-',
        sugerido: formatarCampo('temBrinquedoteca', difs.temBrinquedoteca.sugerido),
      });
    }
    
    return campos;
  };

  if (isLoading) {
    return (
      <div className="ver-sugestao">
        <Header />
        <div className="ver-sugestao-container">
          <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
        </div>
      </div>
    );
  }

  if (!diferencas) {
    return (
      <div className="ver-sugestao">
        <Header />
        <div className="ver-sugestao-container">
          <Empty 
            description="Sugestão não encontrada ou sem diferenças"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <Button onClick={() => navigate('/admin/pendentes')}>Voltar</Button>
          </Empty>
        </div>
      </div>
    );
  }

  const camposComparacao = formatarDiferencas();

  return (
    <div className="ver-sugestao">
      <Header />
      <div className="ver-sugestao-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/pendentes')}
          className="btn-voltar"
          shape="round"
        >
          Voltar
        </Button>

        <Title level={1} style={{ color: '#FFFFFF', marginBottom: '24px' }}>
          <EditOutlined style={{ marginRight: 8 }} />
          Comparar Sugestão de Alteração
        </Title>

        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            marginBottom: '24px',
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text strong style={{ color: '#FFFFFF', fontSize: 16 }}>
              Evento: {diferencas.eventoNome}
            </Text>
            {user?.nivelAcesso === 'admin' && diferencas.comentario && (
              <div style={{ marginTop: '16px' }}>
                <Text strong style={{ color: '#FFFFFF', fontSize: 14, display: 'block', marginBottom: '8px' }}>
                  💬 Motivo da Alteração:
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  {diferencas.comentario}
                </Text>
              </div>
            )}
          </Space>
        </Card>

        {/* Informações do Evento Original */}
        {diferencas.eventoTipo && (
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              marginBottom: '24px',
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text strong style={{ color: '#FFFFFF', fontSize: 14, display: 'block' }}>
                Tipo do Evento: {formatarCampo('tipo', diferencas.eventoTipo)}
              </Text>
              {diferencas.eventoCriadorNome && (
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block' }}>
                  👤 Criado por: {diferencas.eventoCriadorNome || diferencas.eventoCriadorEmail || 'Usuário desconhecido'}
                </Text>
              )}
              {diferencas.eventoCriadoEm && (
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'block' }}>
                  📅 Data de criação: {new Date(diferencas.eventoCriadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              )}
            </Space>
          </Card>
        )}

        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            marginBottom: '24px',
          }}
        >
          <Title level={3} style={{ color: '#FFFFFF', marginBottom: '16px' }}>
            Comparação de Alterações
          </Title>

          {camposComparacao.length === 0 ? (
            <Empty description="Nenhuma diferença encontrada entre a sugestão e o evento original" />
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {camposComparacao.map((campo) => {
                // Comparar arrays de forma adequada
                let mudou = false;
                if (Array.isArray(campo.original) && Array.isArray(campo.sugerido)) {
                  mudou = JSON.stringify([...campo.original].sort()) !== JSON.stringify([...campo.sugerido].sort());
                } else {
                  mudou = String(campo.original) !== String(campo.sugerido);
                }
                
                // Se for imagem, mostrar as imagens lado a lado
                if (campo.key === 'imagem' && (campo as any).isImage) {
                  const imagemOriginal = campo.original ? formatarUrlImagem(campo.original as string) : null;
                  const imagemSugerida = campo.sugerido ? formatarUrlImagem(campo.sugerido as string) : null;
                  
                  return (
                    <div key={campo.key} className="campo-comparacao">
                      <Text strong style={{ color: '#FFFFFF', fontSize: 14, display: 'block', marginBottom: '8px' }}>
                        {campo.label}
                      </Text>
                      <div className="comparacao-valores" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="valor-original" style={{ flex: 1, minWidth: '150px' }}>
                          <Tag color="red" style={{ marginBottom: '8px' }}>Original</Tag>
                          {imagemOriginal ? (
                            <Image
                              src={imagemOriginal}
                              alt="Imagem original"
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
                          ) : (
                            <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Sem imagem</Text>
                          )}
                        </div>
                        <div className="valor-sugerido" style={{ flex: 1, minWidth: '150px' }}>
                          <Tag color="green" style={{ marginBottom: '8px' }}>Sugerido</Tag>
                          {imagemSugerida ? (
                            <Image
                              src={imagemSugerida}
                              alt="Imagem sugerida"
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
                          ) : (
                            <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Sem imagem</Text>
                          )}
                        </div>
                      </div>
                      {mudou && (
                        <Tag color="purple" style={{ marginTop: '8px' }}>
                          ✏️ Alterado
                        </Tag>
                      )}
                      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '12px 0' }} />
                    </div>
                  );
                }
                
                // Para outros campos, renderizar normalmente
                return (
                  <div key={campo.key} className="campo-comparacao">
                    <Text strong style={{ color: '#FFFFFF', fontSize: 14, display: 'block', marginBottom: '8px' }}>
                      {campo.label}
                    </Text>
                    <div className="comparacao-valores">
                      <div className="valor-original">
                        <Tag color="red" style={{ marginBottom: '4px' }}>Original</Tag>
                        <Text style={{ color: mudou ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.7)' }}>
                          {campo.original === undefined || campo.original === null 
                            ? '-' 
                            : formatarCampo(campo.key, campo.original)}
                        </Text>
                        {/* Mostrar informações do criador do evento embaixo do tipo */}
                        {campo.key === 'tipo' && diferencas.eventoCriadorNome && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', display: 'block' }}>
                              👤 Criado por: {diferencas.eventoCriadorNome || diferencas.eventoCriadorEmail || 'Usuário desconhecido'}
                            </Text>
                            {diferencas.eventoCriadoEm && (
                              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                📅 Data de criação: {new Date(diferencas.eventoCriadoEm).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </Text>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="valor-sugerido">
                        <Tag color="green" style={{ marginBottom: '4px' }}>Sugerido</Tag>
                        <Text style={{ color: mudou ? 'rgba(46, 204, 113, 0.8)' : 'rgba(255, 255, 255, 0.7)' }}>
                          {campo.sugerido === undefined || campo.sugerido === null 
                            ? '-' 
                            : formatarCampo(campo.key, campo.sugerido)}
                        </Text>
                      </div>
                    </div>
                    {mudou && (
                      <Tag color="purple" style={{ marginTop: '8px' }}>
                        ✏️ Alterado
                      </Tag>
                    )}
                    <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '12px 0' }} />
                  </div>
                );
              })}
            </Space>
          )}
        </Card>

        <Space 
          size="middle" 
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '0 0.5rem',
            marginTop: '1rem'
          }}
        >
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleAprovar}
            loading={processando}
            size="large"
            shape="round"
            style={{
              background: 'linear-gradient(135deg, #2ECC71, #01D9FF)',
              border: 'none',
              flex: 1,
              minWidth: '150px',
              maxWidth: '300px',
            }}
          >
            Aprovar Sugestão
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleRejeitar}
            loading={processando}
            size="large"
            shape="round"
            style={{
              flex: 1,
              minWidth: '150px',
              maxWidth: '300px',
            }}
          >
            Rejeitar Sugestão
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default VerSugestao;

