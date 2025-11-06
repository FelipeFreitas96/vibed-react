import { useState } from 'react';
import { Button, Drawer, Space, Radio, Badge } from 'antd';
import { 
  SortAscendingOutlined, 
  ClearOutlined,
  EnvironmentOutlined,
  StarOutlined,
  DollarOutlined,
  CalendarOutlined,
  FontSizeOutlined
} from '@ant-design/icons';
import { useEventos } from '../context/EventosContext';
import { TipoOrdenacao } from '../types';
import './Ordenar.css';

const Ordenar: React.FC = () => {
  const { ordenacao, setOrdenacao } = useEventos();
  const [open, setOpen] = useState(false);

  const opcoesOrdenacao: Array<{ value: TipoOrdenacao; label: string; icon: React.ReactNode }> = [
    { value: 'distancia', label: 'Distância', icon: <EnvironmentOutlined /> },
    { value: 'nota', label: 'Nota/Avaliação', icon: <StarOutlined /> },
    { value: 'preco', label: 'Preço de Entrada', icon: <DollarOutlined /> },
    { value: 'data', label: 'Data', icon: <CalendarOutlined /> },
    { value: 'nome', label: 'Nome', icon: <FontSizeOutlined /> },
  ];

  const handleOrdenacaoChange = (value: TipoOrdenacao) => {
    setOrdenacao(value);
    setOpen(false);
  };

  const limparOrdenacao = () => {
    setOrdenacao('distancia'); // Voltar para padrão
    setOpen(false);
  };

  const ordenacaoAtual = opcoesOrdenacao.find(op => op.value === ordenacao);

  return (
    <>
      <Badge dot={ordenacao !== 'distancia'}>
        <Button
          icon={<SortAscendingOutlined />}
          onClick={() => setOpen(true)}
          className="toolbar-btn"
          shape="round"
          size="small"
        >
          {ordenacaoAtual?.label || 'Ordenar'}
        </Button>
      </Badge>

      <Drawer
        title={
          <Space>
            <SortAscendingOutlined />
            <span>Ordenar por</span>
            {ordenacao !== 'distancia' && (
              <Button
                type="link"
                icon={<ClearOutlined />}
                onClick={limparOrdenacao}
                danger
                size="small"
              >
                Limpar
              </Button>
            )}
          </Space>
        }
        placement="bottom"
        onClose={() => setOpen(false)}
        open={open}
        height="50vh"
        className="ordenar-drawer"
        styles={{
          body: {
            background: '#0E0E10',
            padding: '1.5rem',
          },
          header: {
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Radio.Group
          value={ordenacao}
          onChange={(e) => handleOrdenacaoChange(e.target.value)}
          className="ordenar-radio-group"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {opcoesOrdenacao.map((opcao) => (
              <Radio.Button
                key={opcao.value}
                value={opcao.value}
                className="ordenar-radio-button"
              >
                <Space>
                  {opcao.icon}
                  <span>{opcao.label}</span>
                </Space>
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
      </Drawer>
    </>
  );
};

export default Ordenar;

