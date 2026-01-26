# Supabase Integration Guide for NutriScan

## Overview

This guide explains how to set up and integrate Supabase into the NutriScan application for reliable data persistence, cross-device synchronization, and error-free operation.

## What's New

### Supabase Integration Brings:

✅ **Reliable Data Persistence**: All food logs, chat history, and user data backed up to PostgreSQL database
✅ **Cross-Device Sync**: User data synchronizes across web and mobile (Cordova/AppGyser) platforms
✅ **Offline-First Architecture**: Operations queue automatically when offline and sync when connection restored
✅ **User Authentication**: Secure email/password authentication with session management
✅ **Real-time Capabilities**: Optional real-time subscriptions for multi-device updates
✅ **Error-Free Scanner**: Robust retry mechanisms + cloud backup ensure no lost nutrition data
✅ **Cordova Compatible**: Full support for AppGyser/Cordova native apps

## Prerequisites

1. **Supabase Account**: Create one at [supabase.com](https://supabase.com)
2. **Node.js**: v18+ installed
3. **Existing NutriScan Project**: With all dependencies installed

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `nutriscan` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
4. Click "Create new project" and wait for provisioning (2-3 minutes)

### 2. Get Your Credentials

After project creation:
1. Click on your project name
2. Go to **Settings** > **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public)** key → `VITE_SUPABASE_ANON_KEY`
4. *Optional:* Save service_role key for backend operations (keep it secret!)

### 3. Configure Environment Variables

Create or update `.env` file in project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your-existing-gemini-key
```

Or copy from `.env.example`:
```bash
cp .env.example .env
```

### 4. Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy the entire SQL from `SUPABASE_SCHEMA.md` (from "Database Tables" section onwards)
4. Paste into the SQL editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for "Success" message

### 5. Enable Real-time (Optional)

For real-time sync between devices:

1. Go to **Replication** in Supabase dashboard
2. For each table you want real-time (food_logs, chat_history, hydration_logs):
   - Toggle the table on
3. These tables will now broadcast changes to subscribed clients

### 6. Install Dependencies

Install Supabase client library:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

## Integration with Existing Code

### Automatic Migration

The first time a user authenticates with Supabase:

1. System checks for existing localStorage data (`nutriscan-storage` key)
2. If found, it automatically migrates to Supabase tables
3. Old localStorage data is preserved as backup
4. Future operations use Supabase as primary storage

### Updated Services

**Three main services now support Supabase:**

#### 1. **supabaseClient.ts** (services/supabaseClient.ts)
- Initializes Supabase client
- Manages authentication storage
- Handles Cordova compatibility

#### 2. **supabaseService.ts** (services/supabaseService.ts)
- Core CRUD operations for all data types
- Automatic offline queueing
- Sync queue management
- User profile operations

#### 3. **offlineStatusService.ts** (services/offlineStatusService.ts)
- Enhanced with Supabase sync queue processing
- Automatic retry every 30 seconds when online
- Backward compatible with existing code

### Updated Hooks

#### useSupabaseAuth() (hooks/useSupabaseAuth.ts)
```typescript
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

function LoginComponent() {
  const { signIn, signUp, signOut, isLoading, isAuthenticated } = useSupabaseAuth();
  
  const handleLogin = async () => {
    const { error } = await signIn('user@example.com', 'password');
    if (error) console.log(error);
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      Login
    </button>
  );
}
```

## Usage Examples

### Adding Food Logs

```typescript
import { addFoodLog } from './services/supabaseService';

const result = await addFoodLog({
  name: 'Banana',
  calories: 89,
  protein: 1,
  carbs: 23,
  fats: 0.3,
  weight: 100,
  timestamp: Date.now(),
  mealType: 'Pequeno Almoço',
});

if (result.success) {
  console.log('Food added:', result.data);
} else {
  console.log('Error:', result.error);
}
```

### Fetching Food Logs

```typescript
import { getFoodLogs } from './services/supabaseService';

const result = await getFoodLogs();
if (result.success) {
  console.log('Food logs:', result.data);
}
```

### Offline Operations

All operations are automatically queued if offline:

```typescript
// App is offline
const result = await addFoodLog({ name: 'Apple', ... });
// Returns immediately with data
// Operation queued in sync_queue table
// When back online, operation syncs automatically
```

### Chat History with Supabase

```typescript
import { addChatMessage, getChatHistory } from './services/supabaseService';

// Add message
await addChatMessage({
  role: 'user',
  text: 'Is banana healthy?',
  timestamp: Date.now(),
});

// Get all messages
const { data: messages } = await getChatHistory();
```

### Hydration Tracking

```typescript
import { addHydrationLog, getHydrationLogs } from './services/supabaseService';

// Log water intake
await addHydrationLog(250, Date.now()); // 250ml

// Get logs from today
const startOfDay = new Date().setHours(0, 0, 0, 0);
const { data: logs } = await getHydrationLogs(startOfDay);
```

## Offline-First Architecture

### How It Works

1. **When Online**:
   - All operations go directly to Supabase
   - No queuing needed

2. **When Offline**:
   - Operations are queued in Supabase's `sync_queue` table (if online check works)
   - Fallback: queued in localStorage under `sync_queue_${userId}`
   - User gets immediate feedback

3. **When Back Online**:
   - System automatically detects online status change
   - Every 30 seconds, offlineStatusService checks for pending operations
   - Queue items are processed one by one
   - Failed items are retried with exponential backoff

### Manual Sync

To manually trigger sync:

```typescript
import { offlineStatusService } from './services/offlineStatusService';

// Start auto-sync (called in app initialization)
offlineStatusService.initAutoSync();

// Force immediate sync
await offlineStatusService.syncPendingData();

// Check pending items
const count = offlineStatusService.getPendingSyncCount();

// Stop auto-sync
offlineStatusService.stopAutoSync();
```

## Cordova/AppGyser Integration

The Supabase integration is fully Cordova-compatible:

✅ Uses localStorage for persistent session storage
✅ Compatible with Cordova's network detection
✅ Works with Cordova plugins (Camera, Local Notifications, etc.)
✅ Base64 images stored directly in `image_data` field
✅ Fallback to localStorage for sync queue if IndexedDB unavailable

### Building for Cordova

```bash
# Standard build
npm run build

# Deploy to AppGyser:
# 1. Zip the dist/ folder
# 2. Upload to AppGyser dashboard
# 3. AppGyser compiles to APK/IPA with Cordova plugins
```

## Error Handling

The system includes comprehensive error handling:

### Scanner Errors

The Gemini service (with retry mechanism) + Supabase backup ensures:
- Network errors: 6 retry attempts with exponential backoff
- Rate limits: Adaptive wait time (1-30 seconds)
- Fallback: Food data queued for sync when offline

### Authentication Errors

- Invalid credentials → User-friendly Portuguese message
- Email already exists → Handled gracefully
- Network errors → Fallback to offline mode with cached data

### Sync Errors

- Queue persists across app restarts
- Automatic retry every 30 seconds
- User notifications for sync status
- Manual retry available

## Monitoring & Debugging

### Check Sync Status

```typescript
const { getPendingSyncCount, getOnlineStatus } = offlineStatusService;

console.log('Online:', getOnlineStatus());
console.log('Pending items:', getPendingSyncCount());
```

### View Database

In Supabase Dashboard:
1. Go to **Table Editor**
2. View data in `food_logs`, `chat_history`, `users`, etc.
3. View pending operations in `sync_queue`

### Enable Debug Logging

Set in `.env`:
```bash
VITE_DEBUG=true
```

## Migrating Existing Data

### For New Users
- Old localStorage data migrates automatically on first Supabase login
- Existing Zustand store works alongside Supabase

### For Existing Users
1. Set up Supabase as above
2. Update app code to use new services
3. First login triggers migration
4. Old data preserved as backup

## Troubleshooting

### "Supabase credentials not configured"

**Solution**: Check `.env` file has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "User not authenticated"

**Solution**: User must call `signIn` or `signUp` before data operations

### "Row Level Security (RLS) violation"

**Solution**: Ensure RLS policies in SUPABASE_SCHEMA.md were applied correctly. Check in Supabase dashboard → Authentication → Policies

### "Offline mode - data will sync when online"

**Normal behavior** when no internet connection. Data queues automatically.

### Operations not syncing

1. Check online status: `offlineStatusService.getOnlineStatus()`
2. Check pending items: `offlineStatusService.getPendingSyncCount()`
3. Force sync: `await offlineStatusService.syncPendingData()`
4. Check browser console for errors

## Performance Tips

1. **Cache responses**: Use the 24-hour cache in geminiService
2. **Batch operations**: Group multiple food logs before syncing
3. **Use indexes**: Database queries use indexed columns by default
4. **Compress images**: Consider compressing base64 images before storing

## Security Best Practices

✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
✅ Row Level Security (RLS) ensures users see only their data
✅ Supabase handles password hashing and session management
✅ All API calls use JWT authentication from Supabase
✅ Enable email confirmation for production

## Next Steps

1. **Set up Supabase** following steps above
2. **Configure environment variables**
3. **Run the application**
4. **Test authentication** → Create account and login
5. **Test offline mode** → Disable network and add food logs
6. **Test sync** → Re-enable network and watch auto-sync
7. **Deploy to production** → Use production Supabase project

## Support

For issues with:
- **Supabase**: Check [supabase.com/docs](https://supabase.com/docs)
- **Cordova/AppGyser**: See AppGyser documentation
- **NutriScan**: Check project README.md

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [Cordova Documentation](https://cordova.apache.org/docs)
- [AppGyser Documentation](https://www.appgyser.com/)
