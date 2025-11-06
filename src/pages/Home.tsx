import { Space } from 'antd';
import { useEventos } from '../context/EventosContext';
import ListaEventos from '../components/ListaEventos';
import Filtros from '../components/Filtros';
import Ordenar from '../components/Ordenar';
import Header from '../components/Header';
import './Home.css';

const Home: React.FC = () => {
  const { eventosFiltrados } = useEventos();

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
        <ListaEventos eventos={eventosFiltrados} />
      </div>
    </div>
  );
};

export default Home;
