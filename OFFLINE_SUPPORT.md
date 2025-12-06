# Suporte Offline - NutriScan PWA

## 📋 Visão Geral

Implementação completa de suporte offline permitindo que o aplicativo NutriScan funcione totalmente sem conexão de rede. Os dados são sincronizados automaticamente quando o usuário volta online.

## 🏗️ Arquitetura

### 1. **Service Worker Inteligente** (`public/sw.js`)

Implementa três estratégias de cache:

#### **Cache-first** (Assets estáticos)
- ✅ HTML, CSS, JavaScript
- ✅ Imagens
- ✅ Fonts
- **Comportamento**: Tenta cache primeiro, depois rede
- **Vantagem**: Carregamento rápido offline

#### **Network-first** (APIs)
- ✅ Chamadas `/api/*`
- ✅ Dados dinâmicos
- **Comportamento**: Tenta rede primeiro, fallback para cache
- **Vantagem**: Dados sempre atualizados quando possível

#### **Background Sync**
- ✅ Sincronização de alimentos adicionados offline
- ✅ Sincronização de água consumida offline
- **Comportamento**: Automático ao reconectar

### 2. **Serviço de Status Offline** (`services/offlineStatusService.ts`)

Classe centralizada que gerencia:

- **Detecção de conectividade**
  ```typescript
  const isOnline = offlineStatusService.getOnlineStatus();
  ```

- **Monitoramento de eventos**
  ```typescript
  offlineStatusService.onStatusChange((event) => {
    console.log(event.type); // 'online' | 'offline' | 'sync-start' | 'sync-complete'
  });
  ```

- **Armazenamento offline com IndexedDB**
  ```typescript
  await offlineStatusService.storeOfflineData('food-item', { ... });
  const data = await offlineStatusService.getOfflineData();
  ```

- **Solicitação de Background Sync**
  ```typescript
  await offlineStatusService.syncPendingData();
  ```

### 3. **Hook React** (`hooks/useOfflineStatus.ts`)

Fácil integração em componentes:

```typescript
const { isOnline, pendingSyncCount, lastSyncStatus } = useOfflineStatus();

// lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error'
```

### 4. **UI de Status** (`components/OfflineStatusBanner.tsx`)

Mostra automaticamente:
- 🔴 Banner quando offline
- 🔄 Indicador durante sincronização
- ✅ Confirmação de sincronização bem-sucedida
- ⚠️ Alerta de erros de sincronização

## 🚀 Fluxo de Operação

```
App Online
  ↓
Usuário adiciona alimento
  ↓
API chamada diretamente
  ↓
Resposta em tempo real
  
---
  
App Offline
  ↓
Usuário adiciona alimento
  ↓
Dados armazenados localmente (IndexedDB)
  ↓
UI mostra "Aguardando sincronização"
  ↓
Usuário volta online
  ↓
Background Sync ativado
  ↓
Dados enviados para servidor
  ↓
UI mostra "Sincronizado ✓"
```

## 📦 Estrutura de Caches

```
├── nutriscan-cache-v1        (Pre-cache dos assets críticos)
├── nutriscan-runtime-v1      (HTML, JS, CSS em tempo real)
├── nutriscan-api-v1          (Respostas de API)
└── nutriscan-images-v1       (Imagens em cache)
```

## 💾 Armazenamento de Dados Offline

### Usando IndexedDB (Preferido)
```typescript
// Armazenar dados
await offlineStatusService.storeOfflineData('food-item-1', {
  name: 'Arroz com feijão',
  calories: 450,
  timestamp: Date.now()
});

// Recuperar dados
const foodItems = await offlineStatusService.getOfflineData('food-item-1');

// Limpar dados
await offlineStatusService.clearOfflineData('food-item-1');
```

### Estrutura no IndexedDB
```javascript
{
  id: 1,
  key: 'food-item-1',
  data: { ... },
  timestamp: 1733446800000
}
```

## 🔄 Background Sync

### Como Funciona
1. User adiciona alimento offline
2. Dados salvos em IndexedDB
3. Ao voltar online, Service Worker ativa sync
4. Dados enviados para `/api/sync/food`
5. UI confirma sucesso

### Handlers no Backend
```javascript
// POST /api/sync/food
// POST /api/sync/water
```

### Recuperar Dados Pendentes
```typescript
const pending = offlineStatusService.getPendingSync();
console.log(pending); // ['food', 'water']
```

## 🛠️ Uso em Componentes

### Exemplo: Mostrar Status
```tsx
import { useOfflineStatus } from '../hooks/useOfflineStatus';

function MyComponent() {
  const { isOnline, pendingSyncCount } = useOfflineStatus();

  return (
    <div>
      {isOnline ? (
        <p>✓ Online</p>
      ) : (
        <p>⚠ Offline ({pendingSyncCount} itens em espera)</p>
      )}
    </div>
  );
}
```

### Exemplo: Armazenar Dados Offline
```tsx
import { offlineStatusService } from '../services/offlineStatusService';

async function addFoodOffline(food) {
  if (!navigator.onLine) {
    await offlineStatusService.storeOfflineData('food', food);
    offlineStatusService.addPendingSync('food');
  }
}
```

## 📊 Monitoramento de Status

```tsx
const unsubscribe = offlineStatusService.onStatusChange((event) => {
  if (event.type === 'offline') {
    console.log('🔴 Ficou offline');
  } else if (event.type === 'online') {
    console.log('🟢 Voltou online');
  } else if (event.type === 'sync-start') {
    console.log('🔄 Sincronização iniciada');
  } else if (event.type === 'sync-complete') {
    console.log('✅ Sincronização concluída');
  } else if (event.type === 'sync-error') {
    console.log('❌ Erro na sincronização');
  }
});

// Remover listener quando não precisar mais
unsubscribe();
```

## 🧪 Teste Offline Local

### No Chrome DevTools
1. Abra DevTools (F12)
2. Vá em **Network**
3. Selecione **Offline** no dropdown
4. Use o app normalmente
5. Teste adicionar alimentos
6. Volte para **Online**
7. Observe sincronização automática

### Simulando Conexão Lenta
- DevTools → Network → Slow 3G
- Teste comportamento com latência

### Verificar Service Worker
- DevTools → Application → Service Workers
- Verifique status "activated and running"
- Veja logs em Console

### Verificar IndexedDB
- DevTools → Application → Storage → IndexedDB
- Veja dados armazenados
- Simule recuperação

## 📈 Performance

### Tamanhos de Cache
- Pre-cache: ~2-3 MB (assets críticos)
- Runtime cache: Dinâmico (cresce com uso)
- API cache: ~10 MB (limite inteligente)
- Imagens: ~50 MB (LRU cleanup)

### Estratégia de Limpeza
- Caches antigos removidos automaticamente
- IndexedDB limpo após sync bem-sucedido
- localStorage como fallback

## 🔒 Segurança

✅ HTTPS obrigatório (exceto localhost)  
✅ Service Worker isolado  
✅ IndexedDB isolado por domínio  
✅ CORS respeitado  

## 🐛 Troubleshooting

### Service Worker não registra
- Verificar `/public/sw.js` está acessível
- Usar HTTPS ou localhost
- Limpar cache: DevTools → Clear Storage

### Cache não atualiza
- Service Worker novo precisa ativar
- Hard refresh: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)

### Dados offline não sincronizam
- Verificar Backend `/api/sync/*` endpoints
- Ver Console para erros
- Verificar indexedDB em DevTools

### Offline não detecta corretamente
- Alguns navegadores têm delay
- Testar com DevTools Offline
- Verificar `navigator.onLine`

## 📚 Referências

- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN - Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [MDN - Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web.dev - Offline Cookbook](https://jakearchibald.com/2014/offline-cookbook/)
