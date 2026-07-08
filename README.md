# 🥗 NutriScan Mobile

App de monitorização nutricional avançada com Inteligência Artificial, desenvolvida em **React Native Expo**. O NutriScan utiliza o poder do **Gemini AI** para transformar fotos de alimentos em dados nutricionais precisos e oferecer um coaching personalizado.

---

## 🚀 Novidades Recentes

*   🌍 **Personalização Local**: Recomendações adaptadas ao seu país e cultura.
*   🧬 **Análise por Somatotipo**: Planos nutricionais baseados no seu tipo de corpo (Ectomorfo, Mesomorfo, Endomorfo).
*   💡 **Sugestões Inteligentes**: Novo carrossel de sugestões de refeições personalizadas pela IA.
*   💧 **Gestão de Hidratação**: Registo de água com lembretes inteligentes e notificações.
*   🔔 **Notificações Push**: Alertas personalizados para manter o foco nos seus objetivos.
    > [!IMPORTANT]
    > No SDK 53+, as notificações remotas em Android não são suportadas no **Expo Go**. Para utilizar esta funcionalidade, é necessário criar um **Development Build** (`npx expo run:android`). As notificações locais (como lembretes de hidratação) continuam funcionais.
*   📡 **Resiliência Offline**: Novo sistema de monitorização de rede e sincronização de dados.
*   🖼️ **Integração Spoonacular**: Imagens reais de pratos e ingredientes via API externa.

---

## 📱 Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| 🧾 **Onboarding Inteligente** | Configuração de perfil com cálculo automático de TDEE e macros. |
| 📊 **Dashboard Dinâmico** | Gráfico de calorias em tempo real, progresso de macros e hidratação. |
| 📷 **Scanner IA (Gemini)** | Identificação instantânea de alimentos e estimativa nutricional por imagem. |
| 💡 **Food Suggestions** | Carrossel de refeições recomendadas com base no seu objetivo e somatotipo. |
| 💬 **AI Chat Coach** | Conversa contextual com um coach nutricional que conhece o seu histórico. |
| 📅 **Histórico Completo** | Acesso aos registos dos últimos 7 dias com análise detalhada. |
| 🌐 **Multilingue & Temas** | Suporte para PT, EN, ZH, FR e modo Dark/Light. |

---

## 🏗️ Arquitetura do Projecto

```
NutriScan-Mobile/
├── App.tsx                        # Entrada principal e Navegação
├── store.ts                       # Estado Global (Zustand + Persistence)
├── types.ts                       # Definições de Tipos TypeScript
├── components/
│   ├── Onboarding.tsx             # Wizard de configuração inicial
│   ├── Dashboard.tsx              # Ecrã central de métricas
│   ├── FoodSuggestions.tsx        # Carrossel de sugestões IA
│   ├── HydrationReminder.tsx      # Configuração de alertas de água
│   ├── Scanner.tsx                # Interface de captura e análise
│   ├── ChatCoach.tsx              # Interface de chat com IA
│   ├── OfflineStatusBanner.tsx    # Indicador de estado de rede
│   └── PushNotificationInitializer.tsx # Setup de notificações
├── services/
│   ├── geminiService.ts           # Motor de IA (Google Gemini Flash)
│   ├── foodishService.ts          # Motor de imagens (Foodish API)
│   ├── pushNotificationService.ts # Gestão de alertas locais/push
│   └── offlineStatusService.ts    # Lógica de sincronização e rede
└── utils/
    ├── i18n.ts                    # Internacionalização
    └── calculations.ts            # Fórmulas nutricionais (Harris-Benedict)
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Expo Go instalado no telemóvel

### Passos
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o ambiente Expo
npx expo start
```
Leia o QR Code gerado com a app **Expo Go** (Android) ou a Câmara (iOS).

---

## 🔑 Configuração de APIs

O projecto utiliza as seguintes APIs:
1.  **Google Gemini API**: Para análise de imagem e chat (Configurada em `services/geminiService.ts`).
2.  **Foodish API**: Para geração de imagens aleatórias de pratos e ingredientes (Configurada em `services/foodishService.ts`).

> [!TIP]
> Em ambiente de produção, recomenda-se mover estas chaves para variáveis de ambiente utilizando o `app.json` (expo-constants).

---

## 📦 Dependências Principais

| Pacote | Função |
|---|---|
| `expo` | Framework base |
| `gemini-2.5-flash` | Motor de Inteligência Artificial |
| `zustand` | Gestão de estado leve e persistente |
| `react-native-svg` | Visualização de dados e gráficos |
| `expo-notifications` | Sistema de lembretes e push |
| `@react-native-community/netinfo` | Gestão de estado offline |
| `expo-image-picker` | Acesso à câmara e galeria |
