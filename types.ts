export enum Gender {
  MALE = 'Homem',
  FEMALE = 'Mulher',
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary', // Little or no exercise
  LIGHT = 'Light', // Light exercise 1-3 days/week
  MODERATE = 'Moderate', // Moderate exercise 3-5 days/week
  INTENSE = 'Intense', // Hard exercise 6-7 days/week
  VERY_INTENSE = 'Very Intense', // Very hard exercise & physical job
}

export enum Somatotype {
  ECTOMORPH = 'Ectomorph', // Lean, hard to gain weight
  MESOMORPH = 'Mesomorph', // Athletic, easy to gain muscle
  ENDOMORPH = 'Endomorph', // Stocky, slow metabolism
}

export enum Goal {
  LOSE_FAT = 'Lose Fat',
  GAIN_MUSCLE = 'Gain Muscle',
  MAINTAIN = 'Maintain',
  RECOMP = 'Body Recomposition',
}

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  somatotype: Somatotype;
  goal: Goal;
  onboardingCompleted: boolean;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight?: number; // grams
  timestamp: number;
  imageUrl?: string;
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}
