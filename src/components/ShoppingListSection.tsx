/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GroceryItem, DayPlan, Recipe } from '../types';
import { 
  Plus, 
  Trash2, 
  Check, 
  Square, 
  CheckSquare, 
  ShoppingBag, 
  Printer, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Layers,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

interface ShoppingListSectionProps {
  groceryList: GroceryItem[];
  calendarPlans: DayPlan[];
  onAddGroceryItem: (item: Omit<GroceryItem, 'id' | 'isCompleted'>) => void;
  onToggleGroceryItem: (id: string) => void;
  onDeleteGroceryItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onImportFromCalendar: () => void;
}

export default function ShoppingListSection({
  groceryList,
  calendarPlans,
  onAddGroceryItem,
  onToggleGroceryItem,
  onDeleteGroceryItem,
  onClearCompleted,
  onClearAll,
  onImportFromCalendar
}: ShoppingListSectionProps) {
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('1 adet');
  const [newItemCategory, setNewItemCategory] = useState<string>('Market');
  const [copied, setCopied] = useState<boolean>(false);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const categories = ['Tümü', 'Manav', 'Kasap', 'Şarküteri', 'Kuru Gıda', 'Market', 'Baharat', 'Dondurulmuş', 'Diğer'];
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Tümü');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddGroceryItem({
      name: newItemName.trim(),
      amount: newItemAmount.trim() || '1 adet',
      category: newItemCategory,
      source: 'manual'
    });

    setNewItemName('');
    setNewItemAmount('1 adet');
  };

  // Group items by category for displays
  const getGroupedItems = () => {
    const grouped: { [key: string]: GroceryItem[] } = {};
    
    // Filter first
    const filtered = groceryList.filter(item => 
      selectedFilterCategory === 'Tümü' || item.category === selectedFilterCategory
    );

    filtered.forEach(item => {
      const cat = item.category || 'Diğer';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    return grouped;
  };

  const groupedItems = getGroupedItems();

  // Stats
  const totalItems = groceryList.length;
  const completedItems = groceryList.filter(i => i.isCompleted).length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Copy shopping list text to clipboard
  const handleCopyList = () => {
    if (groceryList.length === 0) return;

    let text = "🛒 *ALIŞVERİŞ LİSTEM*\n";
    text += `📅 Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n`;
    text += `✅ Tamamlanma: ${completedItems}/${totalItems} (%${completionPercentage})\n\n`;

    // Group all by category for formatting
    const categoriesMap: { [key: string]: string[] } = {};
    groceryList.forEach(item => {
      const cat = item.category || 'Diğer';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      const checkbox = item.isCompleted ? "[x]" : "[ ]";
      categoriesMap[cat].push(`${checkbox} ${item.name} (${item.amount})`);
    });

    Object.entries(categoriesMap).forEach(([category, items]) => {
      text += `*${category.toUpperCase()}*\n`;
      items.forEach(itemStr => {
        text += `${itemStr}\n`;
      });
      text += `\n`;
    });

    text += "Yemek Listesi & Kalori Planlayıcı ile hazırlanmıştır.";

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6" id="shopping-list-section-root">
      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="shopping-stats-board">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplam Malzeme</span>
            <h4 className="text-2xl font-display font-bold text-slate-800">{totalItems} ürün</h4>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sepette Olanlar</span>
            <h4 className="text-2xl font-display font-bold text-slate-800">{completedItems} ürün</h4>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-center space-y-2">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Sepet Doluluk Oranı</span>
            <span className="text-emerald-600">% {completionPercentage}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="shopping-body-layout">
        {/* Left Side: Add Item Form & Actions */}
        <div className="space-y-4" id="shopping-actions-panel">
          {/* Quick Add */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h4 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Plus className="h-4 w-4 text-emerald-600" /> Malzeme Ekle
            </h4>

            <form onSubmit={handleManualAdd} className="space-y-3" id="quick-add-grocery-form">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Malzeme Adı</label>
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  placeholder="Örn: Sızma Zeytinyağı"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                  id="add-item-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Miktar</label>
                  <input 
                    type="text" 
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    required
                    placeholder="Örn: 1 şişe, 250 gr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                    id="add-item-amount"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Reyon/Kategori</label>
                  <select 
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-emerald-500 transition-all"
                    id="add-item-category"
                  >
                    <option value="Market">Market</option>
                    <option value="Manav">Manav</option>
                    <option value="Kasap">Kasap</option>
                    <option value="Şarküteri">Şarküteri</option>
                    <option value="Kuru Gıda">Kuru Gıda</option>
                    <option value="Baharat">Baharat</option>
                    <option value="Dondurulmuş">Dondurulmuş</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                id="submit-add-item-btn"
              >
                <Plus className="h-4 w-4" /> Ekle
              </button>
            </form>
          </div>

          {/* Sync & Share tools */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3" id="shopping-tools-box">
            <h4 className="font-display font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" /> Pratik Araçlar
            </h4>

            {/* Sync from Calendar */}
            <button
              onClick={onImportFromCalendar}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-emerald-100 transition-all"
              id="sync-calendar-grocery-btn"
            >
              <CalendarCheck className="h-4 w-4" />
              Takvimdeki Yemekleri İçeri Aktar
            </button>

            {/* Share / Copy plain text */}
            <button
              onClick={handleCopyList}
              disabled={groceryList.length === 0}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-50/50 disabled:text-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all"
              id="share-list-btn"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> Panoya Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" /> WhatsApp'a / Panoya Gönder
                </>
              )}
            </button>

            {/* Clear tools */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={onClearCompleted}
                disabled={completedItems === 0}
                className="py-1.5 border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-lg transition-all"
                id="clear-completed-btn"
              >
                Alınanları Temizle
              </button>
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 animate-fade-in justify-center">
                  <button
                    onClick={() => {
                      onClearAll();
                      setConfirmClearAll(false);
                    }}
                    className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    Sil!
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  disabled={groceryList.length === 0}
                  className="py-1.5 border border-rose-100 hover:border-rose-200 bg-rose-50/40 hover:bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  id="clear-all-list-btn"
                >
                  Tümünü Sil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Grocery list cards */}
        <div className="lg:col-span-2 space-y-4" id="shopping-display-panel">
          {/* Category Scroller filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" id="shopping-filters-scroller">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                  selectedFilterCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List display */}
          <div className="space-y-4" id="shopping-list-items-container">
            {groceryList.length > 0 ? (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl border border-slate-100 p-4 shadow-2xs space-y-2.5">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-50 pb-1.5 flex items-center gap-1">
                    📁 {category}
                  </h5>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-100/80 rounded-xl group transition-all hover:bg-slate-50 cursor-pointer ${
                          item.isCompleted ? 'opacity-60 bg-slate-50/30' : ''
                        }`}
                        id={`grocery-item-${item.id}`}
                      >
                        <div className="flex items-center gap-3" onClick={() => onToggleGroceryItem(item.id)}>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-emerald-600 transition-all shrink-0"
                            id={`toggle-item-checkbox-${item.id}`}
                          >
                            {item.isCompleted ? (
                              <CheckSquare className="h-4.5 w-4.5 text-emerald-600" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-slate-300" />
                            )}
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold text-slate-700 ${item.isCompleted ? 'line-through text-slate-400' : ''}`}>
                              {item.name}
                            </span>
                            <span className="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold uppercase">
                              {item.amount}
                            </span>
                            {item.source === 'calendar' && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded-md font-medium" title="Takvimdeki yemeklerden aktarıldı">
                                Takvim
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteGroceryItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                          title="Ürünü Listeden Sil"
                          id={`delete-grocery-item-${item.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-slate-50 text-slate-300 rounded-full">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h5 className="font-display font-semibold text-slate-700 text-sm">Alışveriş listeniz boş</h5>
                  <p className="text-[11px] leading-relaxed">
                    Yukarıdaki "Takvimdeki Yemekleri İçeri Aktar" butonuna basarak haftalık menünüzün malzemelerini otomatik yükleyebilir veya soldaki formdan manuel ürünler ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
