/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Apple, 
  Flame, 
  ChefHat,
  HelpCircle,
  Dumbbell,
  Trash2
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ai_assistant_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
      }
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
    return [
      {
        role: 'model',
        text: "Merhaba! Ben sizin kişisel Yapay Zeka Diyetisyen ve Şef asistanınızım. 🍳🍏\n\nHangi yemeğin kalorisini hesaplamak istersiniz, bu haftaki diyetiniz için ne gibi sağlıklı ikameler istersiniz veya hangi malzemelerle ne pişirebileceğinizi mi öğrenmek istersiniz? Bana her şeyi sorabilirsiniz!",
        timestamp: new Date()
      }
    ];
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Save messages to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving chat messages:", e);
    }
  }, [messages]);

  const quickPrompts = [
    { text: "Pratik 300 kcal akşam yemeği öner", icon: <Flame className="h-3 w-3 text-rose-500" /> },
    { text: "Tavuk yerine ne protein kullanabilirim?", icon: <Apple className="h-3 w-3 text-emerald-500" /> },
    { text: "Evdeki patates, domates ve kıymayla ne pişer?", icon: <ChefHat className="h-3 w-3 text-blue-500" /> },
    { text: "Yağ yakımını hızlandıran besinler nelerdir?", icon: <Dumbbell className="h-3 w-3 text-amber-500" /> }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: textToSend
        })
      });

      if (!response.ok) {
        throw new Error('Asistan şu anda yanıt veremiyor. Lütfen daha sonra deneyin.');
      }

      const data = await response.json();
      const modelResponseText = data.text || "Sorunuzu anladım. Size yardımcı olmaktan mutluluk duyarım!";

      setMessages(prev => [...prev, {
        role: 'model',
        text: modelResponseText,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      console.warn("AI Assistant chat error, using localized recipe advisor response:", error);
      
      // Smart local advisor mock
      let fallbackText = "Harika bir soru! Sağlıklı yaşam ve beslenme hedefleriniz için size destek olmaktan mutluluk duyarım.\n\n";
      if (textToSend.toLowerCase().includes("kalori") || textToSend.toLowerCase().includes("kcal")) {
        fallbackText += "Yemeklerin kalori dengesini kurmak için protein ağırlıklı beslenmek ve porsiyon kontrolü yapmak çok önemlidir. Sebze çorbaları (mercimek, tarhana, brokoli) ortalama 100-150 kcal aralığındadır. Izgara tavuk veya somon ise porsiyon başına 250-300 kcal civarı enerji verir. Lifli gıdalar tok kalmanızı kolaylaştırır.";
      } else if (textToSend.toLowerCase().includes("tavuk") || textToSend.toLowerCase().includes("protein")) {
        fallbackText += "Tavuk göğsüne alternatif mükemmel bitkisel ve hayvansal protein kaynakları:\n- **Yeşil Mercimek**: 100 gramında yaklaşık 9 gram protein barındırır.\n- **Süzme Lor Peyniri**: Yağ oranı düşüktür, kazein proteini içerir.\n- **Hindi Füme**: Pratik ve yağsız bir alternatiftir.\n- **Tofu**: Vegan beslenenler için harika bir soya proteinidir.";
      } else if (textToSend.toLowerCase().includes("yağ yak") || textToSend.toLowerCase().includes("zayıf")) {
        fallbackText += "Metabolizmayı canlandırıp yağ yakımını destekleyen en popüler besinler:\n1. **Yeşil Çay**: İçerdiği antioksidanlar (özellikle EGCG) metabolizma hızını destekler.\n2. **Acı Biber**: Kapsaisin maddesi termojenik etki oluşturur.\n3. **Yulaf**: Yüksek lif oranı sindirimi düzenler ve tok tutar.\n4. **Zencefil & Zerdeçal**: Enflamasyonu önler ve dolaşımı rahatlatır.";
      } else {
        fallbackText += `"${textToSend}" hakkında size özel tavsiyem; taze mevsim sebzeleri ekleyerek lif oranını artırmanız, zeytinyağı kullanımını porsiyon başına 1 yemek kaşığıyla sınırlandırmanız ve her öğünde protein dengesine dikkat etmenizdir. Detaylı tarifler için "Tarifler" sekmemizden arama yapıp dilediğiniz öğünü takviminize kaydedebilirsiniz.`;
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: fallbackText,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[600px]" id="ai-assistant-root">
      {/* Active Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm">Yapay Zeka Diyetisyen & Şef</h4>
            <span className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full animate-ping" />
              Çevrimiçi • Gemini 3.5 Destekli
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showConfirmClear ? (
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg text-[10px]">
              <span className="text-white">Sıfırlansın mı?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.removeItem('ai_assistant_messages');
                  setMessages([
                    {
                      role: 'model',
                      text: "Merhaba! Ben sizin kişisel Yapay Zeka Diyetisyen ve Şef asistanınızım. 🍳🍏\n\nHangi yemeğin kalorisini hesaplamak istersiniz, bu haftaki diyetiniz için ne gibi sağlıklı ikameler istersiniz veya hangi malzemelerle ne pişirebileceğinizi mi öğrenmek istersiniz? Bana her şeyi sorabilirsiniz!",
                      timestamp: new Date()
                    }
                  ]);
                  setShowConfirmClear(false);
                }}
                className="bg-rose-500 hover:bg-rose-600 px-1.5 py-0.5 rounded text-white font-bold transition-colors"
              >
                Evet
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmClear(false);
                }}
                className="bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-white transition-colors"
              >
                Hayır
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-emerald-100 hover:text-white"
              title="Sohbet Geçmişini Temizle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Sparkles className="h-5 w-5 text-emerald-200" />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50" id="chat-messages-box">
        {messages.map((msg, index) => {
          const isModel = msg.role === 'model';

          return (
            <div 
              key={index}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                isModel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {isModel ? <ChefHat className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                isModel 
                  ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-xs shadow-3xs' 
                  : 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
              }`}>
                {/* Parse simple markdown like bolding or newlines */}
                <p className="whitespace-pre-line">
                  {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{chunk}</strong> : chunk)}
                </p>
                <span className={`block text-[9px] text-right ${isModel ? 'text-slate-400' : 'text-emerald-100'}`}>
                  {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[80%] mr-auto">
            <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl text-xs rounded-tl-xs shadow-3xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" />
              </div>
              <span className="text-slate-400 font-medium">Asistan tarifleri ve kalorileri hesaplıyor...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer input with Quick Prompts */}
      <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl space-y-3">
        {/* Quick Prompts list */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2" id="quick-chat-prompts">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                className="p-2 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-xl text-left text-[10px] text-slate-600 font-medium transition-all flex items-center gap-1.5"
              >
                {qp.icon}
                <span className="truncate">{qp.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
          className="flex items-center gap-2"
          id="chat-input-form"
        >
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Şefe sorun... (örn: Izgara levrek kaç kalori?)"
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-hidden transition-all"
            id="chat-text-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition-all shadow-sm"
            id="chat-send-btn"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
