# 🎉 Vibed - App de Festas e Shows

Aplicativo mobile-first desenvolvido com Capacitor + React para gerenciar festas, shows, agenda cultural, restaurantes, baladas e muito mais!

## ✨ Funcionalidades

- ✅ **Adicionar Eventos**: Crie novos eventos com informações detalhadas
- ✅ **Listar Eventos**: Visualize todos os eventos cadastrados
- ✅ **Busca e Filtros Avançados**:
  - Por data
  - Por turno (manhã, tarde, noite)
  - Por tipo de rolê (restaurante, balada, show, festival, bar, etc.)
  - Por preço (grátis até acima de R$ 200)
  - Busca textual (nome, descrição, endereço)
- ✅ **Priorização por Proximidade**: Eventos mais próximos aparecem primeiro
- ✅ **Geolocalização**: Integração com GPS para calcular distâncias

## 🚀 Como Executar

### Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev
```

### Build para Produção

```bash
# Criar build
npm run build

# Preview do build local
npm run preview

# Sincronizar com Capacitor
npm run cap:sync
```

### Adicionar Plataformas

```bash
# Android
npm run cap:add:android

# iOS
npm run cap:add:ios
```

### Abrir no IDE Nativo

```bash
# Android Studio
npm run cap:open:android

# Xcode
npm run cap:open:ios
```

## 📱 Tecnologias

- **React** 18
- **TypeScript**
- **Vite** 5 (build tool)
- **Capacitor** 5
- **React Router** 6
- **Geolocalização** (Capacitor Geolocation)

## 🎨 Design

- Mobile-first e responsivo
- Interface moderna e intuitiva
- Gradientes e animações suaves
- Otimizado para touch

## 📝 Notas

- Os eventos são salvos localmente no navegador (localStorage)
- A geolocalização requer permissões do dispositivo
- O app prioriza eventos mais próximos quando a localização está disponível

## 📄 Licença

Este projeto é de código aberto.

