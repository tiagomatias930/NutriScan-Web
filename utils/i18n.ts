import { useCallback } from 'react';
import { useAppStore } from '../store';
import { Locale, AVAILABLE_LOCALES, DEFAULT_LOCALE } from './localization';

type TemplateParams = Record<string, string | number>;

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

type Translations = Record<Locale, TranslationTree>;

const translations: Translations = {
  pt: {
    language: {
      portuguese: 'Português',
      english: 'Inglês',
      tooltip: 'Alterar idioma',
    },
    common: {
      continue: 'Continuar',
      start: 'Começar',
      close: 'Fechar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      now: 'Agora',
      later: 'Depois',
      ml: 'ml',
      yes: 'Sim',
      no: 'Não',
      active: 'Ativo',
      loading: 'Carregando...',
      unknownError: 'Erro desconhecido',
    },
    onboarding: {
      step1: {
        title: 'Vamos começar.',
        description: 'Precisamos de alguns detalhes para criar seu plano nutricional personalizado.',
        nameLabel: 'Qual é o seu nome?',
        namePlaceholder: 'ex.: Alex',
        genderLabel: 'Gênero',
      },
      gender: {
        male: 'Masculino',
        female: 'Feminino',
      },
      step2: {
        title: 'Suas estatísticas',
        description: 'Números precisos nos ajudam a calcular suas necessidades calóricas.',
      },
      sliders: {
        age: { label: 'Idade', unit: 'anos' },
        height: { label: 'Altura', unit: 'cm' },
        weight: { label: 'Peso', unit: 'kg' },
      },
      step3: {
        title: 'Tipo de corpo',
        description: 'Selecione a opção que melhor descreve sua constituição física natural.',
        ectomorphTitle: 'Ectomorfo',
        ectomorphDesc: 'Corpo magro, metabolismo acelerado, dificuldade para ganhar peso.',
        mesomorphTitle: 'Mesomorfo',
        mesomorphDesc: 'Físico atlético, ganha massa muscular com facilidade.',
        endomorphTitle: 'Endomorfo',
        endomorphDesc: 'Constituição robusta, metabolismo mais lento, ganha gordura com facilidade.',
      },
      step4: {
        title: 'Sua meta',
        description: 'O que você deseja alcançar?',
        activityLabel: 'Nível das atividades',
      },
      goals: {
        lose: 'Perder peso',
        gain: 'Ganhar massa muscular',
        maintain: 'Manter corpo estável',
        recomp: 'Recomposição corporal',
      },
      activity: {
        sedentary: 'Sedentário',
        light: 'Normal',
        moderate: 'Moderado',
        intense: 'Intenso',
        veryIntense: 'Muito intenso',
      },
      actions: {
        continue: 'Continuar',
        start: 'Começar o plano',
      },
    },
    dashboard: {
      loadingProfile: 'Processando o seu perfil...',
      welcomeBack: 'Bem-vindo de volta,',
      caloriesAvailable: 'Calorias disponíveis',
      caloriesGoal: 'de {{goal}} kcal meta',
      consumed: 'Consumido',
      remaining: 'Restante',
      macros: {
        protein: 'Proteína',
        carbs: 'Carboidrato',
        fats: 'Gordura',
      },
      hydration: {
        title: 'Hidratação',
        goal: 'Meta: {{goal}}ml',
        addWater: '+ {{amount}}ml',
      },
      meals: {
        recent: 'Refeições recentes',
        last24h: 'Últimas 24h',
        viewHistory: 'Ver histórico',
        emptyTitle: 'Nenhuma refeição registrada hoje.',
        emptySubtitle: 'Toque no scanner para iniciar o rastreamento!',
      },
      chart: {
        kcal: 'kcal',
      },
    },
    history: {
      title: 'Histórico diário',
      clear: 'Limpar histórico',
      clearConfirm: 'Limpar todo o histórico? Esta ação é irreversível.',
      empty: 'Nenhum histórico arquivado ainda.',
      mealsAndWater: '{{meals}} refeição(ões) • {{water}} ml',
      viewDetails: 'Ver detalhes',
      hideDetails: 'Fechar',
      remove: 'Remover',
      removeConfirm: 'Remover este dia do histórico?',
      macros: '{{protein}}g P • {{carbs}}g C • {{fats}}g G',
    },
    hydrationToggle: {
      on: 'On',
      off: 'Off',
      titleOn: 'Lembretes de hidratação ativados',
      titleOff: 'Lembretes de hidratação desativados',
    },
    hydrationReminder: {
      title: 'Hora de Hidratar — NutriScan',
      body: 'Faça uma pausa: beba um copo de água agora 💧',
    },
    hydrationNotification: {
      title: 'Hora de Hidratar',
      subtitle: 'Sua saúde depende de uma boa hidratação',
      message: 'Faça uma pausa e beba um copo de água agora 💧',
      tip1: 'Manter-se hidratado melhora o metabolismo',
      tip2: 'Beba 8-10 copos de água por dia',
      tip3: 'Água é essencial para queimar calorias',
      dismiss: 'Agora não',
      confirm: 'Bebendo agora!',
      autoDismiss: 'Este alerta desaparece automaticamente em 8 segundos',
    },
    chat: {
      headerTitle: 'NutriCoach AI',
      status: 'Ativo',
      greeting: 'Olá, {{name}}!',
      intro: 'Estou aqui para te ajudar com sua dieta, rotina de exercícios ou informações nutricionais.',
      placeholder: 'Pergunte qualquer coisa...',
      emptySuggestions: {
        breakfast: 'O que devo comer no café da manhã?',
        protein: 'Quanto de proteína eu preciso?',
        carbCycling: 'Explique carb cycling',
      },
      sources: 'Fontes',
    },
    scanner: {
      headerTitle: 'Analisador de imagem',
      captureTitle: ' ',
      captureSubtitle: ' ',
      importTitle: 'Escolher a imagem',
      importSubtitle: 'Selecione uma imagem do seu dispositivo',
      processing: {
        title: 'Processando imagem...',
        description: 'Compactando e preparando para análise',
      },
      analyzing: {
        title: 'Analisando os alimentos...',
        description: 'Identificando macronutrientes e calorias',
      },
      confidence: 'Confiança:',
      lowConfidenceTitle: 'Baixa confiança na estimativa',
      lowConfidenceMessage: 'Se os valores parecerem incorretos, ajuste manualmente ou reanalise em maior qualidade.',
      nutrients: {
        calories: 'Calorias',
        protein: 'Proteína',
        carbs: 'Carboidratos',
        fats: 'Gordura',
      },
      actions: {
        retake: 'Escanear novamente',
        reanalyze: 'Reanalisar',
        add: 'Adicionar ao registro',
        listen: 'Ouvir resultado',
        capture: 'Capturar foto',
        import: 'Escolher imagem',
      },
      errors: {
        invalidFormat: 'Formato inválido. Selecione uma imagem.',
        tooLarge: 'Imagem muito grande. Tente uma foto menor (máx 5MB).',
        fileTooLarge: 'Arquivo muito grande. Máximo permitido: {{maxSize}}.',
        fileImportFailed: 'Falha ao importar arquivo. Tente novamente.',
        processingFailed: 'Não foi possível processar: {{message}}. Tente outra foto ou em menor resolução.',
        generic: 'Não foi possível processar a imagem. Tente novamente.',
        analyzeFailed: 'Não foi possível analisar a imagem. Tente novamente com uma foto menor ou mais nítida.',
        reanalyzeFailed: 'Reanálise falhou. Tente outra foto ou usar uma de maior qualidade.',
        reanalyzeLoadFailed: 'Erro ao carregar imagem para reanálise.',
        cameraUnavailable: 'Não foi possível aceder à câmera. Verifique as permissões e tente novamente.',
      },
    },
    offlineBanner: {
      offlineTitle: 'Sem conexão',
      offlinePending: '{{count}} item(s) em espera de sincronização',
      offlineReady: 'Funcionando offline',
      closeLabel: 'Fechar',
      syncing: 'Sincronizando dados...',
      pendingCount: '{{count}} pendente(s)',
      success: 'Dados sincronizados com sucesso',
      errorTitle: 'Erro na sincronização',
      errorSubtitle: 'Tentaremos novamente quando possível',
    },
  },
  en: {
    language: {
      portuguese: 'Portuguese',
      english: 'English',
      tooltip: 'Change language',
    },
    common: {
      continue: 'Continue',
      start: 'Start',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      now: 'Now',
      later: 'Later',
      ml: 'ml',
      yes: 'Yes',
      no: 'No',
      active: 'Active',
      loading: 'Loading...',
      unknownError: 'Unknown error',
    },
    onboarding: {
      step1: {
        title: "Let's get started.",
        description: 'We need a few details to build your personalized nutrition plan.',
        nameLabel: "What's your name?",
        namePlaceholder: 'e.g. Alex',
        genderLabel: 'Gender',
      },
      gender: {
        male: 'Male',
        female: 'Female',
      },
      step2: {
        title: 'Your stats',
        description: 'Accurate numbers help us calculate your calorie needs.',
      },
      sliders: {
        age: { label: 'Age', unit: 'years' },
        height: { label: 'Height', unit: 'cm' },
        weight: { label: 'Weight', unit: 'kg' },
      },
      step3: {
        title: 'Body type',
        description: 'Select the option that best matches your natural physique.',
        ectomorphTitle: 'Ectomorph',
        ectomorphDesc: 'Lean frame, fast metabolism, hard to gain weight.',
        mesomorphTitle: 'Mesomorph',
        mesomorphDesc: 'Athletic build, gains muscle easily.',
        endomorphTitle: 'Endomorph',
        endomorphDesc: 'Broader build, slower metabolism, stores fat easily.',
      },
      step4: {
        title: 'Your goal',
        description: 'What do you want to achieve?',
        activityLabel: 'Activity level',
      },
      goals: {
        lose: 'Lose fat',
        gain: 'Build muscle',
        maintain: 'Maintain weight',
        recomp: 'Body recomposition',
      },
      activity: {
        sedentary: 'Sedentary',
        light: 'Light',
        moderate: 'Moderate',
        intense: 'Intense',
        veryIntense: 'Very intense',
      },
      actions: {
        continue: 'Continue',
        start: 'Start my plan',
      },
    },
    dashboard: {
      loadingProfile: 'Processing your profile...',
      welcomeBack: 'Welcome back,',
      caloriesAvailable: 'Available calories',
      caloriesGoal: 'of {{goal}} kcal target',
      consumed: 'Consumed',
      remaining: 'Remaining',
      macros: {
        protein: 'Protein',
        carbs: 'Carbs',
        fats: 'Fat',
      },
      hydration: {
        title: 'Hydration',
        goal: 'Goal: {{goal}}ml',
        addWater: '+ {{amount}}ml',
      },
      meals: {
        recent: 'Recent meals',
        last24h: 'Last 24h',
        viewHistory: 'View history',
        emptyTitle: 'No meals logged today.',
        emptySubtitle: 'Tap the scanner to start tracking!',
      },
      chart: {
        kcal: 'kcal',
      },
    },
    history: {
      title: 'Daily history',
      clear: 'Clear history',
      clearConfirm: 'Clear your entire history? This action cannot be undone.',
      empty: 'Nothing archived yet.',
      mealsAndWater: '{{meals}} meal(s) • {{water}} ml',
      viewDetails: 'View details',
      hideDetails: 'Hide',
      remove: 'Remove',
      removeConfirm: 'Remove this day from history?',
      macros: '{{protein}}g P • {{carbs}}g C • {{fats}}g F',
    },
    hydrationToggle: {
      on: 'On',
      off: 'Off',
      titleOn: 'Hydration reminders enabled',
      titleOff: 'Hydration reminders disabled',
    },
    hydrationReminder: {
      title: 'Hydration time — NutriScan',
      body: 'Take a break: drink a glass of water now 💧',
    },
    hydrationNotification: {
      title: 'Time to hydrate',
      subtitle: 'Your health relies on great hydration',
      message: 'Take a pause and drink a glass of water now 💧',
      tip1: 'Staying hydrated boosts your metabolism',
      tip2: 'Aim for 8-10 glasses of water per day',
      tip3: 'Water is essential for burning calories',
      dismiss: 'Not now',
      confirm: "I'm drinking!",
      autoDismiss: 'This alert closes automatically in 8 seconds',
    },
    chat: {
      headerTitle: 'NutriCoach AI',
      status: 'Active',
      greeting: 'Hi, {{name}}!',
      intro: 'I am here to help you with your diet, workout routine, or nutrition questions.',
      placeholder: 'Ask me anything...',
      emptySuggestions: {
        breakfast: 'What should I eat for breakfast?',
        protein: 'How much protein do I need?',
        carbCycling: 'Explain carb cycling',
      },
      sources: 'Sources',
    },
    scanner: {
      headerTitle: 'Image analyzer',
      captureTitle: ' ',
      captureSubtitle: ' ',
      importTitle: 'choose an image',
      importSubtitle: 'Select an image from your device',
      processing: {
        title: 'Processing image...',
        description: 'Compressing and preparing for analysis',
      },
      analyzing: {
        title: 'Analyzing your food...',
        description: 'Identifying macronutrients and calories',
      },
      confidence: 'Confidence:',
      lowConfidenceTitle: 'Low confidence in this estimate',
      lowConfidenceMessage: 'If the values look off, adjust manually or re-run with a higher quality photo.',
      nutrients: {
        calories: 'Calories',
        protein: 'Protein',
        carbs: 'Carbs',
        fats: 'Fat',
      },
      actions: {
        retake: 'Scan again',
        reanalyze: 'Re-analyze',
        add: 'Add to log',
        listen: 'Listen to results',
        capture: 'Capture photo',        import: 'Choose image',      },
      errors: {
        invalidFormat: 'Invalid format. Please pick an image.',
        tooLarge: 'Image is too large. Try a smaller photo (max 5MB).',
        fileTooLarge: 'File is too large. Maximum allowed: {{maxSize}}.',
        fileImportFailed: 'Failed to import file. Please try again.',
        processingFailed: 'Could not process: {{message}}. Try another photo or a smaller resolution.',
        generic: 'We could not process the image. Try again.',
        analyzeFailed: 'We could not analyze the image. Try a smaller or sharper photo.',
        reanalyzeFailed: 'Re-analysis failed. Try another photo or a higher quality one.',
        reanalyzeLoadFailed: 'Could not load the image for re-analysis.',
        cameraUnavailable: 'Unable to access the camera. Check permissions and try again.',
      },
    },
    offlineBanner: {
      offlineTitle: 'No connection',
      offlinePending: '{{count}} item(s) waiting to sync',
      offlineReady: 'Working offline',
      closeLabel: 'Close',
      syncing: 'Syncing data...',
      pendingCount: '{{count}} pending',
      success: 'Data synced successfully',
      errorTitle: 'Sync error',
      errorSubtitle: 'We will try again soon',
    },
  },
};

const fallbackLocale: Locale = 'en';

const getMessage = (locale: Locale, key: string): string | undefined => {
  const resolve = (lang: Locale): string | undefined => {
    const segments = key.split('.');
    let current: TranslationTree | string | undefined = translations[lang];

    for (const segment of segments) {
      if (typeof current !== 'object') {
        return undefined;
      }
      current = current[segment];
      if (typeof current === 'undefined') {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  };

  return resolve(locale) ?? resolve(fallbackLocale);
};

const formatTemplate = (template: string, params?: TemplateParams) => {
  if (!params) return template;
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
  }, template);
};

export const useTranslation = () => {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  const t = useCallback(
    (key: string, params?: TemplateParams) => {
      const message = getMessage(locale, key);
      if (!message) {
        console.warn(`Missing translation for key "${key}" in locale ${locale}`);
        return key;
      }
      return formatTemplate(message, params);
    },
    [locale]
  );

  return { t, locale, setLocale, availableLocales: AVAILABLE_LOCALES, defaultLocale: DEFAULT_LOCALE };
};

export const formatLocaleDate = (value: number, locale: Locale, options?: Intl.DateTimeFormatOptions) => {
  const language = locale === 'pt' ? 'pt-PT' : 'en-US';
  return new Date(value).toLocaleDateString(language, options);
};

export const formatLocaleTime = (value: number, locale: Locale, options?: Intl.DateTimeFormatOptions) => {
  const language = locale === 'pt' ? 'pt-PT' : 'en-US';
  return new Date(value).toLocaleTimeString(language, options);
};
