export enum Gender {
  MALE = '',
  FEMALE = 'M',
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentário', // Little or no exercise
  LIGHT = 'Normal', // Light exercise 1-3 days/week
  MODERATE = 'Moderado', // Moderate exercise 3-5 days/week
  INTENSE = 'Intenso', // Hard exercise 6-7 days/week
  VERY_INTENSE = 'Muito intenso', // Very hard exercise & physical job
}

export enum Somatotype {
  ECTOMORPH = 'Ectomorph', // Lean, hard to gain weight
  MESOMORPH = 'Mesomorph', // Athletic, easy to gain muscle
  ENDOMORPH = 'Endomorph', // Stocky, slow metabolism
}

export enum Goal {
 LOSE_FAT = 'Perder peso',
  GAIN_MUSCLE = 'Ganhar muscular',
  MAINTAIN = 'Corpo estável',
  RECOMP = 'Corpo perfeito',
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
  mealType?: 'Almoço' | 'Pequeno Almoço' | 'Jantar' | 'lance';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}
