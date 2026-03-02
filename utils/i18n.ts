import { useCallback } from 'react';
import { useAppStore } from '../store';
import { Locale, AVAILABLE_LOCALES, DEFAULT_LOCALE } from './localization';

type TemplateParams = Record<string, string | number>;

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

type Translations = Record<Locale, TranslationTree>;

const translations: Translations = {
  zh: {
    language: {
      portuguese: '葡萄牙语',
      english: '英语',
      mandarin: '普通话',
      french: '法语',
      tooltip: '更改语言',
    },
    common: {
      continue: '继续',
      start: '开始',
      close: '关闭',
      cancel: '取消',
      confirm: '确认',
      now: '现在',
      later: '稍后',
      ml: 'ml',
      yes: '是',
      no: '否',
      active: '活跃',
      loading: '加载中...',
      unknownError: '未知错误',
    },
    navigation: {
      home: '主页',
      scan: '扫描',
      chat: '聊天',
      about: '关于',
    },
    onboarding: {
      step1: {
        title: '让我们开始吧。',
        description: '我们需要一些细节来建立您的个性化营养计划。',
        nameLabel: '你叫什么名字？',
        namePlaceholder: '例如：Alex',
        genderLabel: '性别',
      },
      gender: {
        male: '男性',
        female: '女性',
      },
      step2: {
        title: '您的统计数据',
        description: '准确的数字可以帮助我们计算您的卡路里需求。',
      },
      sliders: {
        age: { label: '年龄', unit: '岁' },
        height: { label: '身高', unit: '厘米' },
        weight: { label: '体重', unit: '公斤' },
      },
      step3: {
        title: '体型',
        description: '选择最适合您自然体型的选项。',
        ectomorphTitle: '外胚层型',
        ectomorphDesc: '瘦长型，新陈代谢快，难以增重。',
        mesomorphTitle: '中胚层型',
        mesomorphDesc: '运动型，容易增长肌肉。',
        endomorphTitle: '内胚层型',
        endomorphDesc: '健壮型，新陈代谢较慢，容易储存脂肪。',
      },
      step4: {
        title: '您的目标',
        description: '你想实现什么？',
        activityLabel: '活动水平',
      },
      goals: {
        lose: '减脂',
        gain: '增肌',
        maintain: '保持体重',
        recomp: '身体重组',
      },
      activity: {
        sedentary: '久坐',
        light: '轻度',
        moderate: '中度',
        intense: '剧烈',
        veryIntense: '非常剧烈',
      },
      actions: {
        continue: '继续',
        start: '开始我的计划',
      },
    },
    dashboard: {
      loadingProfile: '正在处理您的个人资料...',
      welcomeBack: '欢迎回来，',
      caloriesAvailable: '可用卡路里',
      caloriesGoal: '目标 {{goal}} 大卡',
      consumed: '已消耗',
      remaining: '剩余',
      macros: {
        protein: '蛋白质',
        carbs: '碳水化合物',
        fats: '脂肪',
      },
      hydration: {
        title: '水分补充',
        goal: '目标：{{goal}}ml',
        addWater: '+ {{amount}}ml',
      },
      meals: {
        recent: '最近的饭菜',
        last24h: '过去24小时',
        viewHistory: '查看历史',
        emptyTitle: '今天没有记录任何饭菜。',
        emptySubtitle: '点击扫描仪开始跟踪！',
      },
      chart: {
        kcal: '大卡',
      },
    },
    history: {
      title: '每日历史',
      clear: '清除历史',
      clearConfirm: '清除您的全部历史？此操作无法撤消。',
      empty: '还没有存档任何内容。',
      mealsAndWater: '{{meals}} 顿饭 • {{water}} ml',
      viewDetails: '查看详情',
      hideDetails: '隐藏',
      remove: '删除',
      removeConfirm: '从历史记录中删除这一天？',
      macros: '{{protein}}g 蛋 • {{carbs}}g 碳 • {{fats}}g 脂',
    },
    hydrationToggle: {
      on: '开启',
      off: '关闭',
      titleOn: '补水提醒已启用',
      titleOff: '补水提醒已禁用',
    },
    hydrationReminder: {
      title: '补水时间 — NutriScan',
      body: '休息一下：现在喝一杯水 💧',
    },
    hydrationNotification: {
      title: '是时候补水了',
      subtitle: '您的健康取决于充足的补水',
      message: '暂停一下，现在喝一杯水 💧',
      tip1: '保持水分可以促进新陈代谢',
      tip2: '每天喝8-10杯水',
      tip3: '水对燃烧卡路里至关重要',
      dismiss: '现在不',
      confirm: '我在喝！',
      autoDismiss: '此警报将在 8 秒后自动关闭',
    },
    chat: {
      headerTitle: 'NutriCoach AI',
      status: '活跃',
      greeting: '你好，{{name}}！',
      intro: '我在这里帮助您解决饮食、锻炼计划或营养问题。',
      placeholder: '问我任何事情...',
      emptySuggestions: {
        breakfast: '我早餐吃什么？',
        protein: '我需要多少蛋白质？',
        carbCycling: '解释碳循环',
      },
      sources: '来源',
    },
    scanner: {
      headerTitle: '图像分析仪',
      captureTitle: ' ',
      captureSubtitle: ' ',
      importTitle: '选择一个图像',
      importSubtitle: '从您的设备中选择一个图像',
      processing: {
        title: '正在处理图像...',
        description: '压缩并准备进行分析',
      },
      analyzing: {
        title: '分析您的食物...',
        description: '识别宏营养素和卡路里',
      },
      confidence: '信心：',
      lowConfidenceTitle: '对此估计的信心低',
      lowConfidenceMessage: '如果数值看起来不对，请手动调整或使用更高质量的照片重新运行。',
      nutrients: {
        calories: '卡路里',
        protein: '蛋白质',
        carbs: '碳水化合物',
        fats: '脂肪',
      },
      actions: {
        retake: '重新扫描',
        reanalyze: '重新分析',
        add: '添加到日志',
        listen: '收听结果',
        capture: '拍照',
        import: '选择图像',
      },
      errors: {
        invalidFormat: '格式无效。请选择一个图像。',
        tooLarge: '图像太大。尝试较小的照片（最大 5MB）。',
        fileTooLarge: '文件太大。允许的最大值：{{maxSize}}。',
        fileImportFailed: '导入文件失败。请重试。',
        processingFailed: '无法处理：{{message}}。尝试另一张照片或更小的分辨率。',
        generic: '我们无法处理该图像。请重试。',
        analyzeFailed: '我们无法分析图像。尝试更小或更清晰的照片。',
        analyzeTimeout: '分析超时。请重试。',
        reanalyzeFailed: '重新分析失败。尝试另一张照片或质量更高的照片。',
        reanalyzeLoadFailed: '无法加载图像以进行重新分析。',
        cameraUnavailable: '无法访问相机。检查权限并重试。',
        cameraAccessDenied: '无法访问相机。检查权限并重试。',
        cameraPermissionDenied: '相机权限被拒绝。请在设置中启用。',
        cameraNotFound: '未找到相机。检查您的设备。',
      },
    },
    about: {
      title: '关于',
      appTitle: '关于 NutriScan',
      appDescription: 'NutriScan 是一款先进的营养追踪应用，利用人工智能技术帮助您实现健康目标。通过拍摄食物照片，应用会自动识别营养成分并计算卡路里，同时提供个性化的营养建议。',
      features: '主要功能',
      feature1: '使用人工智能的食物识别和营养分析',
      feature2: '个性化的宏营养目标和每日跟踪',
      feature3: '与 NutriCoach AI 助手进行交互式营养指导',
      feature4: '每日水合作用提醒和历史记录管理',
      developerTitle: '关于开发者',
      developerDescription: '该应用由才华横溢的开发者设计和开发，致力于创建帮助人们过上更健康生活的工具。',
      visitPortfolio: '访问投资组合',
      copyright: 'NutriScan - 所有权利保留',
    },
    offlineBanner: {
      offlineTitle: '无连接',
      offlinePending: '{{count}} 项目等待同步',
      offlineReady: '离线工作',
      closeLabel: '关闭',
      syncing: '正在同步数据...',
      pendingCount: '{{count}} 待定',
      success: '数据同步成功',
      errorTitle: '同步错误',
      errorSubtitle: '我们将很快重试',
    },
    login: {
      subtitle: '您的AI驱动营养追踪器。登录以将您的数据与Google Fit同步。',
      googleButton: '使用Google登录',
      googleFitInfo: '连接Google Fit以同步您的营养数据',
      terms: '登录即表示您同意我们的服务条款和隐私政策。',
      signOut: '退出登录',
    },
  },
  fr: {
    language: {
      portuguese: 'Portugais',
      english: 'Anglais',
      mandarin: 'Mandarin',
      french: 'Français',
      tooltip: 'Changer la langue',
    },
    common: {
      continue: 'Continuer',
      start: 'Commencer',
      close: 'Fermer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      now: 'Maintenant',
      later: 'Plus tard',
      ml: 'ml',
      yes: 'Oui',
      no: 'Non',
      active: 'Actif',
      loading: 'Chargement...',
      unknownError: 'Erreur inconnue',
    },
    navigation: {
      home: 'Accueil',
      scan: 'Scanner',
      chat: 'Chat',
      about: 'À propos',
    },
    onboarding: {
      step1: {
        title: 'Commençons.',
        description: 'Nous avons besoin de quelques détails pour créer votre plan nutritionnel personnalisé.',
        nameLabel: 'Quel est votre nom ?',
        namePlaceholder: 'ex. : Alex',
        genderLabel: 'Sexe',
      },
      gender: {
        male: 'Homme',
        female: 'Femme',
      },
      step2: {
        title: 'Vos statistiques',
        description: 'Des chiffres précis nous aident à calculer vos besoins caloriques.',
      },
      sliders: {
        age: { label: 'Âge', unit: 'ans' },
        height: { label: 'Taille', unit: 'cm' },
        weight: { label: 'Poids', unit: 'kg' },
      },
      step3: {
        title: 'Type de corps',
        description: 'Sélectionnez l\'option qui correspond le mieux à votre morphologie naturelle.',
        ectomorphTitle: 'Ectomorphe',
        ectomorphDesc: 'Silhouette mince, métabolisme rapide, difficile de prendre du poids.',
        mesomorphTitle: 'Mésomorphe',
        mesomorphDesc: 'Silhouette athlétique, gagne facilement du muscle.',
        endomorphTitle: 'Endomorphe',
        endomorphDesc: 'Silhouette robuste, métabolisme plus lent, accumule facilement de la graisse.',
      },
      step4: {
        title: 'Votre objectif',
        description: 'Qu\'est-ce que vous aimeriez accomplir ?',
        activityLabel: 'Niveau d\'activité',
      },
      goals: {
        lose: 'Perdre du poids',
        gain: 'Prendre du muscle',
        maintain: 'Maintenir le poids',
        recomp: 'Recomposition corporelle',
      },
      activity: {
        sedentary: 'Sédentaire',
        light: 'Léger',
        moderate: 'Modéré',
        intense: 'Intense',
        veryIntense: 'Très intense',
      },
      actions: {
        continue: 'Continuer',
        start: 'Commencer mon plan',
      },
    },
    dashboard: {
      loadingProfile: 'Traitement de votre profil...',
      welcomeBack: 'Bienvenue,',
      caloriesAvailable: 'Calories disponibles',
      caloriesGoal: 'sur {{goal}} kcal objectif',
      consumed: 'Consommé',
      remaining: 'Restant',
      macros: {
        protein: 'Protéine',
        carbs: 'Glucides',
        fats: 'Graisse',
      },
      hydration: {
        title: 'Hydratation',
        goal: 'Objectif : {{goal}}ml',
        addWater: '+ {{amount}}ml',
      },
      meals: {
        recent: 'Repas récents',
        last24h: 'Dernières 24h',
        viewHistory: 'Voir l\'historique',
        emptyTitle: 'Aucun repas enregistré aujourd\'hui.',
        emptySubtitle: 'Appuyez sur le scanner pour commencer à suivre !',
      },
      chart: {
        kcal: 'kcal',
      },
    },
    history: {
      title: 'Historique quotidien',
      clear: 'Effacer l\'historique',
      clearConfirm: 'Effacer tout votre historique ? Cette action est irréversible.',
      empty: 'Rien d\'archivé pour le moment.',
      mealsAndWater: '{{meals}} repas • {{water}} ml',
      viewDetails: 'Voir les détails',
      hideDetails: 'Masquer',
      remove: 'Supprimer',
      removeConfirm: 'Supprimer ce jour de l\'historique ?',
      macros: '{{protein}}g P • {{carbs}}g G • {{fats}}g L',
    },
    hydrationToggle: {
      on: 'Actif',
      off: 'Inactif',
      titleOn: 'Rappels d\'hydratation activés',
      titleOff: 'Rappels d\'hydratation désactivés',
    },
    hydrationReminder: {
      title: 'Temps d\'hydratation — NutriScan',
      body: 'Prenez une pause : buvez un verre d\'eau maintenant 💧',
    },
    hydrationNotification: {
      title: 'Il est temps de s\'hydrater',
      subtitle: 'Votre santé dépend d\'une bonne hydratation',
      message: 'Prenez une pause et buvez un verre d\'eau maintenant 💧',
      tip1: 'Rester hydraté améliore votre métabolisme',
      tip2: 'Buvez 8 à 10 verres d\'eau par jour',
      tip3: 'L\'eau est essentielle pour brûler des calories',
      dismiss: 'Pas maintenant',
      confirm: 'Je bois !',
      autoDismiss: 'Cette alerte se ferme automatiquement dans 8 secondes',
    },
    chat: {
      headerTitle: 'NutriCoach AI',
      status: 'Actif',
      greeting: 'Bonjour, {{name}} !',
      intro: 'Je suis là pour vous aider avec votre régime, votre routine d\'entraînement ou vos questions nutritionnelles.',
      placeholder: 'Demandez-moi n\'importe quoi...',
      emptySuggestions: {
        breakfast: 'Que dois-je manger au petit-déjeuner ?',
        protein: 'De combien de protéines ai-je besoin ?',
        carbCycling: 'Expliquez le cyclage des glucides',
      },
      sources: 'Sources',
    },
    scanner: {
      headerTitle: 'Analyseur d\'images',
      captureTitle: ' ',
      captureSubtitle: ' ',
      importTitle: 'Choisir une image',
      importSubtitle: 'Sélectionnez une image de votre appareil',
      processing: {
        title: 'Traitement de l\'image...',
        description: 'Compression et préparation pour analyse',
      },
      analyzing: {
        title: 'Analyse de votre nourriture...',
        description: 'Identification des macronutriments et des calories',
      },
      confidence: 'Confiance :',
      lowConfidenceTitle: 'Faible confiance dans cette estimation',
      lowConfidenceMessage: 'Si les valeurs vous semblent incorrectes, ajustez-les manuellement ou réanalysez avec une photo de meilleure qualité.',
      nutrients: {
        calories: 'Calories',
        protein: 'Protéine',
        carbs: 'Glucides',
        fats: 'Graisse',
      },
      actions: {
        retake: 'Rescanner',
        reanalyze: 'Réanalyser',
        add: 'Ajouter au journal',
        listen: 'Écouter les résultats',
        capture: 'Prendre une photo',
        import: 'Choisir une image',
      },
      errors: {
        invalidFormat: 'Format invalide. Veuillez sélectionner une image.',
        tooLarge: 'L\'image est trop grande. Essayez une photo plus petite (max 5 Mo).',
        fileTooLarge: 'Le fichier est trop volumineux. Maximum autorisé : {{maxSize}}.',
        fileImportFailed: 'Échec de l\'importation du fichier. Veuillez réessayer.',
        processingFailed: 'Impossible de traiter : {{message}}. Essayez une autre photo ou une résolution inférieure.',
        generic: 'Impossible de traiter l\'image. Veuillez réessayer.',
        analyzeFailed: 'Impossible d\'analyser l\'image. Essayez une photo plus petite ou plus nette.',
        analyzeTimeout: 'L\'analyse a expiré. Veuillez réessayer.',
        reanalyzeFailed: 'La réanalyse a échoué. Essayez une autre photo ou une photo de meilleure qualité.',
        reanalyzeLoadFailed: 'Impossible de charger l\'image pour la réanalyse.',
        cameraUnavailable: 'Impossible d\'accéder à la caméra. Vérifiez les autorisations et réessayez.',
        cameraAccessDenied: 'Impossible d\'accéder à la caméra. Vérifiez les autorisations et réessayez.',
        cameraPermissionDenied: 'Permission de caméra refusée. Veuillez l\'activer dans les paramètres.',
        cameraNotFound: 'Caméra non trouvée. Vérifiez votre appareil.',
      },
    },
    about: {
      title: 'À propos',
      appTitle: 'À propos de NutriScan',
      appDescription: 'NutriScan est une application avancée de suivi nutritionnel qui utilise l\'intelligence artificielle pour vous aider à atteindre vos objectifs de santé. En prenant des photos de vos aliments, l\'application identifie automatiquement les nutriments et calcule les calories, tout en fournissant des recommandations nutritionnelles personnalisées.',
      features: 'Caractéristiques principales',
      feature1: 'Reconnaissance et analyse nutritionnelle des aliments basées sur l\'IA',
      feature2: 'Objectifs macronutriments personnalisés et suivi quotidien',
      feature3: 'Conseils nutritionnels interactifs avec l\'assistant NutriCoach AI',
      feature4: 'Rappels d\'hydratation quotidiens et gestion historique',
      developerTitle: 'À propos du développeur',
      developerDescription: 'Cette application a été conçue et développée par Tiago Matias, un développeur talentueux dédié à la création d\'outils pour aider les gens à vivre une vie plus saine.',
      visitPortfolio: 'Visiter le portefeuille',
      copyright: 'NutriScan - Tous droits réservés',
    },
    offlineBanner: {
      offlineTitle: 'Pas de connexion',
      offlinePending: '{{count}} article(s) en attente de synchronisation',
      offlineReady: 'Fonctionnement hors ligne',
      closeLabel: 'Fermer',
      syncing: 'Synchronisation des données...',
      pendingCount: '{{count}} en attente',
      success: 'Données synchronisées avec succès',
      errorTitle: 'Erreur de synchronisation',
      errorSubtitle: 'Nous réessayerons bientôt',
    },
    login: {
      subtitle: 'Votre suivi nutritionnel alimenté par l\'IA. Connectez-vous pour synchroniser vos données avec Google Fit.',
      googleButton: 'Se connecter avec Google',
      googleFitInfo: 'Connectez Google Fit pour synchroniser vos données nutritionnelles',
      terms: 'En vous connectant, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.',
      signOut: 'Se déconnecter',
    },
  },
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
    navigation: {
      home: 'Início',
      scan: 'Escanear',
      chat: 'Chat',
      about: 'Sobre',
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
        analyzeFailed: 'Erro ao analisar. Escolha uma foto mais nítida e com menor tamanho.',
        analyzeTimeout: 'Análise expirou. Por favor, tente novamente.',
        reanalyzeFailed: 'Reanálise falhou. Tente outra foto ou usar uma de maior qualidade.',
        reanalyzeLoadFailed: 'Erro ao carregar imagem para reanálise.',
        cameraUnavailable: 'Não foi possível aceder à câmera. Verifique as permissões e tente novamente.',
        cameraAccessDenied: 'Não foi possível aceder à câmera. Verifique as permissões e tente novamente.',
        cameraPermissionDenied: 'Permissão da câmera negada. Por favor, ative nas configurações.',
        cameraNotFound: 'Câmera não encontrada. Verifique seu dispositivo.',
        notFood: 'A imagem não contém comida identificável. Tente novamente com uma foto clara de comida.',
      },
    },
    about: {
      title: 'Sobre',
      appTitle: 'Sobre o NutriScan',
      appDescription: 'NutriScan é um aplicativo avançado de rastreamento nutricional que utiliza inteligência artificial para ajudá-lo a atingir seus objetivos de saúde. Ao fotografar seus alimentos, o aplicativo identifica automaticamente os nutrientes e calcula as calorias, além de fornecer recomendações nutricionais personalizadas.',
      features: 'Principais funcionalidades',
      feature1: 'Reconhecimento e análise nutricional de alimentos com IA',
      feature2: 'Objetivos de macronutrientes personalizados e rastreamento diário',
      feature3: 'Orientação nutricional interativa com o assistente NutriCoach AI',
      feature4: 'Lembretes diários de hidratação e gerenciamento de histórico',
      developerTitle: 'Sobre o desenvolvedor',
      developerDescription: 'Este aplicativo foi projetado e desenvolvido por Tiago Matias, um desenvolvedor talentoso dedicado a criar ferramentas para ajudar as pessoas a viverem uma vida mais saudável.',
      visitPortfolio: 'Visitar portfólio',
      copyright: 'NutriScan - Todos os direitos reservados',
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
    login: {
      subtitle: 'O seu rastreador nutricional com IA. Faça login para sincronizar os seus dados com o Google Fit.',
      googleButton: 'Entrar com Google',
      googleFitInfo: 'Conecte o Google Fit para sincronizar os seus dados nutricionais',
      terms: 'Ao fazer login, você concorda com os nossos Termos de Serviço e Política de Privacidade.',
      signOut: 'Sair',
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
    navigation: {
      home: 'Home',
      scan: 'Scan',
      chat: 'Chat',
      about: 'About',
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
        analyzeTimeout: 'Analysis timed out. Please try again.',
        reanalyzeFailed: 'Re-analysis failed. Try another photo or a higher quality one.',
        reanalyzeLoadFailed: 'Could not load the image for re-analysis.',
        cameraUnavailable: 'Unable to access the camera. Check permissions and try again.',
        cameraAccessDenied: 'Unable to access the camera. Check permissions and try again.',
        cameraPermissionDenied: 'Camera permission denied. Please enable it in settings.',
        cameraNotFound: 'Camera not found. Check your device.',
        notFood: 'The image does not contain identifiable food. Please try again with a clear food image.',
      },
    },
    about: {
      title: 'About',
      appTitle: 'About NutriScan',
      appDescription: 'NutriScan is an advanced nutrition tracking application that uses artificial intelligence to help you achieve your health goals. By taking photos of your food, the app automatically identifies nutrients and calculates calories while providing personalized nutritional recommendations.',
      features: 'Key Features',
      feature1: 'AI-powered food recognition and nutritional analysis',
      feature2: 'Personalized macronutrient targets and daily tracking',
      feature3: 'Interactive nutritional guidance with NutriCoach AI assistant',
      feature4: 'Daily hydration reminders and history management',
      developerTitle: 'About the Developer',
      developerDescription: 'This application was designed and developed by Tiago Matias, a talented developer dedicated to creating tools that help people live healthier lives.',
      visitPortfolio: 'Visit Portfolio',
      copyright: 'NutriScan - All Rights Reserved',
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
    login: {
      subtitle: 'Your AI-powered nutrition tracker. Sign in to sync your data with Google Fit.',
      googleButton: 'Sign in with Google',
      googleFitInfo: 'Connect Google Fit to sync your nutritional data',
      terms: 'By signing in, you agree to our Terms of Service and Privacy Policy.',
      signOut: 'Sign out',
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
  const languageMap: Record<Locale, string> = {
    'pt': 'pt-PT',
    'en': 'en-US',
    'zh': 'zh-CN',
    'fr': 'fr-FR',
  };
  return new Date(value).toLocaleDateString(languageMap[locale], options);
};

export const formatLocaleTime = (value: number, locale: Locale, options?: Intl.DateTimeFormatOptions) => {
  const languageMap: Record<Locale, string> = {
    'pt': 'pt-PT',
    'en': 'en-US',
    'zh': 'zh-CN',
    'fr': 'fr-FR',
  };
  return new Date(value).toLocaleTimeString(languageMap[locale], options);
};
