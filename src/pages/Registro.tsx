import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Space, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './Registro.css';

const { Title, Text } = Typography;

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const { register, user, isLoading } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const onFinish = async (values: { nome: string; email: string; senha: string; confirmarSenha: string }) => {
    if (values.senha !== values.confirmarSenha) {
      message.error('As senhas não coincidem!');
      return;
    }

    setLoading(true);
    try {
      await register(values.nome, values.email, values.senha);
      message.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || 'Erro ao criar conta');
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
    <div className="registro-page">
      <Header />
      <div className="registro-container">
        <Card className="registro-card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="registro-header">
              <Title level={2} style={{ color: '#FFFFFF', margin: 0 }}>
                Criar conta
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Junte-se à comunidade e descubra eventos incríveis
              </Text>
            </div>

            <Form
              form={form}
              name="registro"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="nome"
                rules={[
                  { required: true, message: 'Por favor, insira seu nome!' },
                  { min: 2, message: 'Nome deve ter pelo menos 2 caracteres!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nome completo"
                  className="auth-input"
                />
              </Form.Item>

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

              <Form.Item
                name="confirmarSenha"
                dependencies={['senha']}
                rules={[
                  { required: true, message: 'Por favor, confirme sua senha!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('senha') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('As senhas não coincidem!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirmar senha"
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
                  Criar conta
                </Button>
              </Form.Item>
            </Form>

            <div className="registro-footer">
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Já tem uma conta?{' '}
              </Text>
              <Button
                type="link"
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Fazer login
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Registro;

