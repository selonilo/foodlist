/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Recipe, Ingredient } from '../types';
import { getFoodImage } from '../utils/imageHelper';
import { 
  Plus, 
  Sparkles, 
  Search, 
  Heart, 
  Flame, 
  Clock, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  BookOpen, 
  ShoppingCart,
  ListOrdered
} from 'lucide-react';

interface RecipesSectionProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
  onAddIngredientsToShoppingList: (ingredients: Ingredient[], recipeName: string) => void;
}

export default function RecipesSection({
  recipes,
  onAddRecipe,
  onToggleFavorite,
  onDeleteRecipe,
  onAddIngredientsToShoppingList
}: RecipesSectionProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [calorieRange, setCalorieRange] = useState<string>('all');
  
  // Expanded card tracking
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Form states (Add Recipe modal)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<'manual' | 'ai'>('ai');
  
  // AI Form state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Form state
  const [manualName, setManualName] = useState<string>('');
  const [manualCalories, setManualCalories] = useState<number>(250);
  const [manualPrepTime, setManualPrepTime] = useState<number>(30);
  const [manualCategory, setManualCategory] = useState<string>('Ana Yemek');
  const [manualServings, setManualServings] = useState<number>(2);
  const [manualIngredientsText, setManualIngredientsText] = useState<string>('');
  const [manualInstructionsText, setManualInstructionsText] = useState<string>('');

  const categories = ['Tümü', 'Kahvaltı', 'Çorba', 'Ana Yemek', 'Salata', 'Aperatif', 'Tatlı', 'Ara Öğün'];

  // Handle AI generation
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) {
        throw new Error('Yemek tarifi oluşturulurken sunucuda bir sorun oluştu.');
      }

      const data = await response.json();
      
      const newRecipe: Recipe = {
        id: `rec-${Date.now()}`,
        name: data.recipeName || aiPrompt,
        calories: Number(data.calories) || 300,
        prepTime: Number(data.prepTime) || 25,
        category: data.category || 'Ana Yemek',
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        isFavorite: false,
        servings: 2
      };

      onAddRecipe(newRecipe);
      setShowAddForm(false);
      setAiPrompt('');
      // Expand the newly created recipe
      setExpandedRecipeId(newRecipe.id);
    } catch (err: any) {
      setAiError(err.message || 'Tarif oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Manual addition
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    // Parse ingredients from text (line by line: "Name - Amount")
    const parsedIngredients: Ingredient[] = manualIngredientsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('-');
        const name = parts[0]?.trim() || '';
        const amount = parts[1]?.trim() || '1 adet';
        return { name, amount, category: 'Market' };
      });

    // Parse instructions
    const parsedInstructions = manualInstructionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);

    const newRecipe: Recipe = {
      id: `rec-${Date.now()}`,
      name: manualName,
      calories: Number(manualCalories) || 200,
      prepTime: Number(manualPrepTime) || 30,
      category: manualCategory,
      ingredients: parsedIngredients.length > 0 ? parsedIngredients : [{ name: "Tuz", amount: "1 tutam", category: "Baharat" }],
      instructions: parsedInstructions.length > 0 ? parsedInstructions : ["Malzemeleri karıştırıp pişirin."],
      isFavorite: false,
      servings: manualServings
    };

    onAddRecipe(newRecipe);
    setShowAddForm(false);
    
    // Clear form
    setManualName('');
    setManualCalories(250);
    setManualPrepTime(30);
    setManualIngredientsText('');
    setManualInstructionsText('');
  };

  // Filter recipes based on query, tab, category, calorie range
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === 'all' || recipe.isFavorite;
    
    const matchesCategory = selectedCategory === 'Tümü' || recipe.category === selectedCategory;

    const matchesCalorie = (() => {
      if (calorieRange === 'all') return true;
      if (calorieRange === 'low') return recipe.calories < 250;
      if (calorieRange === 'medium') return recipe.calories >= 250 && recipe.calories <= 500;
      if (calorieRange === 'high') return recipe.calories > 500;
      return true;
    })();

    return matchesSearch && matchesTab && matchesCategory && matchesCalorie;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleAddToShoppingList = (recipe: Recipe) => {
    onAddIngredientsToShoppingList(recipe.ingredients, recipe.name);
    setCopiedId(recipe.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6" id="recipes-section-root">
      {/* Top Controls & Search Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4" id="recipes-filter-card">
        {/* Row 1: Tab toggles & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit" id="recipe-tab-toggles">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tümü ({recipes.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'favorites' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              Favorilerim ({recipes.filter(r => r.isFavorite).length})
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm w-full sm:w-auto"
            id="add-new-recipe-btn"
          >
            <Plus className="h-4 w-4" />
            Tarif Ekle
          </button>
        </div>

        {/* Row 2: Unified Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="recipes-search-grid">
          {/* Text Search - 6 cols */}
          <div className="relative sm:col-span-6" id="recipe-search-box">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tarif adı veya malzeme ara (örn: Somon, Havuç)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 outline-hidden transition-all focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Select - 3 cols */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden transition-all cursor-pointer font-medium"
            >
              <option value="Tümü">Kategori: Tümü</option>
              {categories.filter(c => c !== 'Tümü').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Calorie Range Select - 3 cols */}
          <div className="sm:col-span-3">
            <select
              value={calorieRange}
              onChange={(e) => setCalorieRange(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden transition-all cursor-pointer font-medium"
            >
              <option value="all">Kalori: Tümü</option>
              <option value="low">Düşük (&lt; 250 kcal)</option>
              <option value="medium">Orta (250 - 500 kcal)</option>
              <option value="high">Yüksek (&gt; 500 kcal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" id="recipe-categories-scroller">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="recipe-cards-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;

            return (
              <div 
                key={recipe.id}
                className={`bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-xs transition-all duration-300 ${
                  isExpanded ? 'ring-1 ring-emerald-500/20 md:col-span-2' : ''
                }`}
                id={`recipe-card-${recipe.id}`}
              >
                {/* Recipe Banner Image */}
                <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                  <img 
                    src={getFoodImage(recipe.name, recipe.category)} 
                    alt={recipe.name}
                    className="w-full h-full object-cover hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] bg-white/95 text-emerald-800 backdrop-blur-xs px-2.5 py-1 rounded-md font-bold tracking-wider uppercase shadow-xs">
                      {recipe.category || 'Yemek'}
                    </span>
                  </div>
                </div>

                {/* Header Card Area */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-display font-semibold text-slate-800 text-base">{recipe.name}</h4>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                        {recipe.calories} kcal
                      </span>
                      {recipe.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {recipe.prepTime} dk
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {recipe.ingredients.length} Malzeme
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5">
                    {/* Favorite Toggle */}
                    <button
                      onClick={() => onToggleFavorite(recipe.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        recipe.isFavorite 
                          ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
                          : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                      id={`fav-toggle-${recipe.id}`}
                    >
                      <Heart className={`h-4 w-4 ${recipe.isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>

                    {/* Expand Details */}
                    <button
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-all"
                      id={`expand-recipe-${recipe.id}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {/* Delete Recipe */}
                    <button
                      onClick={() => onDeleteRecipe(recipe.id)}
                      className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                      title="Tarifi Sil"
                      id={`delete-recipe-${recipe.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/30 rounded-b-xl animate-fadeIn space-y-4 pt-4" id={`recipe-expanded-${recipe.id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Ingredients */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" /> Malzemeler
                          </h5>
                          
                          {/* Add to shopping list */}
                          <button
                            onClick={() => handleAddToShoppingList(recipe)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                            id={`add-ingredients-to-list-${recipe.id}`}
                          >
                            {copiedId === recipe.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" /> Listeye Eklendi!
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" /> Market Listesine Gönder
                              </>
                            )}
                          </button>
                        </div>

                        <ul className="divide-y divide-slate-100 bg-white rounded-xl p-3 border border-slate-100 text-xs">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="py-2 flex justify-between items-center">
                              <span className="text-slate-700 font-medium">{ing.name}</span>
                              <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm">{ing.amount}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Instructions */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <ListOrdered className="h-3.5 w-3.5 text-emerald-600" /> Hazırlanış Adımları
                        </h5>

                        <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed pl-1">
                          {recipe.instructions.map((step, i) => (
                            <li key={i} className="flex gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-slate-100 text-slate-400 text-xs">
            Arama veya kategori kriterlerinize uyan yemek tarifi bulunamadı. "Tarif Ekle" butonunu kullanarak yeni tarif oluşturabilirsiniz.
          </div>
        )}
      </div>

      {/* Add Recipe Modal Box */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="add-recipe-modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <h3 className="font-display font-semibold text-slate-800 text-base">
                  Yeni Tarif Ekle
                </h3>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Selector: AI or Manual */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setAddMode('ai')}
                className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                  addMode === 'ai'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 bg-slate-50/50'
                }`}
                id="modal-add-ai-tab"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI ile Tarif Oluştur (Önerilen)
              </button>
              <button
                onClick={() => setAddMode('manual')}
                className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                  addMode === 'manual'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 bg-slate-50/50'
                }`}
                id="modal-add-manual-tab"
              >
                <Plus className="h-3.5 w-3.5" />
                Kendim Elle Yazacağım
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {addMode === 'ai' ? (
                /* AI Form Generator */
                <form onSubmit={handleAIGenerate} className="space-y-4" id="ai-generator-form">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Yemek Adı veya İstek Cümlesi</label>
                    <p className="text-[11px] text-slate-400">Yapay zekanın ne tarifi hazırlamasını istersiniz? Ne kadar spesifik olursanız o kadar lezzetli olur!</p>
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      required
                      placeholder="Örn: Fit Fırın Sebzeli Tavuk Sote, diyet yapanlar için az kalorili bol proteinli olsun"
                      rows={3}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100">
                      {aiError}
                    </div>
                  )}

                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-[11px] text-emerald-700 leading-relaxed">
                    🌟 <span className="font-semibold">AI Gücü:</span> Gemini modeli, bu yemeğin ortalama kalorisini anında hesaplar, malzemelerini reyonlarına (Manav, Kasap vb.) göre kategorize eder ve hazırlama adımlarını saniyeler içinde sizin için yazar!
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {isGenerating ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Tarif Yazılıyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Tarifi Oluştur
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Manual Form Form */
                <form onSubmit={handleManualSubmit} className="space-y-4" id="manual-recipe-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Yemek Adı</label>
                      <input 
                        type="text" 
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        required
                        placeholder="Örn: Ev Usulü Mercimek Köftesi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                      >
                        <option value="Ana Yemek">Ana Yemek</option>
                        <option value="Çorba">Çorba</option>
                        <option value="Kahvaltı">Kahvaltı</option>
                        <option value="Salata">Salata</option>
                        <option value="Tatlı">Tatlı</option>
                        <option value="Aperatif">Aperatif</option>
                        <option value="Ara Öğün">Ara Öğün</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Kalori (kcal)</label>
                      <input 
                        type="number" 
                        value={manualCalories}
                        onChange={(e) => setManualCalories(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Hazırlama Süresi (dk)</label>
                      <input 
                        type="number" 
                        value={manualPrepTime}
                        onChange={(e) => setManualPrepTime(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Kaç Kişilik (Porsiyon)</label>
                      <input 
                        type="number" 
                        value={manualServings}
                        onChange={(e) => setManualServings(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Malzemeler (Her satıra bir adet, miktar belirtilerek)</label>
                    <p className="text-[10px] text-slate-400">Malzeme Adı - Miktar şeklinde yazın (Örn: Süzme Yoğurt - 1 su bardağı)</p>
                    <textarea 
                      value={manualIngredientsText}
                      onChange={(e) => setManualIngredientsText(e.target.value)}
                      required
                      placeholder={"Kırmızı Mercimek - 1 su bardağı\nSu - 5 su bardağı\nKuru Soğan - 1 adet"}
                      rows={4}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Hazırlanış Adımları (Her satıra bir adım yazın)</label>
                    <textarea 
                      value={manualInstructionsText}
                      onChange={(e) => setManualInstructionsText(e.target.value)}
                      required
                      placeholder={"Soğanları zeytinyağında soteleyin.\nYıkanmış mercimekleri ekleyip karıştırın.\nSıcak su ekleyip kaynamaya bırakın."}
                      rows={4}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      Tarifi Kaydet
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
