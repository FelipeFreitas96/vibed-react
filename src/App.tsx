import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { EventosProvider } from './context/EventosContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AdicionarEvento from './pages/AdicionarEvento';
import DetalhesEvento from './pages/DetalhesEvento';
import Perfil from './pages/Perfil';
import Login from './pages/Login';
import Registro from './pages/Registro';
import AdminPendentes from './pages/AdminPendentes';
import AdminSugestoes from './pages/AdminSugestoes';
import VerSugestao from './pages/VerSugestao';
import './App.css';
import './styles/animations.css';

const { darkAlgorithm } = theme;

const customTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#00B7FF',
    colorSuccess: '#01D9FF',
    colorWarning: '#5B2EFF',
    colorError: '#FF006E',
    colorInfo: '#00B7FF',
    colorBgBase: '#0E0E10',
    colorBgContainer: 'rgba(255, 255, 255, 0.05)',
    colorText: '#FFFFFF',
    colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    fontFamily: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
  },
  components: {
    Card: {
      borderRadius: 16,
      paddingLG: 20,
      colorBgContainer: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    Button: {
      borderRadius: 24,
      fontWeight: 600,
      paddingContentHorizontal: 24,
      paddingContentVertical: 12,
      boxShadow: '0 4px 16px rgba(91, 46, 255, 0.3)',
    },
    Input: {
      borderRadius: 12,
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorText: '#FFFFFF',
    },
    Select: {
      borderRadius: 12,
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
    },
    DatePicker: {
      borderRadius: 12,
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={ptBR}>
      <AuthProvider>
        <EventosProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/" element={<Home />} />
                <Route path="/evento/:id" element={<DetalhesEvento />} />
                <Route
                  path="/adicionar"
                  element={
                    <ProtectedRoute>
                      <AdicionarEvento />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Perfil />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pendentes"
                  element={
                    <ProtectedRoute>
                      <AdminPendentes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sugestoes"
                  element={
                    <ProtectedRoute>
                      <AdminSugestoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sugestoes/:id"
                  element={
                    <ProtectedRoute>
                      <VerSugestao />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </EventosProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;

