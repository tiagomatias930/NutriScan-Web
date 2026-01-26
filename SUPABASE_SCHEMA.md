# Supabase Database Schema for NutriScan

This document describes the database schema and setup for Supabase integration.

## Environment Setup

Create a `.env` file with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Tables

### 1. users (User Profiles)
Extends Supabase auth with user profile data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('H', 'M')),
  age INTEGER NOT NULL CHECK (age > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  weight NUMERIC NOT NULL CHECK (weight > 0),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('Sedentário', 'Normal', 'Moderado', 'Intenso', 'Muito intenso')),
  somatotype TEXT NOT NULL CHECK (somatotype IN ('Ectomorfo', 'Mesomorfo', 'Endomorfo')),
  goal TEXT NOT NULL CHECK (goal IN ('Perder peso', 'Ganhar muscular', 'Corpo estável', 'Corpo perfeito')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. food_logs (Nutrition Records)
Stores all food entries with macro nutrients and timestamps.

```sql
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL CHECK (calories >= 0),
  protein NUMERIC NOT NULL CHECK (protein >= 0),
  carbs NUMERIC NOT NULL CHECK (carbs >= 0),
  fats NUMERIC NOT NULL CHECK (fats >= 0),
  weight INTEGER,
  meal_type TEXT CHECK (meal_type IN ('Almoço', 'Pequeno Almoço', 'Jantar', 'lance')),
  image_data TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_timestamp ON food_logs(timestamp);

-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. chat_history (Conversation Records)
Stores coaching conversation history.

```sql
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  sources JSONB,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat history" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. hydration_logs (Water Intake Records)
Tracks daily water intake.

```sql
CREATE TABLE hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml >= 0),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hydration_logs_user_id ON hydration_logs(user_id);
CREATE INDEX idx_hydration_logs_timestamp ON hydration_logs(timestamp);

-- Enable RLS
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own hydration logs" ON hydration_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own hydration logs" ON hydration_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. daily_history (Daily Archive)
Stores end-of-day snapshots of food logs and water intake for historical views.

```sql
CREATE TABLE daily_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_timestamp BIGINT NOT NULL,
  food_data JSONB NOT NULL,
  water_intake INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_history_user_id ON daily_history(user_id);
CREATE INDEX idx_daily_history_date ON daily_history(date_timestamp);

-- Enable RLS
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own daily history" ON daily_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily history" ON daily_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily history" ON daily_history
  FOR DELETE USING (auth.uid() = user_id);
```

### 6. sync_queue (Offline Sync Queue)
Manages operations pending sync when offline.

```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('add_food', 'add_water', 'add_chat', 'delete_food')),
  table_name TEXT NOT NULL,
  record_data JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  attempted BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_attempted ON sync_queue(attempted);

-- Enable RLS
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sync queue" ON sync_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sync queue" ON sync_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sync queue" ON sync_queue
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sync queue" ON sync_queue
  FOR DELETE USING (auth.uid() = user_id);
```

## Setup Instructions

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Copy Credentials**: Copy your project URL and anon key
3. **Run SQL Migration**: Go to Supabase SQL Editor and run all table creation scripts
4. **Configure Environment**: Add credentials to `.env`
5. **Enable Real-time**: For real-time sync on food_logs, chat_history, and hydration_logs:
   - Go to Replication in Supabase dashboard
   - Enable for the tables above

## Data Model Mapping

### UserProfile → users table
```
name → name
gender → gender
age → age
height → height
weight → weight
activityLevel → activity_level
somatotype → somatotype
goal → goal
onboardingCompleted → onboarding_completed
```

### FoodItem → food_logs table
```
id → id
name → name
calories → calories
protein → protein
carbs → carbs
fats → fats
weight → weight
mealType → meal_type
imageData → image_data
timestamp → timestamp
```

### ChatMessage → chat_history table
```
id → id
role → role
text → text
sources → sources
timestamp → timestamp
```

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS policies to ensure users can only access their own data
2. **Authentication**: Uses Supabase JWT tokens stored in localStorage
3. **Image Storage**: Base64 images stored in image_data (alternative: use Supabase Storage for large files)
4. **Sync Queue**: Ensures offline operations are safely queued and retried

## Migration from LocalStorage

Old data in `nutriscan-storage` localStorage key will be migrated on first login:
1. User authenticates with Supabase
2. System detects old localStorage data
3. Data is migrated to corresponding Supabase tables
4. Old localStorage data is archived or cleared
