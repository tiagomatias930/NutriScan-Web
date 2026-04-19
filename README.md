# 🥗 NutriScan

Uma aplicação web completa de rastreamento de nutrição e fitness, alimentada por inteligência artificial Gemini. NutriScan oferece análise inteligente de alimentos, coaching personalizado e acompanhamento avançado de macronutrientes.

## ✨ Características Principais

### 📱 Dashboard Inteligente
- Visualização em tempo real de calorias e macronutrientes
- Gráficos e estatísticas do histórico nutricional
- Lembretes de hidratação automáticos
- Status offline em tempo real

### 🤖 AI Coach
- Chat interativo com inteligência artificial Gemini
- Recomendações personalizadas de nutrição
- Análise de padrões alimentares
- Dicas de saúde e fitness baseadas no seu perfil

### 📸 Scanner de Alimentos
- Captura de fotos para análise de alimentos
- Reconhecimento automático usando IA
- Cálculo automático de macronutrientes (calorias, proteína, carboidratos, gordura)
- Estimativa de peso/porção

### 🔐 Autenticação e Segurança
- Autenticação com Google OAuth
- Integração com Supabase
- Dados criptografados e sincronizados na nuvem
- Segurança em nível de linha (RLS) no banco de dados

### 🌐 Funcionalidades Offline
- Suporte completo PWA (Progressive Web App)
- Cache inteligente de assets
- Sincronização automática quando reconectado
- Trabalha com ou sem internet

### 🔔 Notificações Push
- Lembretes de hidratação automáticos
- Funciona mesmo com app offline
- Notificações visuais, sonoras e vibração
- Agendamento inteligente

### 🎨 Personalização
- Modo claro e escuro
- Suporte a múltiplos idiomas (internacionalização)
- Interface responsiva e moderna
- Tema adaptável

### 📊 Histórico e Relatórios
- Registro completo de alimentos consumidos
- Histórico de chat e recomendações
- Estatísticas de progresso
- Exportação de dados

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **IA**: Google Gemini API
- **Autenticação**: Google OAuth + Supabase Auth
- **PWA**: Service Worker + Web APIs
- **Gráficos**: Recharts

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn
- Conta no [Google Cloud Console](https://console.cloud.google.com/)
- Conta no [Supabase](https://supabase.com/)
- Chave API do Gemini

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone <repository-url>
cd NutriScan-Web
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Gemini API
VITE_GEMINI_API_KEY=sua-chave-api-do-gemini

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase

# Google OAuth (opcional para desenvolvimento local)
VITE_GOOGLE_CLIENT_ID=seu-client-id-google
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret-google
```

### 4. Execute em desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`

### 5. Build para produção

```bash
npm run build
```

A aplicação compilada estará em `dist/`

### 6. Preview do build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
NutriScan-Web/
├── components/              # Componentes React
│   ├── Dashboard.tsx        # Página principal
│   ├── ChatCoach.tsx        # Chat com IA
│   ├── Scanner.tsx          # Scanner de alimentos
│   ├── About.tsx            # Página sobre
│   └── ...
├── services/                # Serviços e integrações
│   ├── geminiService.ts     # Integração com Gemini
│   ├── googleAuthService.ts # Autenticação Google
│   ├── pushNotificationService.ts
│   └── offlineStatusService.ts
├── utils/                   # Utilitários
│   ├── i18n.ts             # Internacionalização
│   ├── calculations.ts     # Cálculos nutricionais
│   └── externalBrowser.ts
├── hooks/                   # React Hooks customizados
│   ├── useSupabaseAuth.ts
│   └── useOfflineStatus.ts
├── public/                  # Assets e service worker
│   ├── sw.js               # Service Worker
│   └── manifest.json       # PWA Manifest
├── server/                  # Backend Express
│   └── index.js
├── store.ts                 # Zustand store (state management)
├── types.ts                 # Tipos TypeScript
├── App.tsx                  # Componente raiz
└── vite.config.ts          # Configuração Vite
```

## 🗄️ Banco de Dados

O NutriScan usa Supabase (PostgreSQL) com as seguintes tabelas principais:

### Tabela `users`
- Perfis de usuário com dados pessoais
- Altura, peso, nível de atividade
- Somatótipo e objetivo de fitness
- Row Level Security (RLS) habilitado

### Tabela `food_logs`
- Registro de alimentos consumidos
- Macronutrientes (calorias, proteína, carboidratos, gordura)
- Tipo de refeição e timestamp
- Imagens dos alimentos

### Tabela `chat_history`
- Histórico de conversas com o AI Coach
- Contexto e recomendações

Para mais detalhes, consulte [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md)

## 🔌 Integrações Externas

### Google Gemini AI
- Análise de alimentos por foto
- Chat interativo com recomendações
- Processamento de linguagem natural

### Google Fit (opcional)
- Sincronização de dados de atividade
- Importação de passos e exercícios

### Supabase
- Backend as a Service
- Autenticação
- Database PostgreSQL
- Real-time subscriptions

## 📱 Suporte a Aplicações Nativas

O NutriScan pode ser compilado como aplicação nativa usando **AppGyser**:

- Suporte a câmera nativa do dispositivo
- Permissões de câmera e fotos
- Compatível com Android e iOS

Consulte [APPGYSER_SETUP.md](APPGYSER_SETUP.md) para instruções completas.

## 🌐 Suporte Offline

O NutriScan é uma PWA com suporte completo offline:

- **Cache-first**: Assets estáticos (HTML, CSS, JS, imagens)
- **Network-first**: Chamadas de API
- **Background Sync**: Sincronização automática quando reconectado

Consulte [OFFLINE_SUPPORT.md](OFFLINE_SUPPORT.md) para detalhes técnicos.

## 🔔 Notificações Push

Lembretes automáticos de hidratação a cada 2 horas:

- Funciona mesmo quando o app está offline
- Notificações visuais, sonoras e vibração
- Agendamento inteligente

Consulte [PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md) para configuração.

## 🌍 Idiomas Suportados

O NutriScan possui suporte a múltiplos idiomas através do sistema de internacionalização. Consulte a pasta `utils/` para a configuração i18n.

## 🔐 Segurança

- Autenticação segura com OAuth
- Criptografia de dados em trânsito (HTTPS)
- Row Level Security (RLS) no banco de dados
- Validação de entrada no cliente e servidor
- Variáveis sensíveis em `.env.local` (não commitadas)

## 📝 Desenvolvimento

### Adicionar novo componente

```bash
# Crie um novo arquivo em components/MeuComponente.tsx
touch src/components/MeuComponente.tsx
```

### Adicionar novo serviço

```bash
# Crie um novo arquivo em services/
touch src/services/meuServico.ts
```

### Executar em modo desenvolvimento

```bash
npm run dev
```

### Compilar TypeScript

O Vite está configurado para compilar TypeScript automaticamente.

## 🧪 Testes

Para adicionar testes (ainda não configurado):

```bash
npm install --save-dev vitest @vitest/ui
```

## 📦 Deployment

### Opções de deployment

1. **Vercel** (recomendado)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Conecte o repositório GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **CloudFlare Pages**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Servidor próprio**
   ```bash
   npm run build
   # Distribua o conteúdo de dist/
   ```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para suporte, questões ou reportar bugs, abra uma issue no repositório.

## 🙏 Agradecimentos

- Google Gemini API por fornecer IA de análise de alimentos
- Supabase por infraestrutura backend
- Comunidade React e TypeScript
- Vite por excelente tooling

---

**Desenvolvido com ❤️**
