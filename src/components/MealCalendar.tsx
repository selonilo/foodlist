/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Recipe, DayPlan } from '../types';
import { getFoodImage } from '../utils/imageHelper';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Flame, 
  Sparkles, 
  Clock, 
  Utensils,
  BookOpen,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  BrainCircuit,
  FileDown
} from 'lucide-react';

interface MealCalendarProps {
  recipes: Recipe[];
  calendarPlans: DayPlan[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddMealToPlan: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', recipe: Recipe) => void;
  onRemoveMealFromPlan: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onGenerateAIPlan: (goal: string, calories: number, daysCount: number) => Promise<void>;
  isGeneratingPlan: boolean;
}

export default function MealCalendar({
  recipes,
  calendarPlans,
  selectedDate,
  setSelectedDate,
  onAddMealToPlan,
  onRemoveMealFromPlan,
  onGenerateAIPlan,
  isGeneratingPlan
}: MealCalendarProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeMealType, setActiveMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<string>('Dengeli Beslenme');
  const [aiTargetCal, setAiTargetCal] = useState<number>(2000);
  const [aiDaysCount, setAiDaysCount] = useState<number>(7);
  const [showAiConfig, setShowAiConfig] = useState<boolean>(false);

  // Calendar view & navigation states
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentReferenceDate, setCurrentReferenceDate] = useState<Date>(() => {
    return new Date(selectedDate);
  });
  const [selectedMealRecipe, setSelectedMealRecipe] = useState<Recipe | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Get current date helper
  const today = new Date();

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Generate week dates based on current reference date
  const getWeekDates = (refDate: Date) => {
    const dates = [];
    const current = new Date(refDate);
    // Find Monday of current week
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Generate 42 days grid for monthly calendar view
  const getMonthDates = (refDate: Date) => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // Day offset for Monday start: Mon=0, Tue=1, ..., Sun=6
    const dayOfWeek = firstDay.getDay();
    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - dayOffset);
    
    const dates = [];
    // 6 rows of 7 days = 42 days to ensure any month is fully covered
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentReferenceDate);
  const monthDates = getMonthDates(currentReferenceDate);

  // Navigate calendar
  const handlePrev = () => {
    const nextRef = new Date(currentReferenceDate);
    if (viewMode === 'week') {
      nextRef.setDate(nextRef.getDate() - 7);
    } else {
      nextRef.setMonth(nextRef.getMonth() - 1);
    }
    setCurrentReferenceDate(nextRef);
  };

  const handleNext = () => {
    const nextRef = new Date(currentReferenceDate);
    if (viewMode === 'week') {
      nextRef.setDate(nextRef.getDate() + 7);
    } else {
      nextRef.setMonth(nextRef.getMonth() + 1);
    }
    setCurrentReferenceDate(nextRef);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentReferenceDate(now);
    setSelectedDate(formatDateString(now));
  };

  const getMonthYearString = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const getWeekRangeString = () => {
    if (weekDates.length === 0) return '';
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];
    
    const formatDateSimple = (d: Date) => {
      return `${d.getDate()} ${d.toLocaleDateString('tr-TR', { month: 'long' })}`;
    };
    
    return `${formatDateSimple(first)} - ${formatDateSimple(last)} ${last.getFullYear()}`;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const cleanText = (txt: string) => {
      return txt
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
    };

    const weekRange = getWeekRangeString();
    
    // Header Style (Emerald theme matching the main app)
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(cleanText('YEMEK PLANLAMA TAKVIMI'), 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(209, 250, 229); // light green
    doc.text(cleanText(`Haftalik Yemek Listesi (${weekRange})`), 15, 26);
    
    let y = 48;
    const pageHeight = 275;
    const daysTrFull = ['PAZARTESI', 'SALI', 'CARSAMBA', 'PERSEMBE', 'CUMA', 'CUMARTESI', 'PAZAR'];

    weekDates.forEach((date, index) => {
      const dateStr = formatDateString(date);
      const plan = calendarPlans.find(p => p.date === dateStr);
      const dayName = daysTrFull[index];
      const dateDisplay = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'long' })}`;

      // Calculate space needed
      let spaceNeeded = 18; 
      if (plan && (plan.breakfast || plan.lunch || plan.dinner || plan.snack)) {
        if (plan.breakfast) spaceNeeded += 8;
        if (plan.lunch) spaceNeeded += 8;
        if (plan.dinner) spaceNeeded += 8;
        if (plan.snack) spaceNeeded += 8;
        spaceNeeded += 4;
      } else {
        spaceNeeded += 8;
      }

      if (y + spaceNeeded > pageHeight) {
        doc.addPage();
        y = 20; 
      }

      // Day Header background
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, y, 180, 8, 'F');
      
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(cleanText(`${dayName} - ${dateDisplay}`), 18, y + 5.5);

      // Right-aligned daily calories
      const dailyCals = getDailyCalories(plan);
      if (dailyCals > 0) {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(cleanText(`${dailyCals} kcal`), 170, y + 5.5);
      }

      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105); // slate-600

      if (plan && (plan.breakfast || plan.lunch || plan.dinner || plan.snack)) {
        const meals = [
          { label: 'Kahvalti', recipe: plan.breakfast },
          { label: 'Ogle Yemegi', recipe: plan.lunch },
          { label: 'Aksam Yemegi', recipe: plan.dinner },
          { label: 'Ara Ogun', recipe: plan.snack }
        ];

        meals.forEach((m) => {
          if (m.recipe) {
            doc.setFont('helvetica', 'bold');
            doc.text(cleanText(`${m.label}: `), 20, y);
            
            doc.setFont('helvetica', 'normal');
            const recipeInfo = `${m.recipe.name} (${m.recipe.calories} kcal)`;
            doc.text(cleanText(recipeInfo), 45, y);
            y += 7;
          }
        });
        y += 1;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(cleanText('Bugun icin planlanmis bir ogun bulunmamaktadir.'), 20, y);
        y += 8;
      }

      // Border line below each day
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(15, y - 2, 195, y - 2);
      y += 5;
    });

    // Footer on the last page
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(cleanText('Yemek Listesi & Yapay Zeka Planlama Asistani tarafindan otomatik olarak olusturulmustur.'), 15, 288);

    doc.save(`Yemek_Plani_${weekRange.replace(/ /g, '_')}.pdf`);
  };

  // Find plan for selected date
  const currentPlan = calendarPlans.find(p => p.date === selectedDate);

  // Compute daily calories
  const getDailyCalories = (plan?: DayPlan) => {
    if (!plan) return 0;
    let total = 0;
    if (plan.breakfast) total += plan.breakfast.calories;
    if (plan.lunch) total += plan.lunch.calories;
    if (plan.dinner) total += plan.dinner.calories;
    if (plan.snack) total += plan.snack.calories;
    return total;
  };

  const dailyCalories = getDailyCalories(currentPlan);
  const calPercentage = Math.min(Math.round((dailyCalories / 2000) * 100), 100);

  // Open modal to add meal
  const handleOpenAddModal = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setActiveMealType(mealType);
    setShowAddModal(true);
  };

  // Select a recipe and add to active plan
  const handleSelectRecipe = (recipe: Recipe) => {
    if (activeMealType) {
      onAddMealToPlan(selectedDate, activeMealType, recipe);
      setShowAddModal(false);
      setActiveMealType(null);
    }
  };

  // Filter recipes for selector
  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const mealNameMap = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Ara Öğün'
  };

  const mealIcons = {
    breakfast: <Utensils className="h-5 w-5 text-amber-500" />,
    lunch: <Utensils className="h-5 w-5 text-blue-500" />,
    dinner: <Utensils className="h-5 w-5 text-indigo-500" />,
    snack: <Flame className="h-5 w-5 text-orange-500" />
  };

  const daysOfWeekTr = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const triggerAIPlanGeneration = async () => {
    await onGenerateAIPlan(aiGoal, aiTargetCal, aiDaysCount);
    setShowAiConfig(false);
  };

  // Toggle step completion in Recipe Detail Modal
  const handleToggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  return (
    <div className="space-y-6" id="meal-calendar-root">
      {/* Calendar Header with View Toggle & Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100" id="calendar-week-slider">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display font-semibold text-base sm:text-lg text-slate-800">
              Yemek Planlama Takvimi
            </h3>
          </div>
          
          {/* View Segment Switcher and AI Config toggler */}
          <div className="flex items-center gap-2">
            {/* Week / Month switches */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'week' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'month' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Aylık
              </button>
            </div>

            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              id="download-pdf-btn"
              title="Haftalık yemek planını PDF olarak indir"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              PDF İndir
            </button>

            <button 
              onClick={() => setShowAiConfig(!showAiConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-all"
              id="ai-generate-menu-btn"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              AI Plan
            </button>
          </div>
        </div>

        {/* AI Generator Panel (Slide Down) */}
        {showAiConfig && (
          <div className="mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-fadeIn space-y-3" id="ai-generator-panel">
            <h4 className="text-xs font-semibold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
              <BrainCircuit className="h-4 w-4" /> AI Yapay Zeka Diyetisyen Önerisi
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Gemini modeli hedef kalorinize, diyet amacınıza ve planlama sürenize (Günlük, Haftalık veya Aylık) göre harika öğünler planlar, tariflerini kaydeder ve malzemelerini otomatik alışveriş listesine yazar!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Diyet Amacı</label>
                <select 
                  value={aiGoal} 
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden focus:border-emerald-500"
                >
                  <option value="Dengeli Beslenme">Dengeli Beslenme (Sağlıklı Yaşam)</option>
                  <option value="Zayıflama">Zayıflama / Kalori Açığı</option>
                  <option value="Kas Kazanımı">Kas Kazanımı / Yüksek Protein</option>
                  <option value="Ketojenik">Ketojenik Diyet</option>
                  <option value="Vejetaryen">Vejetaryen Beslenme</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Hedef Kalori (kcal)</label>
                <input 
                  type="number" 
                  value={aiTargetCal}
                  onChange={(e) => setAiTargetCal(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden focus:border-emerald-500"
                  min={1000}
                  max={5000}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Planlama Süresi</label>
                <select 
                  value={aiDaysCount} 
                  onChange={(e) => setAiDaysCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden focus:border-emerald-500 font-semibold text-emerald-800"
                >
                  <option value={1}>Günlük Menü Öner (1 Gün)</option>
                  <option value={7}>Haftalık Menü Öner (7 Gün)</option>
                  <option value={30}>Aylık Menü Öner (30 Gün)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowAiConfig(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                İptal
              </button>
              <button 
                onClick={triggerAIPlanGeneration}
                disabled={isGeneratingPlan}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                {isGeneratingPlan ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menü Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Planı Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Date Navigator Header */}
        <div className="flex items-center justify-between mb-4 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
          <button
            onClick={handlePrev}
            className="p-1.5 hover:bg-white hover:text-emerald-700 text-slate-500 rounded-lg border border-transparent hover:border-slate-200 transition-all"
            title="Önceki"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
            {viewMode === 'week' ? (
              <span>{getMonthYearString(currentReferenceDate)}</span>
            ) : (
              <span className="text-emerald-800">{getMonthYearString(currentReferenceDate)}</span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 rounded-md hover:bg-emerald-50/20 transition-all"
            >
              Bugün
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white hover:text-emerald-700 text-slate-500 rounded-lg border border-transparent hover:border-slate-200 transition-all"
              title="Sonraki"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid rendering */}
        {viewMode === 'week' ? (
          /* Haftalık Görünüm (1 Hafta) */
          <div className="grid grid-cols-7 gap-1 sm:gap-2" id="calendar-days-grid">
            {weekDates.map((date, index) => {
              const dateStr = formatDateString(date);
              const isSelected = dateStr === selectedDate;
              const isToday = formatDateString(today) === dateStr;
              const plan = calendarPlans.find(p => p.date === dateStr);
              const totalCals = getDailyCalories(plan);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center p-1 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-white border-slate-200 text-slate-900 ring-2 ring-emerald-500 ring-offset-2 shadow-xs scale-102 font-semibold' 
                      : isToday
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                  id={`calendar-day-btn-${dateStr}`}
                >
                  <span className={`text-[9px] sm:text-xs uppercase font-bold ${isSelected ? 'text-slate-500' : 'text-slate-400'} mb-1`}>
                    {daysOfWeekTr[index]}
                  </span>
                  <span className="text-sm sm:text-xl font-bold font-display leading-none">
                    {date.getDate()}
                  </span>
                  {totalCals > 0 ? (
                    <div className="mt-1 flex flex-col items-center gap-0.5 w-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold leading-none text-center">
                        {totalCals}
                        <span className="hidden sm:inline"> kcal</span>
                      </span>
                      
                      {/* Visual list of meals on desktop */}
                      <div className="hidden lg:flex flex-col gap-0.5 mt-2 w-full border-t border-slate-100 pt-1.5 text-left text-[9px] leading-tight">
                        {plan?.breakfast && (
                          <div className="text-emerald-700 truncate font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{plan.breakfast.name}</span>
                          </div>
                        )}
                        {plan?.lunch && (
                          <div className="text-blue-700 truncate font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="truncate">{plan.lunch.name}</span>
                          </div>
                        )}
                        {plan?.dinner && (
                          <div className="text-orange-700 truncate font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                            <span className="truncate">{plan.dinner.name}</span>
                          </div>
                        )}
                        {plan?.snack && (
                          <div className="text-purple-700 truncate font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                            <span className="truncate">{plan.snack.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-transparent"></div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Aylık Görünüm (Tüm Ay - 42 Gün) */
          <div className="space-y-1">
            {/* Day labels for Month grid */}
            <div className="grid grid-cols-7 text-center pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {daysOfWeekTr.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            {/* 42 cells Month Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthDates.map((date, index) => {
                const dateStr = formatDateString(date);
                const isSelected = dateStr === selectedDate;
                const isToday = formatDateString(today) === dateStr;
                const isCurrentMonth = date.getMonth() === currentReferenceDate.getMonth();
                const plan = calendarPlans.find(p => p.date === dateStr);
                const totalCals = getDailyCalories(plan);

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      // Update ref date if user clicks date of adjacent month
                      if (!isCurrentMonth) {
                        setCurrentReferenceDate(date);
                      }
                    }}
                    className={`flex flex-col items-center justify-between p-1.5 sm:p-2.5 rounded-lg border transition-all duration-150 min-h-[50px] sm:min-h-[70px] ${
                      isSelected 
                        ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500 font-bold' 
                        : isToday
                          ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                          : isCurrentMonth
                            ? 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                            : 'bg-slate-50/80 border-slate-100 text-slate-400 hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="text-xs font-bold font-display self-start">
                      {date.getDate()}
                    </span>
                    {totalCals > 0 ? (
                      <div className="w-full flex flex-col items-center gap-0.5 mt-auto">
                        <span className={`text-[8px] sm:text-[9px] font-bold ${isToday ? 'text-emerald-100' : 'text-emerald-600'}`}>
                          {totalCals} <span className="hidden sm:inline">kcal</span>
                        </span>
                        <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`} />
                      </div>
                    ) : (
                      <div className="h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Day View & Calorie Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="daily-view-container">
        {/* Daily Summary Side Panel (Emerald Theme) */}
        <div className="bg-emerald-800 text-white p-6 rounded-2xl space-y-4 shadow-lg shadow-emerald-900/10 flex flex-col justify-between" id="calorie-progress-panel">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200/90 block mb-1">
              Günlük Kalori Hedefi
            </span>
            
            <div className="flex items-end gap-2.5 mt-2 mb-4">
              <span className="text-4xl font-bold font-display tracking-tight">{dailyCalories}</span>
              <span className="text-sm opacity-75 mb-1.5">/ 2000 Kcal</span>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-emerald-900/40 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-300 rounded-full transition-all duration-500" 
                  style={{ width: `${calPercentage}%` }}
                />
              </div>

              <p className="text-xs opacity-90 leading-relaxed">
                {dailyCalories >= 2000 ? (
                  <span className="text-amber-300 font-semibold">⚠️ Günlük hedef kaloriyi aştınız!</span>
                ) : (
                  <span>Günlük hedefinize ulaşmak için {2000 - dailyCalories} kcal kaldı.</span>
                )}
              </p>
            </div>

            {/* Health Info Details */}
            <div className="space-y-2 mt-6 pt-6 border-t border-emerald-700/50" id="nutrition-tips">
              <div className="flex items-center justify-between p-2.5 bg-emerald-900/20 rounded-lg text-xs">
                <span className="text-emerald-200 font-medium">Seçilen Gün:</span>
                <span className="font-semibold text-white">
                  {new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-emerald-900/20 rounded-lg text-xs">
                <span className="text-emerald-200 font-medium">Öğün Sayısı:</span>
                <span className="font-semibold text-white">
                  {currentPlan ? [currentPlan.breakfast, currentPlan.lunch, currentPlan.dinner, currentPlan.snack].filter(Boolean).length : 0} / 4 öğün
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-emerald-700/50 pt-4" id="calendar-summary-footer">
            <p className="text-[10px] text-emerald-200 text-center leading-relaxed">
              Öğünlere eklediğiniz tüm yemeklerin malzemeleri otomatik olarak <span className="font-semibold text-white underline">Alışveriş Listesine</span> eklenir.
            </p>
          </div>
        </div>

        {/* 4 Meal Slots Grid */}
        <div className="lg:col-span-2 space-y-4" id="meal-slots-grid">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
            const recipe = currentPlan ? currentPlan[mealType] : null;

            return (
              <div 
                key={mealType}
                className="bg-white rounded-xl p-4 shadow-xs border border-slate-100 hover:border-slate-250 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                id={`meal-slot-${mealType}`}
              >
                <div className="flex items-start gap-3.5">
                  {recipe ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 mt-0.5 border border-slate-100 shadow-xs relative bg-slate-50">
                      <img 
                        src={getFoodImage(recipe.name, recipe.category)} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 rounded-lg shrink-0 mt-0.5 animate-fadeIn">
                      {mealIcons[mealType]}
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {mealNameMap[mealType]}
                    </span>
                    {recipe ? (
                      <div 
                        onClick={() => {
                          setSelectedMealRecipe(recipe);
                          setCompletedSteps([]);
                        }}
                        className="cursor-pointer hover:text-emerald-700 group transition-colors"
                        title="Tarifi Görüntüle"
                      >
                        <h4 className="font-display font-semibold text-slate-800 text-sm group-hover:text-emerald-600 flex items-center gap-1.5">
                          {recipe.name}
                          <BookOpen className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-rose-500 fill-rose-500" />
                            {recipe.calories} kcal
                          </span>
                          {recipe.prepTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {recipe.prepTime} dk
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md">Tarifi Gör</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Planlanmış yemek yok</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {recipe ? (
                    <button
                      onClick={() => onRemoveMealFromPlan(selectedDate, mealType)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Öğünü Kaldır"
                      id={`remove-meal-${mealType}-btn`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenAddModal(mealType)}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all border border-slate-100"
                      id={`add-meal-${mealType}-btn`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Yemek Seç
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipe Add Modal */}
      {showAddModal && activeMealType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="recipe-picker-modal">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800 text-base">
                {mealNameMap[activeMealType]} için Yemek Seçin
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <input 
                type="text" 
                placeholder="Yemek veya kategori ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                id="modal-recipe-search"
              />
            </div>

            {/* Recipe List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between group"
                    id={`modal-select-recipe-${recipe.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative bg-slate-100">
                        <img 
                          src={getFoodImage(recipe.name, recipe.category)} 
                          alt={recipe.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase font-semibold">
                          {recipe.category || 'Yemek'}
                        </span>
                        <h5 className="font-display font-medium text-slate-800 text-xs mt-1 group-hover:text-emerald-800">
                          {recipe.name}
                        </h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {recipe.calories} kcal
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aramanıza uygun kayıtlı tarif bulunamadı. "Tarifler" sekmesinden yeni tarifler ekleyebilirsiniz!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal on Click */}
      {selectedMealRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="recipe-detail-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Modal Hero Image Header */}
            <div className="h-44 w-full overflow-hidden relative bg-slate-100 shrink-0">
              <img 
                src={getFoodImage(selectedMealRecipe.name, selectedMealRecipe.category)} 
                alt={selectedMealRecipe.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold tracking-wider uppercase shadow-sm">
                  {selectedMealRecipe.category || 'Tarif'}
                </span>
                <h3 className="font-display font-bold text-lg mt-1 text-white drop-shadow-md">
                  {selectedMealRecipe.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedMealRecipe(null)}
                className="absolute top-3 right-3 text-white hover:text-slate-200 text-xl font-bold bg-black/40 hover:bg-black/60 rounded-full h-8 w-8 flex items-center justify-center transition-all shadow-sm"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 leading-relaxed text-sm text-slate-600">
              {/* Recipe Stats Card */}
              <div className="grid grid-cols-3 gap-3 bg-emerald-50/40 rounded-xl p-3 border border-emerald-100/50 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">ENERJİ</span>
                  <span className="text-sm font-extrabold text-emerald-700">{selectedMealRecipe.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">HAZIRLIK</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedMealRecipe.prepTime || 15} dk</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">PORSİYON</span>
                  <span className="text-sm font-extrabold text-slate-700">{selectedMealRecipe.servings || 1} Kişilik</span>
                </div>
              </div>

              {/* Ingredients Checklist */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-emerald-600" /> Malzeme Listesi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedMealRecipe.ingredients?.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-700 truncate font-medium">{ing.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold ml-auto shrink-0 bg-white border border-slate-200 rounded px-1.5 py-0.2">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instruction checklist steps */}
              <div className="space-y-2 pt-1">
                <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-600" /> Hazırlanışı & Yapılışı
                </h4>
                <div className="space-y-2">
                  {selectedMealRecipe.instructions?.map((step, i) => {
                    const isStepCompleted = completedSteps.includes(i);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleToggleStep(i)}
                        className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isStepCompleted 
                            ? 'bg-emerald-50/30 border-emerald-200 opacity-60' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isStepCompleted 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 bg-white hover:border-emerald-500'
                          }`}
                        >
                          {isStepCompleted && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                        <div className="space-y-1">
                          <span className={`text-[10px] font-extrabold ${isStepCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            ADIM {i + 1}
                          </span>
                          <p className={`text-xs ${isStepCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedMealRecipe(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
