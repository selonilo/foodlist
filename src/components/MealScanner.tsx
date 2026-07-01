/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, Flame, Sparkles, Plus, AlertCircle, CheckCircle2, ChevronRight, Apple, TrendingUp } from 'lucide-react';
import { Recipe } from '../types';

interface MealScannerProps {
  onAddRecipe: (recipe: Recipe) => void;
}

export default function MealScanner({ onAddRecipe }: MealScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    mealName: string;
    estimatedCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    confidenceScore: number;
    suggestedIngredients: { name: string; amount: string }[];
    description: string;
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Görsel boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setErrorMsg(null);
        setAnalysisResult(null);
        setSaveSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file selection
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setErrorMsg(null);
        setAnalysisResult(null);
        setSaveSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send to AI endpoint
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/analyze-meal-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage })
      });

      if (!response.ok) {
        let errMessage = 'AI Tarayıcı servisine şu anda erişilemiyor.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMessage = errData.error;
          }
        } catch (e) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analiz sırasında bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Recipe to favorites/my recipes
  const handleSaveToMyRecipes = () => {
    if (!analysisResult) return;

    const newRecipe: Recipe = {
      id: `scanned-${Date.now()}`,
      name: analysisResult.mealName,
      calories: analysisResult.estimatedCalories,
      prepTime: 15,
      category: 'AI Tarayıcı',
      ingredients: analysisResult.suggestedIngredients.map(ing => ({
        name: ing.name,
        amount: ing.amount || '1 porsiyon',
        category: 'Market'
      })),
      instructions: [
        'Malzemeleri tarife uygun şekilde yıkayın ve porsiyonlayın.',
        analysisResult.description,
        'Afiyet olsun!'
      ],
      isFavorite: false,
      servings: 1
    };

    onAddRecipe(newRecipe);
    setSaveSuccess(true);
  };

  return (
    <div className="space-y-6" id="meal-scanner-root">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display font-semibold text-lg text-slate-800">
              AI Fotoğraftan Kalori Analizi
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Tabağınızın fotoğrafını çekin veya yükleyin; Gemini yapay zekası yemeğin içindekileri tanısın, kalori ve makro değerlerini saniyeler içinde hesaplasın.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Mobil & Kamera Destekli
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload / Capture Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
          <h4 className="font-display font-semibold text-slate-800 text-sm">
            Yemek Fotoğrafı Yükle
          </h4>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment" // Auto opens back camera on mobile phones!
            className="hidden"
          />

          {!selectedImage ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/10 transition-all duration-300 min-h-[260px]"
              id="upload-dropzone"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-xs">
                <Camera className="h-6 w-6" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">Kamerayı Aç veya Görsel Seç</p>
                <p className="text-[11px] text-slate-400">Mobilde doğrudan kameranız açılır. Masaüstünde sürükle-bırak desteklenir.</p>
              </div>
              <button 
                type="button"
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                Fotoğraf Seç / Çek
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 max-h-[300px] flex items-center justify-center">
                <img 
                  src={selectedImage} 
                  alt="Yemek Önizleme" 
                  className="max-h-[300px] w-full object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                    setSaveSuccess(false);
                  }}
                  className="absolute top-3 right-3 bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-bold h-7 px-2.5 rounded-lg backdrop-blur-xs transition-all"
                >
                  Değiştir
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gemini Görsel Analiz Yapıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>Fotoğrafı Analiz Et & Kalori Hesapla</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[320px]">
          {!analysisResult ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400 space-y-3">
              <Apple className="h-10 w-10 text-slate-300 stroke-[1.5]" />
              <div className="space-y-1">
                <h5 className="font-bold text-slate-700 text-xs">Analiz Sonucu Bekleniyor</h5>
                <p className="text-[11px] max-w-xs">Sol taraftan bir yemek fotoğrafı ekleyip "Fotoğrafı Analiz Et" butonuna tıklayarak sonuçları görebilirsiniz.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase">
                      AI TAHMİNİ
                    </span>
                    <h4 className="font-display font-bold text-slate-800 text-lg mt-1">
                      {analysisResult.mealName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">GÜVEN SKORU</span>
                    <span className="text-xs font-bold text-emerald-600">%{analysisResult.confidenceScore || 90}</span>
                  </div>
                </div>

                {/* Macro calorie cards */}
                <div className="grid grid-cols-4 gap-2.5 mt-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">KALORİ</span>
                    <span className="text-lg font-extrabold text-emerald-700 font-display">{analysisResult.estimatedCalories}</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">kcal</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">PROTEİN</span>
                    <span className="text-base font-bold text-blue-700 font-display">{analysisResult.proteinGrams}g</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">makro</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">KARB.</span>
                    <span className="text-base font-bold text-orange-700 font-display">{analysisResult.carbsGrams}g</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">makro</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">YAĞ</span>
                    <span className="text-base font-bold text-indigo-700 font-display">{analysisResult.fatGrams}g</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">makro</span>
                  </div>
                </div>

                {/* Visual bar graph */}
                <div className="mt-4 space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Makro Dağılımı (Kalorisel Oran)</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      Diyet Dostu
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 h-full" style={{ width: `${(analysisResult.proteinGrams * 4 / (analysisResult.estimatedCalories || 1)) * 100}%` }} title="Protein" />
                    <div className="bg-orange-500 h-full" style={{ width: `${(analysisResult.carbsGrams * 4 / (analysisResult.estimatedCalories || 1)) * 100}%` }} title="Karbonhidrat" />
                    <div className="bg-indigo-500 h-full" style={{ width: `${(analysisResult.fatGrams * 9 / (analysisResult.estimatedCalories || 1)) * 100}%` }} title="Yağ" />
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-slate-500 pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Protein</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Karbonhidrat</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Yağ</span>
                  </div>
                </div>

                {/* Detected ingredients */}
                <div className="mt-4 space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tespit Edilen İçerik</h5>
                  <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                    {analysisResult.suggestedIngredients?.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-700 truncate font-medium">{ing.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold ml-auto shrink-0">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI advice */}
                <div className="mt-4 p-3 bg-emerald-50/40 rounded-xl border border-emerald-50 text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{analysisResult.description}&rdquo;
                </div>
              </div>

              {/* Save actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                {saveSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Yemek tariflerinize başarıyla kaydedildi!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToMyRecipes}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tariflerim Sekmesine Kaydet
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
