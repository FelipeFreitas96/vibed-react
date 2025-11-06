import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Space, Dropdown, MenuProps, Badge } from 'antd';
import { ThunderboltFilled, UserOutlined, PlusOutlined, LogoutOutlined, CheckCircleOutlined, BellOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { apiGet } from '../utils/api';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pendentesCount, setPendentesCount] = useState(0);

  // Carregar quantidade de eventos pendentes se for admin
  useEffect(() => {
    if (user?.nivelAcesso === 'admin') {
      carregarEventosPendentes();
      // Atualizar a cada 30 segundos
      const interval = setInterval(carregarEventosPendentes, 30000);
      
      // Ouvir eventos de atualização de notificações
      const handleNotificationUpdate = () => {
        carregarEventosPendentes();
      };
      window.addEventListener('vibed-notifications-update', handleNotificationUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('vibed-notifications-update', handleNotificationUpdate);
      };
    }
  }, [user]);

  const carregarEventosPendentes = async () => {
    if (!user || user.nivelAcesso !== 'admin') return;
    
    try {
      const [eventos, sugestoes, fotos] = await Promise.all([
        apiGet('/api/eventos/pendentes', { requireAuth: true }).catch(() => []),
        apiGet('/api/sugestoes/pendentes', { requireAuth: true }).catch(() => []),
        apiGet('/api/fotos/pendentes', { requireAuth: true }).catch(() => [])
      ]);
      
      const eventosCount = Array.isArray(eventos) ? eventos.length : 0;
      const sugestoesCount = Array.isArray(sugestoes) ? sugestoes.length : 0;
      const fotosCount = Array.isArray(fotos) ? fotos.length : 0;
      setPendentesCount(eventosCount + sugestoesCount + fotosCount);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
      setPendentesCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'perfil',
      label: 'Meu Perfil',
      icon: <UserOutlined />,
      onClick: () => navigate('/perfil'),
    },
    ...(user?.nivelAcesso === 'admin' ? [
      {
        type: 'divider' as const,
      },
      {
        key: 'admin-pendentes',
        label: 'Eventos Pendentes',
        icon: <CheckCircleOutlined />,
        onClick: () => navigate('/admin/pendentes'),
      },
      {
        key: 'admin-sugestoes',
        label: 'Sugestões de Alterações',
        icon: <EditOutlined />,
        onClick: () => navigate('/admin/sugestoes'),
      },
    ] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sair',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const handleAvatarClick = () => {
    if (user) {
      // Se estiver logado, mostrar dropdown
      return;
    } else {
      // Se não estiver logado, ir para login
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-backdrop"></div>
      <div className="header-content">
        <div 
          className="header-logo-icon"
          onClick={() => navigate('/')}
        >
          <ThunderboltFilled className="header-logo-icon-svg" />
        </div>
        <Space align="center" size="small" className="header-actions">
          {user && (
            <Button
              onClick={() => navigate('/adicionar')}
              className="btn-novo-lugar"
              shape="round"
              size="small"
            >
              <PlusOutlined className="btn-novo-lugar-icon" />
              <span className="btn-novo-lugar-text">Novo Lugar</span>
            </Button>
          )}
          {user?.nivelAcesso === 'admin' && (
            <Badge 
              count={pendentesCount} 
              size="small" 
              offset={[-2, 2]}
              style={{
                cursor: 'pointer',
              }}
            >
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/admin/pendentes')}
                className="btn-notificacoes"
                style={{
                  color: '#FFFFFF',
                  fontSize: '18px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  height: '32px',
                }}
              />
            </Badge>
          )}
          {user ? (
            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
              <Avatar 
                icon={<UserOutlined />} 
                className="header-avatar"
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          ) : (
            <Avatar 
              icon={<UserOutlined />} 
              className="header-avatar"
              style={{ cursor: 'pointer' }}
              onClick={handleAvatarClick}
            />
          )}
        </Space>
      </div>
    </header>
  );
};

export default Header;
