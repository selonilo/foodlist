/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  name: string;
  amount: string;
  category?: string; // e.g. "Manav", "Şarküteri", "Kuru Gıda", "Baharat", "Dondurulmuş"
}

export interface Recipe {
  id: string;
  name: string;
  calories: number;
  ingredients: Ingredient[];
  instructions: string[];
  isFavorite: boolean;
  prepTime?: number; // minutes
  category?: string; // e.g., "Ana Yemek", "Çorba", "Kahvaltı", "Aperatif", "Tatlı"
  servings?: number;
  image?: string;
}

export interface DayPlan {
  id: string;
  date: string; // YYYY-MM-DD
  breakfast?: Recipe | null;
  lunch?: Recipe | null;
  dinner?: Recipe | null;
  snack?: Recipe | null;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  isCompleted: boolean;
  source: 'calendar' | 'manual';
  recipeId?: string; // optional back-reference
}

export interface MealRecommendationRequest {
  query?: string;
  dietaryPreference?: string;
  targetCalories?: number;
}
