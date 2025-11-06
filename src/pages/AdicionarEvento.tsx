import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Card, Space, Typography, message, Upload, Checkbox, TimePicker } from 'antd';
import { 
  SaveOutlined, 
  CloseOutlined,
  PictureOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useEventos } from '../context/EventosContext';
import { Turno, Localizacao } from '../types';
import Header from '../components/Header';
import AutocompleteEndereco from '../components/AutocompleteEndereco';
import './AdicionarEvento.css';

const { Title } = Typography;
const { TextArea } = Input;

const AdicionarEvento: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { adicionarEvento } = useEventos();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [localizacaoEndereco, setLocalizacaoEndereco] = useState<Localizacao | undefined>(undefined);
  const [isSugestao, setIsSugestao] = useState(false);
  const [eventoOriginal, setEventoOriginal] = useState<any>(null);
  
  // Observar mudanças no campo tipo
  const tipoSelecionado = Form.useWatch('tipo', form);
  
  // Observar mudanças nos dias da semana para mostrar horários individualizados
  const diasSemanaSelecionados = Form.useWatch('diasSemana', form) || [];

  // Verificar se é sugestão e carregar dados do evento
  useEffect(() => {
    const sugestaoParam = searchParams.get('sugestao');
    if (sugestaoParam === 'true') {
      setIsSugestao(true);
      const eventoStr = localStorage.getItem('sugestaoEvento');
      if (eventoStr) {
        try {
          const evento = JSON.parse(eventoStr);
          setEventoOriginal(evento);
          
          // Preencher formulário com dados do evento
          const horariosPorDiaForm: any = {};
          if (evento.horariosPorDia && evento.horariosPorDia.length > 0) {
            evento.horariosPorDia.forEach((horario: any) => {
              horariosPorDiaForm[horario.dia] = {
                horarioAbertura: horario.horarioAbertura ? dayjs(horario.horarioAbertura, 'HH:mm') : undefined,
                horarioFechamento: horario.horarioFechamento ? dayjs(horario.horarioFechamento, 'HH:mm') : undefined,
                preco: horario.preco || 'gratuito',
                valorEntrada: horario.valorEntrada || undefined,
              };
            });
          }
          
          form.setFieldsValue({
            nome: evento.nome,
            descricao: evento.descricao,
            tipo: evento.tipo,
            data: evento.data ? dayjs(evento.data) : undefined,
            horarioAbertura: evento.horarioAbertura ? dayjs(evento.horarioAbertura, 'HH:mm') : undefined,
            horarioFechamento: evento.horarioFechamento ? dayjs(evento.horarioFechamento, 'HH:mm') : undefined,
            preco: evento.preco,
            valorEntrada: evento.valorEntrada,
            endereco: evento.endereco,
            imagem: evento.imagem,
            recorrente: evento.recorrente,
            diasSemana: evento.diasSemana,
            horariosPorDia: horariosPorDiaForm,
            generoMusical: evento.generoMusical,
            tipoComida: evento.tipoComida,
            temBrinquedoteca: evento.temBrinquedoteca,
            publico: evento.publico,
          });

          // Carregar imagem se existir
          if (evento.imagem) {
            setImagePreview(evento.imagem);
          }

          // Carregar localização se existir
          if (evento.localizacao) {
            setLocalizacaoEndereco(evento.localizacao);
          }
        } catch (error) {
          console.error('Erro ao carregar evento para sugestão:', error);
        }
      }
    }
  }, [searchParams, form]);

  const handleImageUpload: UploadProps['beforeUpload'] = (file) => {
    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
    
    // Criar objeto de arquivo com originFileObj preservado
    const fileWithOrigin: UploadFile = {
      uid: file.uid || Date.now().toString(),
      name: file.name,
      status: 'done',
      url: undefined,
      thumbUrl: undefined,
      originFileObj: file // IMPORTANTE: Preservar o arquivo original
    };
    
    setFileList([fileWithOrigin]);
    console.log('📸 Arquivo preparado:', {
      name: file.name,
      size: file.size,
      type: file.type,
      hasOriginFileObj: !!fileWithOrigin.originFileObj
    });
    
    return false; // Prevent auto upload
  };

  const handleRemoveImage = () => {
    setFileList([]);
    setImagePreview(null);
    form.setFieldsValue({ imagem: undefined });
  };

  const onFinish = async (values: any) => {
    try {
      const isRecorrente = values.recorrente === true;
      
      // Formatar horários - garantir que seja dayjs antes de formatar
      let horarioAbertura = '20:00';
      let horarioFechamento = '02:00';
      
      if (values.horarioAbertura) {
        if (typeof values.horarioAbertura === 'string') {
          horarioAbertura = values.horarioAbertura;
        } else if (values.horarioAbertura.format) {
          horarioAbertura = values.horarioAbertura.format('HH:mm');
        } else {
          horarioAbertura = dayjs(values.horarioAbertura).format('HH:mm');
        }
      }
      
      if (values.horarioFechamento) {
        if (typeof values.horarioFechamento === 'string') {
          horarioFechamento = values.horarioFechamento;
        } else if (values.horarioFechamento.format) {
          horarioFechamento = values.horarioFechamento.format('HH:mm');
        } else {
          horarioFechamento = dayjs(values.horarioFechamento).format('HH:mm');
        }
      }
      
      const turno = calcularTurno(horarioAbertura);
      
      // Formatar valorEntrada - garantir que seja número
      let valorEntrada = undefined;
      if (values.valorEntrada !== undefined && values.valorEntrada !== null && values.valorEntrada !== '') {
        const numValue = typeof values.valorEntrada === 'string' ? parseFloat(values.valorEntrada) : values.valorEntrada;
        if (!isNaN(numValue) && numValue > 0) {
          valorEntrada = numValue;
        }
      }

      // Preparar horários por dia se for recorrente (obrigatório para eventos recorrentes)
      let horariosPorDia = undefined;
      if (isRecorrente && values.diasSemana && values.diasSemana.length > 0) {
        if (!values.horariosPorDia) {
          throw new Error('Horários por dia são obrigatórios para eventos recorrentes');
        }
        
        horariosPorDia = values.diasSemana.map((dia: number) => {
          const horarioDia = values.horariosPorDia[dia];
          if (!horarioDia || !horarioDia.horarioAbertura || !horarioDia.horarioFechamento) {
            throw new Error(`Horários são obrigatórios para ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia]}`);
          }
          
          let horarioAberturaDia: string;
          let horarioFechamentoDia: string;
          
          if (typeof horarioDia.horarioAbertura === 'string') {
            horarioAberturaDia = horarioDia.horarioAbertura;
          } else if (horarioDia.horarioAbertura.format) {
            horarioAberturaDia = horarioDia.horarioAbertura.format('HH:mm');
          } else {
            horarioAberturaDia = dayjs(horarioDia.horarioAbertura).format('HH:mm');
          }
          
          if (typeof horarioDia.horarioFechamento === 'string') {
            horarioFechamentoDia = horarioDia.horarioFechamento;
          } else if (horarioDia.horarioFechamento.format) {
            horarioFechamentoDia = horarioDia.horarioFechamento.format('HH:mm');
          } else {
            horarioFechamentoDia = dayjs(horarioDia.horarioFechamento).format('HH:mm');
          }
          
          // Processar tipo de entrada e valor por dia
          const precoDia = horarioDia.preco || 'gratuito';
          let valorEntradaDia: number | undefined = undefined;
          
          if (precoDia === 'pago') {
            if (!horarioDia.valorEntrada || (typeof horarioDia.valorEntrada === 'string' && horarioDia.valorEntrada.trim() === '')) {
              throw new Error(`Valor de entrada é obrigatório para ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia]} quando o tipo é "Pago"`);
            }
            
            const numValue = typeof horarioDia.valorEntrada === 'string' ? parseFloat(horarioDia.valorEntrada) : horarioDia.valorEntrada;
            if (isNaN(numValue) || numValue <= 0) {
              throw new Error(`Valor de entrada inválido para ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia]}`);
            }
            valorEntradaDia = numValue;
          }
          
          return {
            dia,
            horarioAbertura: horarioAberturaDia,
            horarioFechamento: horarioFechamentoDia,
            preco: precoDia,
            valorEntrada: valorEntradaDia
          };
        });
      }

      // Preparar dados do evento com latitude e longitude
      // Para eventos recorrentes, usar horário padrão temporário (será ignorado pelo backend)
      const horarioAberturaFinal = isRecorrente ? '00:00' : horarioAbertura;
      const horarioFechamentoFinal = isRecorrente ? '00:00' : horarioFechamento;
      
      const dadosEvento = {
        nome: values.nome,
        descricao: values.descricao || '',
        tipo: values.tipo,
        data: isRecorrente ? undefined : values.data?.toISOString(),
        turno: turno,
        horarioAbertura: horarioAberturaFinal,
        horarioFechamento: horarioFechamentoFinal,
        preco: isRecorrente ? undefined : values.preco, // Não enviar tipo de entrada padrão se for recorrente
        valorEntrada: isRecorrente ? undefined : valorEntrada, // Não enviar valor de entrada padrão se for recorrente
        endereco: values.endereco,
        localizacao: localizacaoEndereco, // Objeto com latitude e longitude do autocomplete
        imagem: values.imagem || undefined,
        avaliacao: 0, // Inicia com 0, será atualizada pelos votos dos usuários
        recorrente: isRecorrente,
        diasSemana: isRecorrente ? values.diasSemana : undefined,
        horariosPorDia: horariosPorDia,
        generoMusical: values.generoMusical && values.generoMusical.length > 0 ? values.generoMusical : undefined,
        tipoComida: values.tipoComida || undefined,
        temBrinquedoteca: values.temBrinquedoteca || undefined,
        publico: values.publico || undefined,
      };

      // Log para debug
      if (localizacaoEndereco) {
        console.log('📍 Enviando localização para backend:', localizacaoEndereco);
      } else {
        console.warn('⚠️  Localização não disponível - backend fará geocodificação do endereço');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Se for sugestão, enviar para API de sugestões
      if (isSugestao && eventoOriginal) {
        // Preparar TODOS os campos do formulário (não apenas os alterados)
        const alteracoes: any = {};

        // Nome
        alteracoes.nome = values.nome;
        
        // Descrição
        alteracoes.descricao = values.descricao || '';
        
        // Tipo
        alteracoes.tipo = values.tipo;
        
        // Recorrente e dias/data
        if (values.recorrente) {
          alteracoes.recorrente = true;
          alteracoes.diasSemana = values.diasSemana || [];
          alteracoes.horariosPorDia = horariosPorDia; // Incluir horários por dia
          alteracoes.data = undefined;
        } else {
          alteracoes.recorrente = false;
          alteracoes.data = values.data ? values.data.toISOString() : undefined;
          alteracoes.diasSemana = undefined;
          alteracoes.horariosPorDia = undefined;
        }
        
        // Horários (padrão para eventos não recorrentes, não enviar se for recorrente)
        if (!values.recorrente) {
          alteracoes.horarioAbertura = horarioAbertura;
          alteracoes.horarioFechamento = horarioFechamento;
        } else {
          alteracoes.horarioAbertura = undefined;
          alteracoes.horarioFechamento = undefined;
        }
        
        // Preço e valor de entrada (padrão para eventos não recorrentes, não enviar se for recorrente)
        if (!values.recorrente) {
          alteracoes.preco = values.preco;
        } else {
          alteracoes.preco = undefined;
        }
        
        // Calcular valorEntrada
        let valorEntradaSugestao = undefined;
        if (values.valorEntrada !== undefined && values.valorEntrada !== null && values.valorEntrada !== '') {
          const numValue = typeof values.valorEntrada === 'string' ? parseFloat(values.valorEntrada) : values.valorEntrada;
          if (!isNaN(numValue) && numValue > 0) {
            valorEntradaSugestao = numValue;
          }
        }
        
        if (values.preco === 'pago' && valorEntradaSugestao !== undefined && valorEntradaSugestao > 0) {
          alteracoes.valorEntrada = valorEntradaSugestao;
        } else {
          alteracoes.valorEntrada = undefined;
        }
        
        // Endereço e localização
        alteracoes.endereco = values.endereco;
        if (localizacaoEndereco) {
          alteracoes.localizacao = localizacaoEndereco;
        }
        
        // Remover imagem das alterações (será enviada como arquivo se houver)
        // Não incluir imagem nas alterações - será enviada como arquivo se houver fileList
        delete alteracoes.imagem;

        // Campos específicos por tipo
        if (values.tipo === 'balada' || eventoOriginal.tipo === 'balada') {
          alteracoes.generoMusical = values.generoMusical || [];
          alteracoes.publico = values.publico || undefined;
        }
        if (values.tipo === 'restaurante' || eventoOriginal.tipo === 'restaurante') {
          alteracoes.tipoComida = values.tipoComida || undefined;
        }
        if (values.tipo === 'bar' || eventoOriginal.tipo === 'bar') {
          alteracoes.generoMusical = values.generoMusical || [];
          alteracoes.temBrinquedoteca = values.temBrinquedoteca || false;
        }
        if (values.tipo === 'show' || values.tipo === 'festival' || eventoOriginal.tipo === 'show' || eventoOriginal.tipo === 'festival') {
          alteracoes.generoMusical = values.generoMusical || [];
        }

        // Criar sugestão
        // Se houver imagem, enviar como FormData
        const comentario = values.comentario || '';
        
        if (fileList.length > 0 && fileList[0].originFileObj) {
          // Criar FormData para enviar com imagem
          const formData = new FormData();
          formData.append('imagem', fileList[0].originFileObj, fileList[0].originFileObj.name);
          formData.append('eventoId', eventoOriginal.id);
          formData.append('alteracoes', JSON.stringify(alteracoes));
          formData.append('comentario', comentario); // Sempre enviar comentário, mesmo se vazio
          
          // Fazer upload usando FormData
          const response = await fetch(`${API_URL}/api/sugestoes`, {
            method: 'POST',
            headers: {
              'x-user-id': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).id : '',
              'x-user-nome': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).nome : '',
              'x-user-email': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).email : '',
              // NÃO incluir Content-Type - o browser define automaticamente com boundary para FormData
            },
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro ao criar sugestão' }));
            throw new Error(errorData.error || 'Erro ao criar sugestão');
          }
          
          await response.json();
        } else {
          // Sem imagem, enviar JSON normalmente
          const { apiPost } = await import('../utils/api');
          await apiPost('/api/sugestoes', {
            eventoId: eventoOriginal.id,
            alteracoes,
            comentario: comentario || '' // Sempre enviar comentário, mesmo se vazio
          }, { requireAuth: true });
        }

        // Limpar localStorage
        localStorage.removeItem('sugestaoEvento');
        
        message.success('Sugestão de alteração enviada com sucesso! Aguarde aprovação de um administrador.');
        navigate(`/evento/${eventoOriginal.id}`);
      return;
    }

      // Criar evento via API diretamente para obter o evento criado
      // Se houver imagem, enviar como FormData
      let novoEvento;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        console.log('📤 Preparando upload de imagem:', {
          fileName: fileList[0].name,
          fileSize: fileList[0].originFileObj?.size,
          fileType: fileList[0].originFileObj?.type,
          hasOriginFileObj: !!fileList[0].originFileObj
        });
        
        // Criar FormData para enviar com imagem
        const formData = new FormData();
        formData.append('imagem', fileList[0].originFileObj, fileList[0].originFileObj.name);
        
        // Adicionar dados do evento como JSON string
        formData.append('dados', JSON.stringify(dadosEvento));
        
        // Verificar se o arquivo foi anexado
        console.log('📤 FormData criado:', {
          hasImagem: formData.has('imagem'),
          hasDados: formData.has('dados')
        });
        
        // Fazer upload usando FormData
        // IMPORTANTE: NÃO definir Content-Type manualmente, o browser faz isso automaticamente com boundary
        const response = await fetch(`${API_URL}/api/eventos`, {
          method: 'POST',
          headers: {
            'x-user-id': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).id : '',
            'x-user-nome': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).nome : '',
            'x-user-email': localStorage.getItem('vibed-user') ? JSON.parse(localStorage.getItem('vibed-user')!).email : '',
            // NÃO incluir Content-Type - o browser define automaticamente com boundary para FormData
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro ao criar evento' }));
          throw new Error(errorData.error || 'Erro ao criar evento');
        }
        
        novoEvento = await response.json();
        
        // Verificar se o evento foi aprovado automaticamente (admin) ou se precisa de aprovação (user)
        if (novoEvento && novoEvento.aprovado === 'aprovado') {
          message.success('Evento adicionado e aprovado com sucesso!');
        } else {
          message.success('Evento adicionado com sucesso! Aguarde aprovação de um administrador para que ele apareça na lista.');
        }
        
        // Navegar - o contexto vai recarregar os eventos automaticamente
        navigate('/');
      } else {
        // Sem imagem, usar o contexto que já faz a chamada à API
        // O adicionarEvento já faz tudo: chama API, atualiza estado e recarrega eventos
        await adicionarEvento(dadosEvento);
        message.success('Evento adicionado com sucesso! Aguarde aprovação de um administrador para que ele apareça na lista.');
        navigate('/');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao adicionar evento';
      
      // Se o erro for de autenticação (usuário não encontrado), redirecionar para login
      if (errorMessage.includes('não encontrado') || 
          errorMessage.includes('não autenticado') || 
          errorMessage.includes('Faça login') ||
          errorMessage.includes('registro primeiro')) {
        message.error('Usuário não encontrado. Faça login novamente.');
        navigate('/login');
      return;
    }

      message.error(errorMessage);
    }
  };

  const tipoOptions = [
    { value: 'restaurante', label: '🍽️ Restaurante' },
    { value: 'balada', label: '🎉 Balada' },
    { value: 'show', label: '🎵 Show' },
    { value: 'festival', label: '🎪 Festival' },
    { value: 'bar', label: '🍺 Bar' },
  ];

  // Função para calcular turno baseado no horário de abertura
  const calcularTurno = (horarioAbertura: string): Turno => {
    if (!horarioAbertura) return 'noite'; // padrão
    
    const [horaAbertura] = horarioAbertura.split(':').map(Number);
    
    // Manhã: 5h - 12h
    // Tarde: 12h - 18h
    // Noite: 18h - 5h
    if (horaAbertura >= 5 && horaAbertura < 12) {
      return 'manha';
    } else if (horaAbertura >= 12 && horaAbertura < 18) {
      return 'tarde';
    } else {
      return 'noite';
    }
  };

  const precoOptions = [
    { value: 'gratuito', label: '🆓 Entrada grátis' },
    { value: 'pago', label: '💵 Entrada paga' },
  ];

  return (
    <div className="adicionar-evento">
      <Header />
      <div className="adicionar-evento-container">
        <Title level={1} className="adicionar-evento-title">
          {isSugestao ? 'Sugerir Alterações' : 'Adicionar Evento'}
        </Title>

        <Card className="form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              tipo: 'show',
              preco: 'gratuito',
              recorrente: false,
              horarioAbertura: dayjs('20:00', 'HH:mm'),
              horarioFechamento: dayjs('02:00', 'HH:mm'),
            }}
          >
            <Form.Item
              name="nome"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Nome do Evento</span>}
              rules={[{ required: true, message: 'Por favor, insira o nome do evento!' }]}
            >
              <Input size="large" placeholder="Ex: Show do Artista X" />
            </Form.Item>

            <Form.Item
              name="descricao"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Descrição</span>}
            >
              <TextArea
                rows={4}
              placeholder="Descrição do evento..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="tipo"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Tipo de Rolê</span>}
              rules={[{ required: true, message: 'Por favor, selecione o tipo!' }]}
            >
              <Select 
                size="large" 
                options={tipoOptions}
                onChange={() => {
                  // Limpar campos específicos quando mudar o tipo
                  form.setFieldsValue({ 
                    generoMusical: undefined,
                    tipoComida: undefined,
                    temBrinquedoteca: undefined,
                    publico: undefined
                  });
                }}
              />
            </Form.Item>

            {tipoSelecionado === 'balada' && (
              <>
                <Form.Item
                  name="publico"
                  label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Público (Opcional)</span>}
                >
                  <Select 
                    size="large" 
                    options={[
                      { value: 'LGBT', label: '🏳️‍🌈 LGBT' },
                      { value: 'Hetero', label: '👥 Hetero' },
                    ]} 
                    placeholder="Selecione o público (opcional)" 
                    allowClear
                  />
                </Form.Item>
                <Form.Item
                  name="generoMusical"
                  label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Gêneros Musicais (Opcional)</span>}
                >
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Checkbox value="rock" style={{ color: '#FFFFFF' }}>🎸 Rock</Checkbox>
                      <Checkbox value="pop" style={{ color: '#FFFFFF' }}>🎵 Pop</Checkbox>
                      <Checkbox value="sertanejo" style={{ color: '#FFFFFF' }}>🎤 Sertanejo</Checkbox>
                      <Checkbox value="funk" style={{ color: '#FFFFFF' }}>🎧 Funk</Checkbox>
                      <Checkbox value="eletronica" style={{ color: '#FFFFFF' }}>🎹 Eletrônica</Checkbox>
                      <Checkbox value="indie" style={{ color: '#FFFFFF' }}>🎪 Indie</Checkbox>
                      <Checkbox value="hip-hop" style={{ color: '#FFFFFF' }}>🎤 Hip-Hop</Checkbox>
                      <Checkbox value="reggae" style={{ color: '#FFFFFF' }}>🎵 Reggae</Checkbox>
                      <Checkbox value="samba" style={{ color: '#FFFFFF' }}>🥁 Samba</Checkbox>
                      <Checkbox value="pagode" style={{ color: '#FFFFFF' }}>🎺 Pagode</Checkbox>
                      <Checkbox value="forro" style={{ color: '#FFFFFF' }}>🪕 Forró</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </Form.Item>
              </>
            )}

            {(tipoSelecionado === 'show' || tipoSelecionado === 'festival') && (
              <Form.Item
                name="generoMusical"
                label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Gêneros Musicais (Opcional)</span>}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Checkbox value="rock" style={{ color: '#FFFFFF' }}>🎸 Rock</Checkbox>
                    <Checkbox value="pop" style={{ color: '#FFFFFF' }}>🎵 Pop</Checkbox>
                    <Checkbox value="sertanejo" style={{ color: '#FFFFFF' }}>🎤 Sertanejo</Checkbox>
                    <Checkbox value="funk" style={{ color: '#FFFFFF' }}>🎧 Funk</Checkbox>
                    <Checkbox value="eletronica" style={{ color: '#FFFFFF' }}>🎹 Eletrônica</Checkbox>
                    <Checkbox value="indie" style={{ color: '#FFFFFF' }}>🎪 Indie</Checkbox>
                    <Checkbox value="hip-hop" style={{ color: '#FFFFFF' }}>🎤 Hip-Hop</Checkbox>
                    <Checkbox value="reggae" style={{ color: '#FFFFFF' }}>🎵 Reggae</Checkbox>
                    <Checkbox value="samba" style={{ color: '#FFFFFF' }}>🥁 Samba</Checkbox>
                    <Checkbox value="pagode" style={{ color: '#FFFFFF' }}>🎺 Pagode</Checkbox>
                    <Checkbox value="forro" style={{ color: '#FFFFFF' }}>🪕 Forró</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            )}

            {tipoSelecionado === 'restaurante' && (
              <Form.Item
                name="tipoComida"
                label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Tipo de Comida (Opcional)</span>}
              >
                <Select 
                  size="large" 
                  options={[
                    { value: 'brasileira', label: '🇧🇷 Brasileira' },
                    { value: 'italiana', label: '🇮🇹 Italiana' },
                    { value: 'japonesa', label: '🇯🇵 Japonesa' },
                    { value: 'mexicana', label: '🇲🇽 Mexicana' },
                    { value: 'francesa', label: '🇫🇷 Francesa' },
                    { value: 'chinesa', label: '🇨🇳 Chinesa' },
                    { value: 'indiana', label: '🇮🇳 Indiana' },
                    { value: 'vegana', label: '🌱 Vegana' },
                    { value: 'vegetariana', label: '🥗 Vegetariana' },
                    { value: 'fast-food', label: '🍔 Fast Food' },
                    { value: 'churrasco', label: '🥩 Churrasco' },
                    { value: 'pizzaria', label: '🍕 Pizzaria' },
                  ]} 
                  placeholder="Selecione o tipo de comida (opcional)" 
                  allowClear
                />
              </Form.Item>
            )}

            {tipoSelecionado === 'bar' && (
              <>
                <Form.Item
                  name="generoMusical"
                  label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Gêneros Musicais (Opcional)</span>}
                >
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Checkbox value="rock" style={{ color: '#FFFFFF' }}>🎸 Rock</Checkbox>
                      <Checkbox value="pop" style={{ color: '#FFFFFF' }}>🎵 Pop</Checkbox>
                      <Checkbox value="sertanejo" style={{ color: '#FFFFFF' }}>🎤 Sertanejo</Checkbox>
                      <Checkbox value="funk" style={{ color: '#FFFFFF' }}>🎧 Funk</Checkbox>
                      <Checkbox value="eletronica" style={{ color: '#FFFFFF' }}>🎹 Eletrônica</Checkbox>
                      <Checkbox value="indie" style={{ color: '#FFFFFF' }}>🎪 Indie</Checkbox>
                      <Checkbox value="hip-hop" style={{ color: '#FFFFFF' }}>🎤 Hip-Hop</Checkbox>
                      <Checkbox value="reggae" style={{ color: '#FFFFFF' }}>🎵 Reggae</Checkbox>
                      <Checkbox value="samba" style={{ color: '#FFFFFF' }}>🥁 Samba</Checkbox>
                      <Checkbox value="pagode" style={{ color: '#FFFFFF' }}>🎺 Pagode</Checkbox>
                      <Checkbox value="forro" style={{ color: '#FFFFFF' }}>🪕 Forró</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </Form.Item>
                <Form.Item
                  name="temBrinquedoteca"
                  valuePropName="checked"
                  label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Tem Brinquedoteca (Opcional)</span>}
                >
                  <Checkbox style={{ color: '#FFFFFF' }}>
                    Este bar tem brinquedoteca para crianças
                  </Checkbox>
                </Form.Item>
              </>
            )}

            <Form.Item
              name="recorrente"
              valuePropName="checked"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Evento Recorrente</span>}
            >
              <Checkbox style={{ color: '#FFFFFF' }}>
                Este evento acontece regularmente
              </Checkbox>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.recorrente !== currentValues.recorrente}
            >
              {({ getFieldValue }) => {
                const isRecorrente = getFieldValue('recorrente');
                
                return isRecorrente ? (
                  <>
                    <Form.Item
                      name="diasSemana"
                      label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Dias da Semana</span>}
                      rules={[
                        { required: true, message: 'Por favor, selecione pelo menos um dia da semana!' },
                        { type: 'array', min: 1, message: 'Selecione pelo menos um dia!' }
                      ]}
                    >
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Checkbox value={0} style={{ color: '#FFFFFF' }}>Domingo</Checkbox>
                          <Checkbox value={1} style={{ color: '#FFFFFF' }}>Segunda-feira</Checkbox>
                          <Checkbox value={2} style={{ color: '#FFFFFF' }}>Terça-feira</Checkbox>
                          <Checkbox value={3} style={{ color: '#FFFFFF' }}>Quarta-feira</Checkbox>
                          <Checkbox value={4} style={{ color: '#FFFFFF' }}>Quinta-feira</Checkbox>
                          <Checkbox value={5} style={{ color: '#FFFFFF' }}>Sexta-feira</Checkbox>
                          <Checkbox value={6} style={{ color: '#FFFFFF' }}>Sábado</Checkbox>
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                    
                    {/* Horários individualizados por dia */}
                    {diasSemanaSelecionados.length > 0 && (
                      <Form.Item
                        label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Horários por Dia</span>}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {diasSemanaSelecionados.map((dia: number) => {
                            const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                            return (
                              <Card 
                                key={dia} 
                                size="small" 
                                style={{ 
                                  background: 'rgba(255, 255, 255, 0.1)', 
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  marginBottom: '8px'
                                }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  <Typography.Text strong style={{ color: '#FFFFFF', fontSize: '14px' }}>
                                    {diasNomes[dia]}
                                  </Typography.Text>
                                  <Space style={{ width: '100%' }} size="small">
                                    <Form.Item
                                      name={['horariosPorDia', dia, 'horarioAbertura']}
                                      label={<span style={{ color: '#FFFFFF', fontSize: '12px' }}>Abertura</span>}
                                      style={{ flex: 1, marginBottom: 0 }}
                                      rules={[{ required: true, message: 'Obrigatório' }]}
                                    >
                                      <TimePicker
                                        size="small"
                                        style={{ width: '100%' }}
                                        format="HH:mm"
                                        placeholder="Abertura"
                                        allowClear
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      name={['horariosPorDia', dia, 'horarioFechamento']}
                                      label={<span style={{ color: '#FFFFFF', fontSize: '12px' }}>Fechamento</span>}
                                      style={{ flex: 1, marginBottom: 0 }}
                                      rules={[{ required: true, message: 'Obrigatório' }]}
                                    >
                                      <TimePicker
                                        size="small"
                                        style={{ width: '100%' }}
                                        format="HH:mm"
                                        placeholder="Fechamento"
                                        allowClear
                                      />
                                    </Form.Item>
                                  </Space>
                                  
                                  {/* Tipo de entrada e valor por dia */}
                                  <Form.Item
                                    name={['horariosPorDia', dia, 'preco']}
                                    label={<span style={{ color: '#FFFFFF', fontSize: '12px' }}>Tipo de Entrada</span>}
                                    style={{ marginBottom: 0 }}
                                    rules={[{ required: true, message: 'Obrigatório' }]}
                                  >
                                    <Select
                                      size="small"
                                      style={{ width: '100%' }}
                                      options={[
                                        { label: 'Gratuito', value: 'gratuito' },
                                        { label: 'Pago', value: 'pago' }
                                      ]}
                                    />
                                  </Form.Item>
                                  
                                  {/* Valor de entrada por dia (se preco === 'pago') */}
                                  <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => {
                                      const prevPreco = prevValues?.horariosPorDia?.[dia]?.preco;
                                      const currentPreco = currentValues?.horariosPorDia?.[dia]?.preco;
                                      return prevPreco !== currentPreco;
                                    }}
                                  >
                                    {({ getFieldValue }) => {
                                      const precoDia = getFieldValue(['horariosPorDia', dia, 'preco']);
                                      if (precoDia === 'pago') {
                                        return (
                                          <Form.Item
                                            name={['horariosPorDia', dia, 'valorEntrada']}
                                            label={<span style={{ color: '#FFFFFF', fontSize: '12px' }}>Valor de Entrada (R$)</span>}
                                            style={{ marginBottom: 0 }}
                                            rules={[
                                              { required: true, message: 'Obrigatório' },
                                              { 
                                                validator: (_, value) => {
                                                  if (!value && value !== 0) {
                                                    return Promise.reject(new Error('Obrigatório'));
                                                  }
                                                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                                  if (isNaN(numValue) || numValue <= 0) {
                                                    return Promise.reject(new Error('Valor deve ser positivo'));
                                                  }
                                                  return Promise.resolve();
                                                }
                                              }
                                            ]}
                                            normalize={(value) => {
                                              if (!value && value !== 0) return undefined;
                                              const numValue = typeof value === 'string' ? parseFloat(value) : value;
                                              return isNaN(numValue) ? undefined : numValue;
                                            }}
                                          >
                                            <Input
                                              type="number"
                                              size="small"
                                              placeholder="0.00"
                                              step="0.01"
                                              min="0"
                                              prefix="R$"
                                              style={{ width: '100%' }}
                                            />
                                          </Form.Item>
                                        );
                                      }
                                      return null;
                                    }}
                                  </Form.Item>
                                </Space>
                              </Card>
                            );
                          })}
                        </Space>
                      </Form.Item>
                    )}
                  </>
                ) : (
                  <Form.Item
              name="data"
                    label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Data</span>}
                    rules={[{ required: true, message: 'Por favor, selecione a data!' }]}
                  >
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="Selecione a data"
                      allowClear
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.recorrente !== currentValues.recorrente}
            >
              {({ getFieldValue }) => {
                const isRecorrente = getFieldValue('recorrente');
                
                // Se for recorrente, não mostrar horários padrão
                if (isRecorrente) {
                  return null;
                }
                
                return (
                  <>
                    <Form.Item
                      name="horarioAbertura"
                      label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Horário de Abertura</span>}
                      rules={[{ required: true, message: 'Por favor, selecione o horário de abertura!' }]}
                      getValueFromEvent={(value) => value}
                    >
                      <TimePicker
                        size="large"
                        style={{ width: '100%' }}
                        format="HH:mm"
                        placeholder="Selecione o horário"
                        allowClear
                      />
                    </Form.Item>

                    <Form.Item
                      name="horarioFechamento"
                      label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Horário de Fechamento</span>}
                      rules={[{ required: true, message: 'Por favor, selecione o horário de fechamento!' }]}
                      getValueFromEvent={(value) => value}
                    >
                      <TimePicker
                        size="large"
                        style={{ width: '100%' }}
                        format="HH:mm"
                        placeholder="Selecione o horário"
                        allowClear
                      />
                    </Form.Item>
                  </>
                );
              }}
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.recorrente !== currentValues.recorrente}
            >
              {({ getFieldValue }) => {
                const isRecorrente = getFieldValue('recorrente');
                
                // Se for recorrente, não mostrar tipo de entrada padrão
                if (isRecorrente) {
                  return null;
                }
                
                return (
                  <Form.Item
                    name="preco"
                    label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Tipo de Entrada</span>}
                    rules={[{ required: true, message: 'Por favor, selecione o tipo de entrada!' }]}
                  >
                    <Select size="large" options={precoOptions} />
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.preco !== currentValues.preco || 
                prevValues.recorrente !== currentValues.recorrente
              }
            >
              {({ getFieldValue }) => {
                const preco = getFieldValue('preco');
                const isRecorrente = getFieldValue('recorrente');
                const mostraValorExato = preco === 'pago' && !isRecorrente;
                
                return mostraValorExato ? (
                  <Form.Item
                    name="valorEntrada"
                    label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Valor de Entrada (R$)</span>}
                    rules={[
                      { required: true, message: 'Por favor, insira o valor da entrada!' },
                      { 
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.reject(new Error('Por favor, insira o valor da entrada!'));
                          }
                          const numValue = typeof value === 'string' ? parseFloat(value) : value;
                          if (isNaN(numValue) || numValue <= 0) {
                            return Promise.reject(new Error('O valor deve ser maior que zero!'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                    normalize={(value) => {
                      if (!value) return undefined;
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      return isNaN(numValue) ? undefined : numValue;
                    }}
                  >
                    <Input
                      type="number"
                      size="large"
                      min={0.01}
                      step={0.01}
                      placeholder="Ex: 50.00"
                      prefix="R$"
                      allowClear
                    />
                  </Form.Item>
                ) : null;
              }}
            </Form.Item>

            <Form.Item
              name="endereco"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Endereço</span>}
              rules={[{ required: true, message: 'Por favor, insira o endereço!' }]}
            >
              <AutocompleteEndereco
                size="large"
                placeholder="Digite o endereço completo (ex: Rua, número, bairro, cidade)"
                onChange={(endereco, localizacao) => {
                  // Atualizar o valor do formulário
                  form.setFieldsValue({ endereco });
                  
                  // Salvar localização (latitude e longitude) se fornecida pelo autocomplete
                  if (localizacao && localizacao.latitude && localizacao.longitude) {
                    setLocalizacaoEndereco(localizacao);
                    console.log('📍 Localização capturada:', localizacao);
                  } else {
                    // Limpar localização se não houver coordenadas válidas
                    setLocalizacaoEndereco(undefined);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="imagem"
              label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Imagem do Evento (Opcional)</span>}
            >
              <Upload
                beforeUpload={handleImageUpload}
                onRemove={handleRemoveImage}
                fileList={fileList}
                accept="image/*"
                maxCount={1}
                listType="picture-card"
                className="upload-imagem"
                style={{ width: '100%' }}
              >
                {fileList.length === 0 && (
                  <div style={{ width: '100%' }}>
                    <PictureOutlined style={{ fontSize: 24, color: '#FFFFFF' }} />
                    <div style={{ marginTop: 8, color: '#FFFFFF' }}>Upload</div>
              </div>
            )}
              </Upload>
              {imagePreview && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }} 
                  />
          </div>
              )}
            </Form.Item>

            {isSugestao && (
              <Form.Item
                name="comentario"
                label={<span style={{ color: '#FFFFFF', fontWeight: 600 }}>Motivo da Alteração</span>}
                rules={[{ required: true, message: 'Por favor, informe o motivo da alteração!' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explique o motivo da alteração sugerida..."
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF'
                  }}
                />
              </Form.Item>
            )}

            <Form.Item style={{ marginTop: '2rem', marginBottom: 0 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  block
                  size="large"
                  shape="round"
                  className="btn-primary-gradient"
                >
                  {isSugestao ? 'Enviar Sugestão' : 'Salvar Evento'}
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    if (isSugestao && eventoOriginal) {
                      localStorage.removeItem('sugestaoEvento');
                      navigate(`/evento/${eventoOriginal.id}`);
                    } else {
                      navigate('/');
                    }
                  }}
                  block
                  size="large"
                  shape="round"
                  className="btn-secondary"
            >
              Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AdicionarEvento;
