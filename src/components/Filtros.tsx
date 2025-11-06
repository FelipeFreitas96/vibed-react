import React, { useState } from 'react';
import { Input, DatePicker, Space, Button, Select, Drawer, Badge, Checkbox } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEventos } from '../context/EventosContext';
import { TipoEvento, Turno, PrecoFiltro, Publico } from '../types';
import './Filtros.css';

const Filtros: React.FC = () => {
  const { filtros, setFiltros } = useEventos();
  const [open, setOpen] = useState(false);
  // Estado local para garantir que os sub-filtros apareçam corretamente
  const [tipoAtual, setTipoAtual] = useState<TipoEvento | undefined>(filtros.tipo);

  const tipos: TipoEvento[] = ['restaurante', 'balada', 'show', 'festival', 'bar'];
  const turnos: Turno[] = ['manha', 'tarde', 'noite', 'madrugada'];
  const precos: PrecoFiltro[] = ['sem-entrada', 'ate-50', 'ate-100', 'ate-200', 'qualquer-valor'];

  const aplicarFiltro = (campo: keyof typeof filtros, valor: string | boolean | string[] | undefined | null) => {
    // Tratar o valor corretamente
    let valorFinal: string | boolean | string[] | undefined;
    
    if (valor === null || valor === undefined || valor === '') {
      valorFinal = undefined;
    } else if (Array.isArray(valor)) {
      valorFinal = valor.length > 0 ? valor : undefined;
    } else {
      valorFinal = valor;
    }
    
    const novoFiltro: typeof filtros = {
      ...filtros,
      [campo]: valorFinal,
    };
    setFiltros(novoFiltro);
  };

  const limparFiltros = () => {
    setFiltros({});
    setTipoAtual(undefined);
    setOpen(false);
  };

  // Sincronizar tipoAtual com filtros.tipo quando mudar
  React.useEffect(() => {
    setTipoAtual(filtros.tipo);
  }, [filtros.tipo]);

  // Contar apenas filtros com valores definidos (não undefined)
  const contarFiltrosAtivos = () => {
    return Object.keys(filtros).filter(key => {
      const valor = filtros[key as keyof typeof filtros];
      // Contar apenas se o valor não for undefined, null ou string vazia
      if (valor === undefined || valor === null || valor === '') return false;
      // Se for array, contar apenas se tiver elementos
      if (Array.isArray(valor) && valor.length === 0) return false;
      // Se for boolean, contar apenas se for true (false significa filtro ativo mas negativo)
      // Na verdade, boolean false ainda é um filtro válido, então vamos contar
      return true;
    }).length;
  };
  
  const numFiltrosAtivos = contarFiltrosAtivos();
  const temFiltrosAtivos = numFiltrosAtivos > 0;

  const tipoOptions = tipos.map(tipo => ({
    value: tipo,
    label: tipo === 'restaurante' ? '🍽️ Restaurante' :
           tipo === 'balada' ? '🎉 Balada' :
           tipo === 'show' ? '🎵 Show' :
           tipo === 'festival' ? '🎪 Festival' :
           tipo === 'bar' ? '🍺 Bar' : ''
  }));

  const turnoOptions = turnos.map(turno => ({
    value: turno,
    label: turno === 'manha' ? '🌅 Manhã' :
           turno === 'tarde' ? '☀️ Tarde' :
           turno === 'noite' ? '🌙 Noite' : '🌃 Madrugada'
  }));

  const precoOptions = precos.map(preco => ({
    value: preco,
    label: preco === 'sem-entrada' ? '🚫 Sem entrada' :
           preco === 'ate-50' ? '💵 Até R$ 50' :
           preco === 'ate-100' ? '💵💵 Até R$ 100' :
           preco === 'ate-200' ? '💵💵💵 Até R$ 200' : '💵💵💵💵 Qualquer valor'
  }));

  return (
    <>
      <Badge count={numFiltrosAtivos > 0 ? numFiltrosAtivos : 0} offset={[-8, 8]}>
        <Button
          icon={<FilterOutlined />}
          onClick={() => {
            setTipoAtual(filtros.tipo); // Sincronizar ao abrir
            setOpen(true);
          }}
          className="toolbar-btn"
          shape="round"
          size="small"
        >
          Filtros
        </Button>
      </Badge>

      <Drawer
        title={
          <Space>
            <FilterOutlined />
            <span>Filtros</span>
        {temFiltrosAtivos && (
              <Button
                type="link"
                icon={<ClearOutlined />}
            onClick={limparFiltros}
                danger
                size="small"
              >
                Limpar todos
              </Button>
            )}
          </Space>
        }
        placement="bottom"
        onClose={() => {
          setOpen(false);
          // Sincronizar tipoAtual com filtros.tipo ao fechar
          setTipoAtual(filtros.tipo);
        }}
        open={open}
        height="80vh"
        className="filtros-drawer"
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            placeholder="Buscar por nome, descrição, endereço..."
            prefix={<SearchOutlined />}
              value={filtros.busca || ''}
              onChange={(e) => aplicarFiltro('busca', e.target.value)}
            size="large"
            className="filtro-input"
          />

          <DatePicker
            placeholder="Selecione uma data"
            style={{ width: '100%' }}
            size="large"
            value={filtros.data ? dayjs(filtros.data) : null}
            onChange={(date: Dayjs | null) => {
              aplicarFiltro('data', date ? date.format('YYYY-MM-DD') : undefined);
            }}
            format="DD/MM/YYYY"
            className="filtro-input"
          />

          <Select
            placeholder="Selecione o turno (opcional)"
            style={{ width: '100%' }}
            size="large"
            value={filtros.turno}
            onChange={(value) => aplicarFiltro('turno', value)}
            options={turnoOptions}
            allowClear
            className="filtro-input"
          />

          <Select
            placeholder="Selecione o tipo de rolê"
            style={{ width: '100%' }}
            size="large"
            value={filtros.tipo}
            onChange={(value) => {
              setTipoAtual(value || undefined);
              
              // Determinar quais filtros devem ser limpos baseado no novo tipo
              const tipoNovo = value || undefined;
              
              // Se não há tipo novo, limpar todos os sub-filtros
              if (!tipoNovo) {
                const novoFiltro: typeof filtros = {
                  ...filtros,
                  tipo: undefined,
                  generoMusical: undefined,
                  tipoComida: undefined,
                  temBrinquedoteca: undefined,
                  publico: undefined,
                };
                setFiltros(novoFiltro);
                return;
              }
              
              // Se o tipo mudou, limpar apenas os sub-filtros que não são compatíveis com o novo tipo
              const novoFiltro: typeof filtros = {
                ...filtros,
                tipo: tipoNovo,
              };
              
              // Tipos que usam generoMusical: balada, show, festival, bar
              const tiposComGeneroMusical = ['balada', 'show', 'festival', 'bar'];
              // Se o novo tipo não usa generoMusical, limpar
              if (!tiposComGeneroMusical.includes(tipoNovo)) {
                novoFiltro.generoMusical = undefined;
              }
              
              // Tipos que usam tipoComida: restaurante
              if (tipoNovo !== 'restaurante') {
                novoFiltro.tipoComida = undefined;
              }
              
              // Tipos que usam temBrinquedoteca: bar
              if (tipoNovo !== 'bar') {
                novoFiltro.temBrinquedoteca = undefined;
              }
              
              // Tipos que usam publico: balada
              if (tipoNovo !== 'balada') {
                novoFiltro.publico = undefined;
              }
              
              setFiltros(novoFiltro);
            }}
            options={tipoOptions}
            allowClear
              className="filtro-input"
          />

          {(filtros.tipo === 'balada' || tipoAtual === 'balada') ? (
            <div className="sub-filtros-section">
              <Select
                placeholder="Selecione o público (opcional)"
                style={{ width: '100%' }}
                size="large"
                value={filtros.publico}
                onChange={(value) => aplicarFiltro('publico', value)}
                options={[
                  { value: 'LGBT', label: '🏳️‍🌈 LGBT' },
                  { value: 'Hetero', label: '👥 Hetero' },
                ]}
                allowClear
                className="filtro-input"
              />
              <Checkbox.Group
                style={{ width: '100%' }}
                value={filtros.generoMusical || []}
                onChange={(value) => aplicarFiltro('generoMusical', value.length > 0 ? value : undefined)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
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
            </div>
          ) : null}

          {(filtros.tipo === 'show' || tipoAtual === 'show' || filtros.tipo === 'festival' || tipoAtual === 'festival') ? (
            <div className="sub-filtros-section">
              <Checkbox.Group
                style={{ width: '100%' }}
                value={filtros.generoMusical || []}
                onChange={(value) => aplicarFiltro('generoMusical', value.length > 0 ? value : undefined)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
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
            </div>
          ) : null}

          {(filtros.tipo === 'restaurante' || tipoAtual === 'restaurante') ? (
            <div className="sub-filtros-section">
              <Select
                placeholder="Selecione o tipo de comida (opcional)"
                style={{ width: '100%' }}
                size="large"
                value={filtros.tipoComida}
                onChange={(value) => aplicarFiltro('tipoComida', value)}
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
                allowClear
                className="filtro-input"
              />
          </div>
          ) : null}

          {(filtros.tipo === 'bar' || tipoAtual === 'bar') ? (
            <div className="sub-filtros-section">
              <Checkbox.Group
                style={{ width: '100%' }}
                value={filtros.generoMusical || []}
                onChange={(value) => aplicarFiltro('generoMusical', value.length > 0 ? value : undefined)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
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
              <Select
                placeholder="Tem brinquedoteca? (opcional)"
                style={{ width: '100%' }}
                size="large"
                value={filtros.temBrinquedoteca !== undefined ? filtros.temBrinquedoteca.toString() : undefined}
                onChange={(value) => aplicarFiltro('temBrinquedoteca', value === 'true' ? true : value === 'false' ? false : undefined)}
                options={[
                  { value: 'true', label: '✅ Sim, tem brinquedoteca' },
                  { value: 'false', label: '❌ Não tem brinquedoteca' },
                ]}
                allowClear
                className="filtro-input"
              />
            </div>
          ) : null}

          <Select
            placeholder="Selecione o valor de entrada"
            style={{ width: '100%' }}
            size="large"
            value={filtros.preco}
            onChange={(value) => aplicarFiltro('preco', value)}
            options={precoOptions}
            allowClear
            className="filtro-input"
          />
        </Space>
      </Drawer>
    </>
  );
};

export default Filtros;
