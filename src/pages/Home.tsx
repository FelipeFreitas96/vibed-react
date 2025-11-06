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

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = container.scrollTop;
      if (scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;
      
      const scrollTop = container.scrollTop;
      if (scrollTop > 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }

      currentYRef.current = e.touches[0].clientY;
      const distance = currentYRef.current - startYRef.current;
      
      if (distance > 0) {
        e.preventDefault();
        const maxDistance = 120; // Aumentado de 80 para 120px
        const normalizedDistance = Math.min(distance, maxDistance);
        setPullDistance(normalizedDistance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      
      const threshold = 100; // Aumentado de 50 para 100px para ser menos sensível
      if (pullDistance >= threshold && !isRefreshingState) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
      
      isPullingRef.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

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
