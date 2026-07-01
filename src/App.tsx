import React, { useState, useEffect } from 'react';
import { Recipe, DayPlan, GroceryItem, Ingredient } from './types';
import { INITIAL_RECIPES } from './utils/mockData';
import MealCalendar from './components/MealCalendar';
import RecipesSection from './components/RecipesSection';
import ShoppingListSection from './components/ShoppingListSection';
import AIAssistant from './components/AIAssistant';
import MealScanner from './components/MealScanner';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  ShoppingCart, 
  Bot, 
  Flame, 
  TrendingUp, 
  CheckSquare, 
  HelpCircle,
  Apple,
  Sparkles,
  Info,
  Camera,
  Users,
  X,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import Auth from './components/Auth';
import GroupManager from './components/GroupManager';
import { 
  subscribeRecipes, 
  subscribeCalendarPlans, 
  subscribeGroceryList, 
  addRecipe, 
  toggleFavoriteRecipe, 
  deleteRecipe, 
  saveCalendarPlan, 
  addGroceryItem, 
  toggleGroceryItem, 
  deleteGroceryItem, 
  clearCompletedGrocery, 
  clearAllGrocery,
  updateUserProfileGroupId,
  removeGroupMember,
  joinGroup,
  createNewGroup,
  subscribeUserProfile
} from './lib/firebase-service';

export default function App() {
  // Navigation
  const [activeSection, setActiveSection] = useState<'calendar' | 'recipes' | 'shopping' | 'assistant' | 'scanner'>('calendar');

  // Theme state ('emerald' | 'rose' | 'orange' | 'indigo' | 'violet')
  const [theme, setTheme] = useState<'emerald' | 'rose' | 'orange' | 'indigo' | 'violet'>(() => {
    return (localStorage.getItem('theme') as any) || 'emerald';
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // User Auth States (Real Firebase Session)
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false); // Modal control for mobile

  // Core App States (synchronized with Firestore)
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [calendarPlans, setCalendarPlans] = useState<DayPlan[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });

  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load session from local storage on startup
  useEffect(() => {
    const checkLocalSession = () => {
      const savedUserStr = localStorage.getItem('yemek_user');
      if (savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser);
          setUserProfile(parsedUser);
        } catch (e) {
          console.error("Failed to parse saved user", e);
        }
      }
      setAuthChecked(true);
    };
    checkLocalSession();
  }, []);

  // Real-time user profile sync
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeProfile = subscribeUserProfile(user.uid, (updatedProfile) => {
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        localStorage.setItem('yemek_user', JSON.stringify(updatedProfile));
      }
    });
    return () => unsubscribeProfile();
  }, [user?.uid]);

  // Real-time synchronization: Subscribe to Firestore instead of polling
  useEffect(() => {
    if (!userProfile?.groupId) return;
    
    const unsubscribeRecipes = subscribeRecipes(
      userProfile.groupId, 
      (data) => setRecipes(data),
      (err) => console.error("Error listening to recipes:", err)
    );
    
    const unsubscribePlans = subscribeCalendarPlans(
      userProfile.groupId, 
      (data) => setCalendarPlans(data),
      (err) => console.error("Error listening to calendar plans:", err)
    );
    
    const unsubscribeGrocery = subscribeGroceryList(
      userProfile.groupId, 
      (data) => setGroceryList(data),
      (err) => console.error("Error listening to grocery items:", err)
    );

    return () => {
      unsubscribeRecipes();
      unsubscribePlans();
      unsubscribeGrocery();
    };
  }, [userProfile?.groupId]);

  // Seed default recipes in Firestore if user group has none
  useEffect(() => {
    if (!userProfile?.groupId || !recipes || recipes.length > 0) return;
    
    const seedRecipesInFirestore = async () => {
      for (const recipe of INITIAL_RECIPES) {
        try {
          await addRecipe(recipe, userProfile.groupId);
        } catch (err) {
          console.error("Error seeding default recipe:", err);
        }
      }
    };
    seedRecipesInFirestore();
  }, [userProfile?.groupId, recipes.length]);

  // Save chosen theme in local storage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dark Mode effect to apply classes to document root and body
  useEffect(() => {
    const root = document.getElementById('app-root');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      root?.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      root?.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // RECIPE ACTION HANDLERS (Saves directly to Firestore)
  const handleAddRecipe = async (newRecipe: Recipe) => {
    if (!userProfile?.groupId) return;
    try {
      await addRecipe(newRecipe, userProfile.groupId);
    } catch (err) {
      console.error("Error adding recipe to Firestore:", err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    try {
      await toggleFavoriteRecipe(id, r.isFavorite || false);
    } catch (err) {
      console.error("Error toggling favorite in Firestore:", err);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipe(id);
    } catch (err) {
      console.error("Error deleting recipe in Firestore:", err);
    }
  };

  // CALENDAR ACTION HANDLERS (Saves directly to Firestore)
  const handleAddMealToPlan = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', recipe: Recipe) => {
    if (!userProfile?.groupId) return;
    try {
      const planId = `${userProfile.groupId}_${date}`;
      const existingPlan = calendarPlans.find(p => p.date === date);
      
      const payload = {
        id: planId,
        groupId: userProfile.groupId,
        date,
        breakfast: mealType === 'breakfast' ? recipe : (existingPlan?.breakfast || null),
        lunch: mealType === 'lunch' ? recipe : (existingPlan?.lunch || null),
        dinner: mealType === 'dinner' ? recipe : (existingPlan?.dinner || null),
        snack: mealType === 'snack' ? recipe : (existingPlan?.snack || null),
      };

      await saveCalendarPlan(planId, payload);
      // Automatically add recipe ingredients to shopping list
      await handleAddIngredientsToShoppingList(recipe.ingredients, recipe.name, recipe.id);
    } catch (err) {
      console.error("Error adding meal to plan in Firestore:", err);
    }
  };

  const handleRemoveMealFromPlan = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!userProfile?.groupId) return;
    try {
      const planId = `${userProfile.groupId}_${date}`;
      const existingPlan = calendarPlans.find(p => p.date === date);
      if (existingPlan) {
        const removedRecipeId = existingPlan[mealType]?.id;
        
        const payload = {
          id: planId,
          groupId: userProfile.groupId,
          date,
          breakfast: mealType === 'breakfast' ? null : (existingPlan.breakfast || null),
          lunch: mealType === 'lunch' ? null : (existingPlan.lunch || null),
          dinner: mealType === 'dinner' ? null : (existingPlan.dinner || null),
          snack: mealType === 'snack' ? null : (existingPlan.snack || null),
        };

        await saveCalendarPlan(planId, payload);
        // Optional: clean up calendar items from shopping list
        if (removedRecipeId) {
          const itemsToDelete = groceryList.filter(item => item.recipeId === removedRecipeId && item.source === 'calendar');
          for (const item of itemsToDelete) {
            await deleteGroceryItem(item.id);
          }
        }
      }
    } catch (err) {
      console.error("Error removing meal from plan in Firestore:", err);
    }
  };

  // GROCERY ACTION HANDLERS (Saves directly to Firestore)
  const handleAddGroceryItem = async (item: Omit<GroceryItem, 'id' | 'isCompleted'>) => {
    if (!userProfile?.groupId) return;
    try {
      const itemId = `groc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await addGroceryItem({
        id: itemId,
        name: item.name,
        category: item.category || 'Market',
        completed: false,
        amount: item.amount || '',
        source: item.source || 'manual',
        recipeId: item.recipeId || null
      }, userProfile.groupId);
    } catch (err) {
      console.error("Error adding grocery item in Firestore:", err);
    }
  };

  const handleToggleGroceryItem = async (id: string) => {
    try {
      const item = groceryList.find(i => i.id === id);
      if (item) {
        await toggleGroceryItem(id, item.isCompleted);
      }
    } catch (err) {
      console.error("Error toggling grocery item in Firestore:", err);
    }
  };

  const handleDeleteGroceryItem = async (id: string) => {
    try {
      await deleteGroceryItem(id);
    } catch (err) {
      console.error("Error deleting grocery item in Firestore:", err);
    }
  };

  const handleClearCompleted = async () => {
    if (!userProfile?.groupId) return;
    try {
      await clearCompletedGrocery(userProfile.groupId);
    } catch (err) {
      console.error("Error clearing completed items from Firestore:", err);
    }
  };

  const handleClearAllGrocery = async () => {
    if (!userProfile?.groupId) return;
    try {
      await clearAllGrocery(userProfile.groupId);
    } catch (err) {
      console.error("Error clearing all grocery items from Firestore:", err);
    }
  };

  const handleAddIngredientsToShoppingList = async (ingredients: Ingredient[], recipeName: string, recipeId?: string) => {
    if (!userProfile?.groupId) return;
    try {
      for (const ing of ingredients) {
        const exists = groceryList.some(i => i.name.toLowerCase() === ing.name.toLowerCase());
        if (!exists) {
          const itemId = `groc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          await addGroceryItem({
            id: itemId,
            name: ing.name,
            category: ing.category || 'Market',
            completed: false,
            amount: ing.amount || '',
            source: recipeId ? 'calendar' : 'manual',
            recipeId: recipeId || null
          }, userProfile.groupId);
        }
      }
    } catch (err) {
      console.error("Error adding ingredients to shopping list:", err);
    }
  };

  const handleImportFromCalendar = async () => {
    if (!userProfile?.groupId) return;
    try {
      for (const plan of calendarPlans) {
        const meals = [plan.breakfast, plan.lunch, plan.dinner, plan.snack].filter(Boolean) as Recipe[];
        for (const meal of meals) {
          for (const ing of meal.ingredients) {
            const exists = groceryList.some(i => i.name.toLowerCase() === ing.name.toLowerCase());
            if (!exists) {
              const itemId = `groc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
              await addGroceryItem({
                id: itemId,
                name: ing.name,
                category: ing.category || 'Market',
                completed: false,
                amount: ing.amount || '',
                source: 'calendar',
                recipeId: meal.id
              }, userProfile.groupId);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error importing from calendar:", err);
    }
  };

  const addDaysToDateString = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // AI Menu Generator trigger
  const handleGenerateAIPlan = async (goal: string, targetCalories: number, daysCount: number = 1) => {
    setIsGeneratingPlan(true);
    setErrorMessage(null);

    try {
      if (daysCount === 1) {
        const response = await fetch('/api/suggest-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, targetCalories })
        });

        if (!response.ok) {
          throw new Error('AI Diyetisyen öneri servisi şu anda meşgul.');
        }

        const data = await response.json();

        // Register generated recipes to our list first
        const loadedRecipes: Recipe[] = [];
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

        for (const type of mealTypes) {
          const mealData = data[type];
          if (mealData) {
            const formattedRecipe: Recipe = {
              id: `rec-${Date.now()}-${type}`,
              name: mealData.recipeName,
              calories: Number(mealData.calories) || 250,
              prepTime: Number(mealData.prepTime) || 20,
              category: mealData.category || (type === 'breakfast' ? 'Kahvaltı' : type === 'snack' ? 'Ara Öğün' : 'Ana Yemek'),
              ingredients: mealData.ingredients || [],
              instructions: mealData.instructions || ["Hazırlayıp sıcak servis edin."],
              isFavorite: false,
              servings: 2
            };
            loadedRecipes.push(formattedRecipe);
            await handleAddRecipe(formattedRecipe);
          }
        }

        const selectedBreakfast = loadedRecipes.find(r => r.category === 'Kahvaltı' || r.id.includes('breakfast')) || null;
        const selectedLunch = loadedRecipes.find(r => r.id.includes('lunch')) || null;
        const selectedDinner = loadedRecipes.find(r => r.id.includes('dinner')) || null;
        const selectedSnack = loadedRecipes.find(r => r.category === 'Ara Öğün' || r.id.includes('snack')) || null;

        // Save active calendar plan to Firestore
        const planId = `${userProfile.groupId}_${selectedDate}`;
        await saveCalendarPlan(planId, {
          id: planId,
          groupId: userProfile.groupId,
          date: selectedDate,
          breakfast: selectedBreakfast,
          lunch: selectedLunch,
          dinner: selectedDinner,
          snack: selectedSnack
        });
      } else {
        // Multi-day planning (Weekly or Monthly)
        const response = await fetch('/api/suggest-multi-day-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, targetCalories, daysCount })
        });

        if (!response.ok) {
          throw new Error('Çoklu gün AI planlayıcı servisi şu anda meşgul.');
        }

        const data = await response.json();
        const plansList = data.plans || [];

        for (let index = 0; index < plansList.length; index++) {
          const dayPlan = plansList[index];
          const currentDateStr = addDaysToDateString(selectedDate, index);
          const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
          
          const dayRecipeMap: { [key: string]: Recipe | null } = {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null
          };

          for (const type of mealTypes) {
            const mealData = dayPlan[type];
            if (mealData) {
              const recipeId = `rec-${Date.now()}-${index}-${type}`;
              const formattedRecipe: Recipe = {
                id: recipeId,
                name: mealData.recipeName,
                calories: Number(mealData.calories) || 250,
                prepTime: Number(mealData.prepTime) || 20,
                category: mealData.category || (type === 'breakfast' ? 'Kahvaltı' : type === 'snack' ? 'Ara Öğün' : 'Ana Yemek'),
                ingredients: mealData.ingredients || [],
                instructions: mealData.instructions || ["Hazırlayıp sıcak servis edin."],
                isFavorite: false,
                servings: 2
              };
              await handleAddRecipe(formattedRecipe);
              dayRecipeMap[type] = formattedRecipe;
            }
          }

          const planId = `${userProfile.groupId}_${currentDateStr}`;
          await saveCalendarPlan(planId, {
            id: planId,
            groupId: userProfile.groupId,
            date: currentDateStr,
            ...dayRecipeMap
          });
        }
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'Öneri alınamadı, yerel varsayılan plan yüklendi.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // --- Family Group Operations ---
  const handleSwitchGroup = async (targetGroupId: string) => {
    if (!user?.uid) return;
    try {
      await updateUserProfileGroupId(user.uid, targetGroupId);
      const updatedProfile = { ...userProfile, groupId: targetGroupId };
      setUserProfile(updatedProfile);
      localStorage.setItem('yemek_user', JSON.stringify(updatedProfile));
    } catch (err) {
      console.error("Error switching group:", err);
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!userProfile?.groupId) return;
    try {
      const newRandomGroupId = 'G' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await removeGroupMember(memberUid, userProfile.groupId, newRandomGroupId);
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleJoinGroup = async (targetGroupId: string) => {
    if (!user?.uid) return;
    try {
      const updatedData = await joinGroup(user.uid, targetGroupId);
      if (updatedData) {
        setUserProfile(updatedData);
        localStorage.setItem('yemek_user', JSON.stringify(updatedData));
      }
    } catch (err) {
      console.error("Error joining group:", err);
    }
  };

  const handleCreateNewGroup = async () => {
    if (!user?.uid) return;
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let newGroupId = '';
      for (let i = 0; i < 6; i++) {
        newGroupId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const updatedData = await createNewGroup(user.uid, newGroupId);
      if (updatedData) {
        setUserProfile(updatedData);
        localStorage.setItem('yemek_user', JSON.stringify(updatedData));
      }
    } catch (err) {
      console.error("Error creating new group:", err);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setUserProfile(null);
    setActiveSection('calendar');
    setIsGroupOpen(false);
  };

  const handleAuthSuccess = () => {
    const savedUserStr = localStorage.getItem('yemek_user');
    if (savedUserStr) {
      const parsedUser = JSON.parse(savedUserStr);
      setUser(parsedUser);
      setUserProfile(parsedUser);
    }
    setActiveSection('calendar');
    setIsGroupOpen(false);
  };

  // Header quick counts
  const currentPlan = calendarPlans.find(p => p.date === selectedDate);
  const dailyCalories = currentPlan ? (
    (currentPlan.breakfast?.calories || 0) +
    (currentPlan.lunch?.calories || 0) +
    (currentPlan.dinner?.calories || 0) +
    (currentPlan.snack?.calories || 0)
  ) : 0;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800">
        <div className="text-center space-y-4">
          <Apple className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">YemekPlanı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 selection:bg-emerald-500/20 theme-${theme} ${isDarkMode ? 'dark' : ''}`} id="app-root">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-display font-bold text-sm">
          <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-950/60 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Apple className="h-4 w-4" />
          </div>
          <span>YemekPlanı</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
            title={isDarkMode ? "Açık Tema" : "Karanlık Tema"}
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-500" />}
          </button>

          <button 
            onClick={() => setIsGroupOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 border border-emerald-100/60 dark:border-emerald-900/40 active:scale-95 rounded-full px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer"
            id="mobile-family-badge"
          >
            <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Ailem ({userProfile?.groupId || '...'})</span>
          </button>
        </div>
      </div>

      {/* Mobile Group Sharing Drawer/Modal Overlay */}
      {isGroupOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 sm:backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" id="mobile-group-modal">
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-w-md rounded-none sm:rounded-3xl shadow-2xl p-6 pb-28 sm:pb-6 space-y-4 max-h-screen sm:max-h-[85vh] overflow-y-auto relative animate-slide-up border-0 sm:border border-slate-200/60 dark:border-slate-800">
            {/* Top Pull Handle Indicator for Mobile feel */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            
            {/* Modal Title and Close button - nicely integrated to prevent any overlapping */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pr-10">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display tracking-tight">Ortak Aile Grubu</h3>
              </div>
            </div>

            <button 
              onClick={() => setIsGroupOpen(false)}
              className="absolute right-5 top-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer z-10"
              id="close-mobile-group-btn"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <div className="pt-1">
              <GroupManager
                currentGroupId={userProfile?.groupId || ''}
                userEmail={user?.email || ''}
                userDisplayName={userProfile?.displayName || ''}
                onSignOut={handleSignOut}
                userProfile={userProfile}
                onSwitchGroup={handleSwitchGroup}
                onRemoveMember={handleRemoveMember}
                onJoinGroup={handleJoinGroup}
                onCreateGroup={handleCreateNewGroup}
                isMobileModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-none tracking-tight flex items-center gap-2">
                YemekPlanı <span className="text-xs font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">Yemek Planlayıcı & Kalori Takibi</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Ortak Aile Grubu • Gemini AI ve PostgreSQL Destekli
              </p>
            </div>
          </div>

          {/* Quick Header Widget & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            {/* Desktop Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
              title={isDarkMode ? "Açık Tema" : "Karanlık Tema"}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
            </button>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Günlük Kalori:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{dailyCalories} / 2000 kcal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        {/* Navigation Rail / Sidebar */}
        <aside className="hidden md:flex md:w-64 shrink-0 flex-col justify-between bg-white rounded-2xl border border-slate-200 shadow-xs p-4" id="navigation-aside">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-base uppercase tracking-tight">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Apple className="w-4.5 h-4.5" />
                </div>
                YemekPlanı
              </div>
            </div>

            {/* Main Nav buttons */}
            <nav className="space-y-1" id="recipe-tab-toggles">
              <button
                onClick={() => setActiveSection('calendar')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'calendar'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-calendar-btn"
              >
                <CalendarIcon className="h-4 w-4" />
                Haftalık Plan
              </button>

              <button
                onClick={() => setActiveSection('recipes')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'recipes'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-recipes-btn"
              >
                <BookOpen className="h-4 w-4" />
                Yemek Tariflerim
              </button>

              <button
                onClick={() => setActiveSection('shopping')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'shopping'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-shopping-btn"
              >
                <ShoppingCart className="h-4 w-4" />
                Alışveriş Listesi
                {groceryList.filter(i => !i.isCompleted).length > 0 && (
                  <span className={`ml-auto text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    activeSection === 'shopping' ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-600 text-white animate-bounce'
                  }`}>
                    {groceryList.filter(i => !i.isCompleted).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSection('assistant')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'assistant'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-assistant-btn"
              >
                <Bot className="h-4 w-4" />
                AI Diyetisyen & Şef
                <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse ml-auto" />
              </button>

              <button
                onClick={() => setActiveSection('scanner')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === 'scanner'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="nav-scanner-btn"
              >
                <Camera className="h-4 w-4 text-emerald-600" />
                AI Kalori Tarayıcı
                <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md ml-auto">Yeni</span>
              </button>
            </nav>

            {/* Quick Info Box */}
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 space-y-2 hidden md:block" id="sidebar-info-card">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-emerald-600" /> Diyetisyen Notu
              </h5>
              <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                Kilo yönetimi için günlük kalori dengesini korumaya özen gösterin. AI Şefimizden tarif önerileri isteyerek mönünüzü zenginleştirebilirsiniz!
              </p>
            </div>
          </div>

          {/* Family Group Manager on Sidebar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 hidden md:block">
            <GroupManager
              currentGroupId={userProfile?.groupId || ''}
              userEmail={user?.email || ''}
              userDisplayName={userProfile?.displayName || ''}
              onSignOut={handleSignOut}
              userProfile={userProfile}
              onSwitchGroup={handleSwitchGroup}
              onRemoveMember={handleRemoveMember}
              onJoinGroup={handleJoinGroup}
              onCreateGroup={handleCreateNewGroup}
            />
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6" id="main-content-area">
          {activeSection === 'calendar' && (
            <MealCalendar 
              recipes={recipes}
              calendarPlans={calendarPlans}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onAddMealToPlan={handleAddMealToPlan}
              onRemoveMealFromPlan={handleRemoveMealFromPlan}
              onGenerateAIPlan={handleGenerateAIPlan}
              isGeneratingPlan={isGeneratingPlan}
            />
          )}

          {activeSection === 'recipes' && (
            <RecipesSection 
              recipes={recipes}
              onAddRecipe={handleAddRecipe}
              onToggleFavorite={handleToggleFavorite}
              onDeleteRecipe={handleDeleteRecipe}
              onAddIngredientsToShoppingList={handleAddIngredientsToShoppingList}
            />
          )}

          {activeSection === 'shopping' && (
            <ShoppingListSection 
              groceryList={groceryList}
              calendarPlans={calendarPlans}
              onAddGroceryItem={handleAddGroceryItem}
              onToggleGroceryItem={handleToggleGroceryItem}
              onDeleteGroceryItem={handleDeleteGroceryItem}
              onClearCompleted={handleClearCompleted}
              onClearAll={handleClearAllGrocery}
              onImportFromCalendar={handleImportFromCalendar}
            />
          )}

          <div className={activeSection === 'assistant' ? 'block' : 'hidden'}>
            <AIAssistant />
          </div>

          {activeSection === 'scanner' && (
            <MealScanner onAddRecipe={handleAddRecipe} />
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveSection('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeSection === 'calendar' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Takvim</span>
        </button>

        <button
          onClick={() => setActiveSection('recipes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeSection === 'recipes' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Tariflerim</span>
        </button>

        <button
          onClick={() => setActiveSection('scanner')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeSection === 'scanner' ? 'text-emerald-700 font-bold scale-110' : 'text-slate-500 font-medium'
          }`}
        >
          <div className="absolute -top-5 h-10 w-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30 border-2 border-white">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-[10px] mt-6">Tarayıcı</span>
        </button>

        <button
          onClick={() => setActiveSection('shopping')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeSection === 'shopping' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Market</span>
          {groceryList.filter(i => !i.isCompleted).length > 0 && (
            <span className="absolute top-0 right-4 h-2.5 w-2.5 rounded-full bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => setActiveSection('assistant')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeSection === 'assistant' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-400 font-medium'
          }`}
        >
          <Bot className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">AI Asistan</span>
        </button>
      </div>

      {/* Footer Details */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto text-center text-xs text-slate-400 pb-24 md:pb-6" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-3">
          {/* Subtle & Elegant Theme Picker */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-full py-1 px-3 shadow-xs" id="footer-theme-selector">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tema:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme('emerald')}
                className={`w-3.5 h-3.5 rounded-full bg-emerald-500 border transition-all cursor-pointer ${
                  theme === 'emerald' ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                }`}
                title="Yeşil"
              />
              <button
                onClick={() => setTheme('rose')}
                className={`w-3.5 h-3.5 rounded-full bg-rose-500 border transition-all cursor-pointer ${
                  theme === 'rose' ? 'ring-2 ring-rose-500 ring-offset-1 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                }`}
                title="Pembe"
              />
              <button
                onClick={() => setTheme('orange')}
                className={`w-3.5 h-3.5 rounded-full bg-orange-500 border transition-all cursor-pointer ${
                  theme === 'orange' ? 'ring-2 ring-orange-500 ring-offset-1 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                }`}
                title="Turuncu"
              />
              <button
                onClick={() => setTheme('indigo')}
                className={`w-3.5 h-3.5 rounded-full bg-indigo-500 border transition-all cursor-pointer ${
                  theme === 'indigo' ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                }`}
                title="Mavi"
              />
              <button
                onClick={() => setTheme('violet')}
                className={`w-3.5 h-3.5 rounded-full bg-violet-500 border transition-all cursor-pointer ${
                  theme === 'violet' ? 'ring-2 ring-violet-500 ring-offset-1 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                }`}
                title="Mor"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-display font-bold text-sm tracking-wide text-slate-700">
            <Apple className="h-4.5 w-4.5 text-emerald-600" />
            <span>YemekPlanı</span>
          </div>

          {/* Copyright & Design credit */}
          <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5">
            <span>© 2026 YemekPlanı. Tüm hakları saklıdır.</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1 bg-emerald-50/50 border border-emerald-100/40 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
              <span>Dizayn:</span>
              <strong className="text-emerald-700 font-bold">Salih Çetin</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
