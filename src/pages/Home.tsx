import { useState, useRef, useEffect } from 'react';
import { Space, Spin } from 'antd';
import { useEventos } from '../context/EventosContext';
import ListaEventos from '../components/ListaEventos';
import Filtros from '../components/Filtros';
import Ordenar from '../components/Ordenar';
import Header from '../components/Header';
import './Home.css';

const Home: React.FC = () => {
  const { eventosFiltrados, carregarEventos, isLoading } = useEventos();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await carregarEventos();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  const isRefreshingState = isRefreshing || isLoading;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = container.scrollTop;
      // Só ativar pull-to-refresh se estiver exatamente no topo
      if (scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        startYRef.current = touchStartY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // Margem de 5px
      
      // Se não estiver no topo, não interferir no scroll
      if (scrollTop > 0 || isAtBottom) {
        if (isPullingRef.current) {
          isPullingRef.current = false;
          setPullDistance(0);
        }
        // Não prevenir default - permite scroll normal
        return;
      }

      // Só processar pull-to-refresh se estiver no topo
      if (!isPullingRef.current) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;
      
      // Se estiver movendo para cima (scroll normal), cancelar pull-to-refresh
      if (distance < 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }
      
      // Só prevenir default se estiver puxando para baixo (pull-to-refresh) e no topo
      if (distance > 0 && scrollTop === 0) {
        e.preventDefault();
        const maxDistance = 120;
        const normalizedDistance = Math.min(distance, maxDistance);
        setPullDistance(normalizedDistance);
        currentYRef.current = currentY;
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) {
        setPullDistance(0);
        return;
      }
      
      const threshold = 100;
      if (pullDistance >= threshold && !isRefreshingState) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
      
      isPullingRef.current = false;
    };

    // Usar passive: true para melhor performance, exceto quando realmente precisar prevenir default
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshingState]);

  const pullProgress = Math.min(pullDistance / 100, 1); // Ajustado para o novo threshold
  const shouldShowRefresh = pullDistance > 0 || isRefreshingState;

  return (
    <div className="home">
      <Header />
      <div className="home-container">
        <div className="home-filtros">
          <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Filtros />
            <Ordenar />
          </Space>
        </div>
        <div 
          ref={containerRef}
          className="home-lista-container"
        >
          {shouldShowRefresh && (
            <div 
              className="pull-to-refresh-indicator"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${Math.max(pullDistance, 50)}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${-50 + pullDistance}px)`,
                transition: isRefreshingState ? 'none' : 'transform 0.2s ease-out',
                zIndex: 10,
              }}
            >
              {isRefreshingState ? (
                <Spin size="small" />
              ) : (
                <div
                  style={{
                    transform: `rotate(${pullProgress * 360}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  ↓
                </div>
              )}
            </div>
          )}
          <ListaEventos eventos={eventosFiltrados} />
        </div>
      </div>
    </div>
  );
};

export default Home;
