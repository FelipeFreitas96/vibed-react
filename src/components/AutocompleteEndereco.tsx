import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input, AutoComplete } from 'antd';
import { Localizacao } from '../types';
import { SearchOutlined } from '@ant-design/icons';

interface AutocompleteEnderecoProps {
  value?: string;
  onChange?: (value: string, localizacao?: Localizacao) => void;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  powered_by: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

type OptionType = {
  value: string;
  label: string | React.ReactNode;
  localizacao?: Localizacao;
};

const AutocompleteEndereco: React.FC<AutocompleteEnderecoProps> = ({
  value,
  onChange,
  placeholder = 'Digite o endereço...',
  size = 'large',
  disabled = false,
}) => {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para buscar endereços no Nominatim
  const buscarEnderecos = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);

    try {
      // API do Nominatim (OpenStreetMap) - gratuita e sem necessidade de chave
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1&accept-language=pt-BR`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Vibed App/1.0', // Nominatim requer User-Agent
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar endereços');
      }

      const data: NominatimResult[] = await response.json();

      const opcoes = data.map((result) => ({
        value: result.display_name,
        label: (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 500 }}>{result.display_name.split(',')[0]}</span>
            <span style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
              {result.display_name}
            </span>
          </div>
        ),
        localizacao: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        },
      }));

      setOptions(opcoes);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para evitar muitas requisições
  const handleSearch = useCallback((searchText: string) => {
    // Atualizar o valor enquanto digita
    if (onChange) {
      onChange(searchText);
    }

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Aguardar 500ms antes de buscar
    debounceTimerRef.current = setTimeout(() => {
      buscarEnderecos(searchText);
    }, 500);
  }, [onChange, buscarEnderecos]);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSelect = (value: string, option: any) => {
    // Quando um endereço é selecionado, capturar a localização
    if (onChange && option.localizacao) {
      onChange(value, option.localizacao);
    } else if (onChange) {
      onChange(value);
    }
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      style={{ width: '100%' }}
      notFoundContent={loading ? 'Buscando...' : 'Digite pelo menos 3 caracteres'}
      filterOption={false} // Desabilitar filtro local, pois estamos fazendo busca no servidor
    >
      <Input
        size={size}
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        disabled={disabled}
      />
    </AutoComplete>
  );
};

export default AutocompleteEndereco;
