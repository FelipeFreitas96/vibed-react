import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Space, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './Login.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const onFinish = async (values: { email: string; senha: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.senha);
      message.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0E0E10',
        color: '#FFFFFF'
      }}>
        Carregando...
      </div>
    );
  }

  if (user) {
    return null; // Redirecionamento será feito pelo useEffect
  }

  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <Card className="login-card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="login-header">
              <Title level={2} style={{ color: '#FFFFFF', margin: 0 }}>
                Bem-vindo de volta!
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Entre para descobrir eventos incríveis
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Por favor, insira seu email!' },
                  { type: 'email', message: 'Email inválido!' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  className="auth-input"
                />
              </Form.Item>

              <Form.Item
                name="senha"
                rules={[
                  { required: true, message: 'Por favor, insira sua senha!' },
                  { min: 6, message: 'Senha deve ter pelo menos 6 caracteres!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Senha"
                  className="auth-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="auth-button"
                  block
                >
                  Entrar
                </Button>
              </Form.Item>
            </Form>

            <div className="login-footer">
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Não tem uma conta?{' '}
              </Text>
              <Button
                type="link"
                onClick={() => navigate('/registro')}
                className="link-button"
              >
                Criar conta
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Login;

