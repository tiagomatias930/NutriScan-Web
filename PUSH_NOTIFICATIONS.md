# Web Push Notifications - NutriScan

## 📋 Visão Geral

Implementação completa de **Web Push Notifications** para a aplicação NutriScan. As notificações funcionam mesmo quando o aplicativo não está em execução no navegador.

## 🚀 Como Funciona

### 1. **Service Worker**
- Registrado em `public/sw.js`
- Gerencia cache offline e push notifications
- Escuta eventos de `push` e `notificationclick`

### 2. **Permissões**
- O usuário é solicitado uma vez ao iniciar o app
- Confirmação para enviar notificações
- Pode ser habilitado/desabilitado nas configurações

### 3. **Notificações de Hidratação**
- Aparecem a cada 2 horas
- Funcionam com ou sem o app aberto
- Notificações visuais + som + vibração

## 🛠️ Estrutura

```
components/
├── PushNotificationInitializer.tsx    # Inicializa o serviço (no App.tsx)
├── HydrationReminder.tsx               # Lógica de lembretes (usa pushNotificationService)
└── HydrationNotification.tsx           # UI para notificações no app

services/
└── pushNotificationService.ts          # Classe central que gerencia Push Notifications

public/
└── sw.js                               # Service Worker com listeners de push
```

## 📱 Uso

### Usar Notificações Simples (No App)
```typescript
import { pushNotificationService } from '../services/pushNotificationService';

await pushNotificationService.showLocalNotification({
  title: 'Hora de Hidratar',
  body: 'Beba um copo de água',
  tag: 'hydration-reminder',
  icon: '/iconApp.png',
  vibrate: [200, 100, 200],
  requireInteraction: true
});
```

### Verificar Suporte
```typescript
const isSupported = pushNotificationService.isNotificationSupported();
const isEnabled = pushNotificationService.isNotificationEnabled();
```

### Inicializar Serviço
```typescript
await pushNotificationService.init();
const permission = await pushNotificationService.requestPermission();
```

## 🔧 Configuração Backend (Opcional)

Para enviar notificações via servidor (VAPID), configure:

### 1. Gerar VAPID Keys
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 2. Backend Node.js
```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:seu-email@example.com',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
);

// Enviar notificação
webpush.sendNotification(subscription, JSON.stringify({
  title: 'Notificação',
  body: 'Conteúdo',
  // ... mais opções
}));
```

### 3. Inscrever Usuário
```typescript
const subscription = await pushNotificationService.subscribeToPush(vapidPublicKey);
// Enviar subscription para o backend para salvar
```

## 🎨 Recursos

✅ Notificações mesmo com app fechado  
✅ Som e vibração personalizáveis  
✅ Interação com cliques na notificação  
✅ Auto-dismiss ou interação contínua  
✅ Fallback para notificações no-app  
✅ Suporte a múltiplas notificações  
✅ Gerenciamento de permissões  

## 📝 Notas Importantes

1. **HTTPS Obrigatório**: Push Notifications só funcionam em HTTPS (exceto localhost)
2. **Permissão Única**: O navegador pede permissão uma única vez
3. **Service Worker**: Deve estar em escopo raiz (`/sw.js`)
4. **Cache**: Primeiro carregamento pode precisar refresh (cache do SW)

## 🧪 Teste Local

```bash
# 1. Build do projeto
npm run build

# 2. Serve com HTTPS ou localhost
# O navegador permite em localhost

# 3. Abra o DevTools (F12) → Application → Service Workers
# Você deve ver o SW registrado

# 4. Teste notificações no console:
pushNotificationService.showLocalNotification({
  title: 'Teste',
  body: 'Teste de notificação'
})
```

## 🐛 Troubleshooting

### Notificações não aparecem
- Verificar se permissão foi concedida
- Ver console para erros
- Confirmar Service Worker registrado

### Service Worker não registra
- Verificar se `sw.js` está acessível em `/public/`
- Usar HTTPS ou localhost
- Limpar cache do navegador

### Permissão bloqueada
- Site deve estar em HTTPS
- Usuário bloqueou em configurações do navegador
- Resetar permissões (chrome://settings/content/notifications)

## 📚 Referências

- [MDN - Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev - Push Notifications](https://web.dev/push-notifications-overview/)
