import { ActivityLevel, Gender, Goal, MacroTargets, Somatotype, UserProfile } from "../types";

export const calculateTargets = (profile: UserProfile): MacroTargets => {
  // 1. Calculate BMR (Mifflin-St Jeor)
  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  bmr += profile.gender === Gender.MALE ? 5 : -161;

  // 2. Calculate TDEE based on Activity
  const activityMultipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.INTENSE]: 1.725,
    [ActivityLevel.VERY_INTENSE]: 1.9,
  };
  let tdee = bmr * activityMultipliers[profile.activityLevel];

  // 3. Adjust for Goal & Somatotype
  let calorieTarget = tdee;
  
  // Somatotype Adjustments (Base TDEE tweaks)
  if (profile.somatotype === Somatotype.ECTOMORPH) {
    // Ectomorphs burn faster
    tdee *= 1.05; 
  } else if (profile.somatotype === Somatotype.ENDOMORPH) {
    // Endomorphs save energy
    tdee *= 0.95; 
  }

  // Goal Adjustments
  switch (profile.goal) {
    case Goal.LOSE_FAT:
      calorieTarget = tdee - (profile.somatotype === Somatotype.ENDOMORPH ? 500 : 350);
      break;
    case Goal.GAIN_MUSCLE:
      calorieTarget = tdee + (profile.somatotype === Somatotype.ECTOMORPH ? 400 : 250);
      break;
    case Goal.MAINTAIN:
    case Goal.RECOMP:
      calorieTarget = tdee;
      break;
  }

  // 4. Calculate Macros (Grams)
  let proteinRatio = 0.3;
  let fatRatio = 0.3;
  let carbRatio = 0.4;

  if (profile.somatotype === Somatotype.ECTOMORPH) {
    // High carb tolerance
    carbRatio = 0.55;
    proteinRatio = 0.25;
    fatRatio = 0.2;
  } else if (profile.somatotype === Somatotype.ENDOMORPH) {
    // Lower carb tolerance
    carbRatio = 0.30;
    proteinRatio = 0.40;
    fatRatio = 0.30;
  } else {
    // Mesomorph / Balanced
    carbRatio = 0.40;
    proteinRatio = 0.30;
    fatRatio = 0.30;
  }

  // Recomp specifics: High protein
  if (profile.goal === Goal.RECOMP || profile.goal === Goal.LOSE_FAT) {
     if (profile.somatotype !== Somatotype.ECTOMORPH) {
         proteinRatio += 0.05;
         carbRatio -= 0.05;
     }
  }

  return {
    calories: Math.round(calorieTarget),
    protein: Math.round((calorieTarget * proteinRatio) / 4),
    carbs: Math.round((calorieTarget * carbRatio) / 4),
    fats: Math.round((calorieTarget * fatRatio) / 9),
  };
};
