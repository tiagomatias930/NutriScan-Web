/**
 * Google Fit Service
 * 
 * Handles communication with Google Fit REST API to sync daily nutritional data.
 * Requires OAuth2 token obtained during Google sign-in (via Supabase Auth).
 * 
 * Google Fit REST API base URL: https://www.googleapis.com/fitness/v1/users/me/
 * 
 * Required OAuth scopes (requested during sign-in):
 *  - https://www.googleapis.com/auth/fitness.activity.read
 *  - https://www.googleapis.com/auth/fitness.nutrition.read
 *  - https://www.googleapis.com/auth/fitness.nutrition.write
 */

import { supabase } from './supabaseClient';

const GOOGLE_FIT_BASE_URL = 'https://www.googleapis.com/fitness/v1/users/me';

// Google Fit data type names for nutrition
export const NUTRITION_DATA_TYPE = 'com.google.nutrition';
export const CALORIES_DATA_TYPE = 'com.google.calories.expended';

export interface NutritionEntry {
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fats: number;    // grams
  timestamp: number; // ms since epoch
  mealType?: number; // Google Fit meal type: 1=unknown, 2=breakfast, 3=lunch, 4=dinner, 5=snack
}

export interface GoogleFitSession {
  accessToken: string;
  expiresAt?: number;
}

/**
 * Get the current Google OAuth access token from Supabase session.
 * The provider_token is available when the user signed in with Google.
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    // provider_token holds the Google OAuth access token
    return session?.provider_token || null;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    return null;
  }
};

/**
 * Check if Google Fit access is available (user signed in with Google and token is valid).
 */
export const isGoogleFitAvailable = async (): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  return !!token;
};

/**
 * Map app meal type to Google Fit meal type constants.
 * Google Fit meal types:
 *   0 = UNKNOWN, 1 = BREAKFAST, 2 = LUNCH, 3 = DINNER, 4 = SNACK
 */
const mapMealType = (mealType?: string): number => {
  switch (mealType) {
    case 'Pequeno Almoço': return 1; // breakfast
    case 'Almoço': return 2;         // lunch
    case 'Jantar': return 3;         // dinner
    case 'lance': return 4;          // snack
    default: return 0;               // unknown
  }
};

/**
 * Write a nutrition entry to Google Fit.
 * Uses the dataset:aggregate endpoint to push nutrition data.
 */
export const writeNutritionEntry = async (entry: NutritionEntry, mealTypeLabel?: string): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    console.warn('Google Fit: No access token available');
    return false;
  }

  const dataSourceId = `raw:${NUTRITION_DATA_TYPE}:com.nutriscan.web`;
  const startTimeNanos = entry.timestamp * 1_000_000;
  const endTimeNanos = startTimeNanos + 1_000_000; // 1ms duration

  const dataPoint = {
    dataTypeName: NUTRITION_DATA_TYPE,
    startTimeNanos: String(startTimeNanos),
    endTimeNanos: String(endTimeNanos),
    value: [
      {
        // Nutrients map
        mapVal: [
          { key: 'calories', value: { fpVal: entry.calories } },
          { key: 'protein', value: { fpVal: entry.protein } },
          { key: 'carbs.total', value: { fpVal: entry.carbs } },
          { key: 'fat.total', value: { fpVal: entry.fats } },
        ],
      },
      {
        // Meal type
        intVal: mapMealType(mealTypeLabel),
      },
      {
        // Food item name
        stringVal: entry.name,
      },
    ],
  };

  try {
    const datasetId = `${startTimeNanos}-${endTimeNanos}`;
    const url = `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${datasetId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataSourceId,
        minStartTimeNs: String(startTimeNanos),
        maxEndTimeNs: String(endTimeNanos),
        point: [dataPoint],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Fit write error:', response.status, errorBody);
      return false;
    }

    console.log('Google Fit: Nutrition entry synced successfully');
    return true;
  } catch (error) {
    console.error('Google Fit write error:', error);
    return false;
  }
};

/**
 * Read nutrition data from Google Fit for a given time range.
 * Returns aggregated nutrition data.
 */
export const readNutritionData = async (
  startTimeMs: number,
  endTimeMs: number
): Promise<NutritionEntry[] | null> => {
  const token = await getGoogleAccessToken();
  if (!token) {
    console.warn('Google Fit: No access token available');
    return null;
  }

  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: NUTRITION_DATA_TYPE },
        ],
        startTimeMillis: startTimeMs,
        endTimeMillis: endTimeMs,
        bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Fit read error:', response.status, errorBody);
      return null;
    }

    const data = await response.json();
    const entries: NutritionEntry[] = [];

    // Parse the response buckets
    for (const bucket of data.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          const nutrients = point.value?.[0]?.mapVal || [];
          const mealType = point.value?.[1]?.intVal;
          const name = point.value?.[2]?.stringVal || 'Unknown';

          const getNutrient = (key: string): number => {
            const entry = nutrients.find((n: any) => n.key === key);
            return entry?.value?.fpVal || 0;
          };

          entries.push({
            name,
            calories: getNutrient('calories'),
            protein: getNutrient('protein'),
            carbs: getNutrient('carbs.total'),
            fats: getNutrient('fat.total'),
            timestamp: parseInt(point.startTimeNanos) / 1_000_000,
            mealType,
          });
        }
      }
    }

    return entries;
  } catch (error) {
    console.error('Google Fit read error:', error);
    return null;
  }
};

/**
 * Create the NutriScan data source in Google Fit (call once on first sync).
 * This registers our app as a data source for nutrition data.
 */
export const ensureDataSource = async (): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  if (!token) return false;

  const dataSource = {
    dataStreamName: 'NutriScan Nutrition',
    type: 'raw',
    application: {
      name: 'NutriScan',
      version: '1.0',
    },
    dataType: {
      name: NUTRITION_DATA_TYPE,
    },
    device: {
      type: 'phone',
      manufacturer: 'NutriScan',
      model: 'Web',
      uid: 'nutriscan-web',
      version: '1.0',
    },
  };

  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataSource),
    });

    // 409 = already exists, which is fine
    if (response.ok || response.status === 409) {
      console.log('Google Fit: Data source ready');
      return true;
    }

    const errorBody = await response.text();
    console.error('Google Fit data source error:', response.status, errorBody);
    return false;
  } catch (error) {
    console.error('Google Fit data source error:', error);
    return false;
  }
};

/**
 * Read today's calorie expenditure from Google Fit.
 */
export const readCaloriesExpended = async (): Promise<number | null> => {
  const token = await getGoogleAccessToken();
  if (!token) return null;

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: CALORIES_DATA_TYPE },
        ],
        startTimeMillis: startOfDay.getTime(),
        endTimeMillis: now,
        bucketByTime: { durationMillis: 86400000 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    let total = 0;
    for (const bucket of data.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          total += point.value?.[0]?.fpVal || 0;
        }
      }
    }

    return Math.round(total);
  } catch (error) {
    console.error('Google Fit calories read error:', error);
    return null;
  }
};
