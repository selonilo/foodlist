# Ürün Gereksinimleri Dokümanı (PRD) - Yapay Zeka Destekli Yemek Planlama ve Diyet Asistanı

Bu doküman, Yapay Zeka Destekli Yemek Planlama, Diyet ve Şef Asistanı web uygulamasının işlevsel gereksinimlerini, mimarisini, veri tabanı şemasını, tasarım dilini ve entegrasyon süreçlerini tanımlamaktadır.

---

## 1. Ürün Özeti & Vizyonu
Kullanıcıların haftalık yemek listelerini kolayca planlamalarını, yapay zeka yardımıyla kişiselleştirilmiş tarifler oluşturmalarını, akıllı kalori analizi yapmalarını ve alışveriş listelerini otomatik yönetmelerini sağlayan, **bireysel ve grup/aile odaklı** bir dijital sağlık ve mutfak asistanıdır.

### Temel Hedefler
- **Sıfır Sürtünme ile Planlama:** Kullanıcıların saniyeler içinde kahvaltı, öğle yemeği, akşam yemeği ve ara öğün planlaması yapabilmesi.
- **Güçlü Yapay Zeka Asistanı (Diyetisyen & Şef):** Hem genel yemek planlaması hem de anlık dostane sohbetler (teşekkür, selamlaşma, yerel hitaplar dahil) yapabilen akıllı diyetisyen motoru.
- **Yüksek Görsel Kalite:** Her yemeğin adına veya kategorisine uygun yüksek kaliteli görselleri (Unsplash ve dinamik fallback API'leri aracılığıyla) otomatik eşleştirme.
- **Alışveriş Kolaylığı:** Yemek planına eklenen tariflerdeki malzemelerin otomatik olarak alışveriş listesine yansıtılması.
- **Taşınabilirlik:** Haftalık listeleri ve öğün detaylarını tek bir dokunuşla temiz ve düzenli bir **PDF çıktısı** olarak alabilme.
- **Akıllı Kamera Analizi (OCR & Vision):** Kullanıcının yediği yemeğin fotoğrafını çekerek kalori, makro besin ve porsiyon değerlerini anında analiz eden görüntü işleme motoru.

---

## 2. Kullanıcı Deneyimi & Tasarım Sistemi (Design System)

Uygulama, göz yormayan, doğal ve sağlıklı beslenmeyi çağrıştıran **Emerald (Zümrüt Yeşili) ve Slate (Arduvaz Grisi)** renk paleti üzerine kurulmuş modern bir arayüze sahiptir.

### Renk Paleti
- **Primary (Ana Renk):** `Emerald-500` (`#10B981`) ve `Emerald-600` (`#059669`) - Canlılık, tazelik ve sağlıklı yaşam hissi uyandırır.
- **Secondary (Destekleyici Renk):** `Amber-500` (`#F59E0B`) ve `Rose-500` (`#F43F5E`) - Kalori göstergeleri, uyarılar ve özel gün vurguları için kullanılır.
- **Arka Plan ve Kartlar:** `Slate-50` (`#F8FAFC`) ile `White` (`#FFFFFF`) - Geniş negatif alanlar sunarak içeriğin öne çıkmasını sağlar.
- **Tipografi:** `Slate-800` (`#1E293B`) birincil metin, `Slate-400` (`#94A3B8`) ise ikincil etiketler için tercih edilir.

### Tipografi (Typography Match)
- **Başlıklar (Headings):** "Inter" (sans-serif), `font-sans font-medium tracking-tight text-slate-800`.
- **Sistem Verileri & Kaloriler:** "JetBrains Mono" (monospace), `font-mono text-xs text-slate-500`.

### Animasyonlar & Geçişler (Motion)
- **Framer Motion (`motion/react`):** Sayfa geçişlerinde yumuşak sönümleme (fade-in), diyetisyen sohbet ekranındaki yeni mesajların akışı ve modal pencerelerin açılışında ölçeklenme (`scale-in`) efektleri kullanılmıştır.
- **Mikro Etkileşimler:** Butonların üzerine gelindiğinde (`hover:scale-[1.02]`) ve tıklatıldığında hafif basılma geri bildirimi verilir.

---

## 3. Sistem Mimarisi & Firebase Bağlantısı

Uygulama, **Full-Stack (Express v4 + Vite + React 18)** mimarisiyle çalışır. İstemci tarafı ile sunucu tarafı arasındaki gizli anahtar (API Keys) güvenliği, sunucu tarafında barındırılan proxy API rotalarıyla korunur.

### Sunucu Altyapısı (`server.ts`)
- **Express Server:** Port `3000` ve `0.0.0.0` hostu üzerinde çalışır.
- **Dosya Yükleme Sınırı:** Kullanıcıların yüksek çözünürlüklü yemek fotoğraflarını yükleyebilmesi için JSON ve urlencoded limitleri `50mb` olarak yapılandırılmıştır.
- **Vite Middleware:** Geliştirme aşamasında HMR olmaksızın Vite middleware'i üzerinden statik dosyaları sunar. Üretim ortamında (Production) ise `dist/` klasörü üzerinden optimize edilmiş çıktıları statik olarak dağıtır.

### Veri Tabanı Mimarisi (Cloud Firestore)
Veriler, kullanıcıların ortak grup yapılarıyla senkronize olabilmesi amacıyla **Firebase Firestore** üzerinde depolanır.

#### Firestore Şeması

##### 1. `users` Koleksiyonu
Kullanıcı profillerini ve hanehalkı/grup eşleştirmelerini barındırır.
```json
{
  "uid": "user_auth_id_123",
  "email": "user@example.com",
  "displayName": "Kullanıcı Adı",
  "groupId": "group_shared_abc",
  "createdAt": "timestamp"
}
```

##### 2. `recipes` Koleksiyonu
Sistemdeki tüm yemek tariflerini barındırır. Seed veriler (varsayılan sağlıklı Türk mutfağı tarifleri) ve yapay zeka ile kullanıcı tarafından elle eklenen tüm tarifler bu koleksiyonda saklanır.
```json
{
  "id": "rec-12345",
  "name": "Mercimek Çorbası",
  "category": "Çorba",
  "calories": 140,
  "prepTime": 25,
  "ingredients": [
    { "name": "Kırmızı Mercimek", "amount": "1 su bardağı" },
    { "name": "Kuru Soğan", "amount": "1 adet" }
  ],
  "instructions": [
    "Soğanları pembeleşene kadar soteleyin.",
    "Yıkanmış mercimekleri ve suyu ekleyip yumuşayana kadar pişirin.",
    "Blenderdan geçirip sıcak servis edin."
  ],
  "groupId": "group_shared_abc"
}
```

##### 3. `calendarPlans` Koleksiyonu
Tarih bazlı (YYYY-MM-DD formatında) kahvaltı, öğle, akşam ve ara öğün planlarını içerir.
```json
{
  "id": "plan-group_shared_abc-2026-07-01",
  "groupId": "group_shared_abc",
  "date": "2026-07-01",
  "breakfast": { "id": "rec-123", "name": "Omlet", "calories": 180 },
  "lunch": { "id": "rec-456", "name": "Izgara Tavuklu Salata", "calories": 320 },
  "dinner": null,
  "snack": null
}
```

##### 4. `shoppingList` Koleksiyonu
Ortak alışveriş listesidir. Takvime eklenen yemeklerin malzemeleri `source: "calendar"` etiketiyle, kullanıcının elle ekledikleri ise `source: "manual"` etiketiyle depolanır.
```json
{
  "id": "shop-item-999",
  "groupId": "group_shared_abc",
  "name": "Kırmızı Mercimek",
  "amount": "1 su bardağı",
  "checked": false,
  "source": "calendar",
  "recipeId": "rec-12345"
}
```

---

## 4. Temel Özellikler (Core Features)

### A. Otomatik Akıllı Yemek Görseli Eşleştirici
*   **Çalışma Mantığı:** `src/utils/imageHelper.ts` modülü, yemek tarifinin adını analiz eder.
*   **Seçici Katmanlar:**
    1.  *Öncelikli Eşleştirme:* Popüler Türk mutfağı yemekleri (Mercimek Çorbası, Izgara Tavuk, Kebaplar, Menemen, Köfte vb.) için yüksek çözünürlüklü ve telifsiz Unsplash görsel URL'leri kullanılır.
    2.  *Kategori Eşleştirmesi:* Çorbalar, kahvaltılıklar, tatlılar ve salatalar için genel kaliteli kategori görselleri atanır.
    3.  *Gelişmiş Dinamik Fallback:* Yukarıdaki hiçbir koşula uymayan yeni/egzotik yemekler için yemeğin adı otomatik olarak İngilizce mutfak terimlerine çevrilir ve benzersiz bir metin hash kodu kullanılarak `loremflickr.com` üzerinden kilitli (stable lock-seed) yüksek çözünürlüklü yemek fotoğrafları dinamik olarak getirilir. Böylece **resimsiz hiçbir yemek tarifi kalmaz.**

### B. PDF Dışa Aktarma Modülü (PDF Export)
*   **Kütüphane:** Client tarafında çalışan hafif ve güçlü `jspdf` kütüphanesi kullanılmıştır.
*   **Özellikler:**
    *   Haftalık takvimi tek tıklamayla indirme düğmesi (`PDF İndir`).
    *   **Türkçe Karakter Optimizasyonu:** PDF çıktısında oluşabilecek karakter bozulmalarını engellemek amacıyla özel bir transliterasyon filtresi (`cleanText`) uygulanır.
    *   **Zümrüt Yeşili (Emerald) Tema Entegrasyonu:** PDF başlığı, tarih aralığı, gün bölmeleri ve kalori göstergeleri uygulamanın kurumsal kimliğiyle eşleşen şık bir tasarıma sahiptir.
    *   **Sayfa Taşması Koruması (Page-break handling):** Gün detaylarının uzunluğuna göre sayfa boyutu dinamik kontrol edilir ve taşma durumlarında yeni sayfa otomatik oluşturulur.

### C. Gelişmiş Sohbet Asistanı (Yapay Zeka Şef & Diyetisyen)
*   **İletişim Algoritması:** `/api/assistant-chat` API rotası üzerinden çalışır.
*   **Doğal Türkçe ve Samimi Hitap Karşılama:**
    *   Kullanıcının samimi, yöresel veya kısa teşekkür/selamlama ifadeleri (`eyv`, `eyvallah`, `sağol`, `merhaba`, `tşk` vb.) hızlı yanıt kontrol mekanizması ile anında yakalanır.
    *   Yapay zeka, kullanıcıya tarif şablonu dayatmak yerine doğrudan cana yakın, dostane ve sıcak bir Türkçe ile ("Eyvallah! Rica ederim, her zaman buradayım...", "Siz de sağ olun! Afiyet olsun...") cevap verir.
*   **Akıllı Kesinti Koruması:** Gemini API bağlantısında veya internet erişiminde bir sorun oluştuğunda sistem çökmek yerine kullanıcıya kalori, protein alternatifleri ve metabolizma canlandırıcı gıdalar hakkında zengin içerikli yerel yedek yanıtlar (fallback responses) sunar.

### D. Akıllı Kamera Analizi (Meal Scanner)
*   **Hata Giderme:** Base64 formatında gönderilen yüksek boyutlu görüntülerin Express sunucu tarafında `PayloadTooLarge` hatasına sebep olmaması için sunucunun JSON gövde okuma limiti `50mb` değerine çekilmiştir.
*   **Analiz:** Gemini vision modelleri ile yüklenen tabak fotoğrafının içindeki porsiyonlar, malzemeler, protein, karbonhidrat, yağ ve toplam kalori değerleri saniyeler içinde çözümlenerek listelenir.

---

## 5. Uygulama Ekranları ve Görünümleri (Application Screens & Views)

Uygulama, hem masaüstü hem de mobil uyumlu (responsive) olarak tasarlanmış 5 ana ekrandan ve ortak bir yönetim panelinden oluşmaktadır:

### A. Giriş & Kayıt Ekranı (Auth Screen - `/src/components/Auth.tsx`)
*   **Açıklama:** Kullanıcıların e-posta ve şifre ile giriş yapabildiği ya da yeni bir hesap oluşturabildiği karşılama ekranıdır.
*   **Özellikler:**
    *   Hızlı, duyarlı ve göz alıcı kart tasarımı.
    *   Şifre doğrulama ve gerçek zamanlı hata bildirimleri.
    *   İlk hesap açılışında rastgele 6 haneli benzersiz bir ortak grup ID'si (`groupId`) atayarak aileyi otomatik kurar.

### B. Haftalık Plan Takvimi (Weekly Calendar View - `/src/components/MealCalendar.tsx`)
*   **Açıklama:** Kullanıcının haftalık öğün planlarını (Pazartesi - Pazar) gün gün yönettiği birincil kontrol panelidir.
*   **Özellikler:**
    *   Her gün için **Kahvaltı**, **Öğle Yemeği**, **Akşam Yemeği** ve **Ara Öğün** planlaması.
    *   Öğünlere tarif listesinden kolayca yemek atama veya mevcut yemeği silme.
    *   **AI Diyetisyen Önerisi:** Günlük kalori hedefine (örn. 2000 kcal) ve diyet amacına (Kilo Verme, Kilo Alma vb.) uygun 1 günlük veya 7 günlük (Haftalık) yemek planını otomatik oluşturma düğmesi.
    *   **PDF İndir Düğmesi:** Tüm haftanın planını temiz, estetik ve Türkçe karakterleri optimize edilmiş bir PDF belgesi halinde bilgisayara/telefona kaydetme yeteneği.

### C. Yemek Tarifleri Kütüphanesi (Recipes Section - `/src/components/RecipesSection.tsx`)
*   **Açıklama:** Kullanıcıların kendi sağlıklı yemek tariflerini sakladığı, düzenlediği ve yeni tarifler eklediği ekrandır.
*   **Özellikler:**
    *   Kategori filtreleme (Çorbalar, Ana Yemekler, Salatalar, Tatlılar, Kahvaltılıklar, Ara Öğünler).
    *   Favorilere ekleme (kalp ikonu ile) ve detaylı arama çubuğu.
    *   Tarif ekleme formu (Malzemeler, porsiyon, hazırlanış adımları ve kalori bilgisi ile birlikte).
    *   Otomatik akıllı görsel eşleştirici ile tarif adına göre Unsplash veya LoremFlickr'dan görselleri otomatik çekme.
    *   Tarif içerisindeki malzemeleri tek tıklamayla Alışveriş Listesine aktarma butonu.

### D. Akıllı Alışveriş Listesi (Shopping List - `/src/components/ShoppingListSection.tsx`)
*   **Açıklama:** Yemek planı ve manuel eklemelerden beslenen ortak pazar alışverişi takip ekranıdır.
*   **Özellikler:**
    *   Kategori bazlı akıllı gruplama (Manav, Kasap, Süt Ürünleri, Kuru Gıda, Market vb.).
    *   Satın alınan malzemeleri işaretleme (checkbox) ve üzerini çizerek gizleme/gösterme seçeneği.
    *   **Takvimden Otomatik İçe Aktarma:** Haftalık takvime eklenen yemeklerin tüm eksik malzemelerini otomatik olarak tek tıklamayla listeye yükleme.
    *   Manuel malzeme ekleme, tamamlananları temizleme ve tüm listeyi sıfırlama butonları.

### E. AI Diyetisyen & Şef Sohbet Odası (AI Assistant Chat - `/src/components/AIAssistant.tsx`)
*   **Açıklama:** Kullanıcının beslenme, diyet, spor ve yemek tarifleri hakkında serbestçe sohbet edebildiği akıllı yapay zeka asistanıdır.
*   **Özellikler:**
    *   Sürekli ve akıcı konuşma geçmişi (mesaj baloncukları formatında).
    *   Cana yakın, profesyonel, dostane bir Türk diyetisyen ve usta şef kişiliği.
    *   Anlık hızlı selamlama ve teşekkür filtreleri (`eyv`, `sağol`, `selam` vb.).
    *   İnternet kesintisi veya API sorunlarında devreye giren zengin yedekli (fallback) kalori ve besin tavsiyeleri.

### F. AI Kalori Tarayıcı (AI Meal Scanner - `/src/components/MealScanner.tsx`)
*   **Açıklama:** Kullanıcının tabağındaki yemeğin fotoğrafını yükleyerek kalori değerlerini saniyeler içinde analiz ettirdiği modern vizyon asistanıdır.
*   **Özellikler:**
    *   Sürükle-bırak veya dosya seçme yoluyla resim yükleme.
    *   Yüklenen tabak görselinden porsiyon tahmini, protein, karbonhidrat, yağ ve toplam kalori analizi yapılması.
    *   Analiz edilen yemeği tek tıkla doğrudan **Yemek Tariflerim** kütüphanesine kaydetme ve takvimde kullanabilme imkanı.

### G. Ortak Aile Grubu Yöneticisi (Family Group Manager - `/src/components/GroupManager.tsx`)
*   **Açıklama:** Uygulamanın en güçlü yanlarından biri olan, verilerin aile bireyleri arasında gerçek zamanlı ortaklaşa kullanılmasını sağlayan yönetim panelidir.
*   **Özellikler:**
    *   **Grup ID Paylaşımı:** Eşsiz aile kodunu panoya kopyalayarak diğer aile üyelerini davet etme.
    *   **Grup Değiştirme / Katılma:** Başka bir aile grubunun kodunu girerek o ailenin ortak yemek listesine, takvimine ve pazar alışverişine anında dahil olma.
    *   **Grup Üyeleri Listesi:** Gruba kayıtlı tüm aile üyelerinin isimlerini ve e-postalarını gerçek zamanlı listeleme ve üye çıkarma yetkisi.
    *   Güvenli çıkış yapma düğmesi.

---

## 6. Gelecek Yol Haritası & İyileştirmeler

1.  **Su Tüketim Takibi:** Günlük hidrasyon seviyesini izlemek için etkileşimli bir su bardağı animasyonlu takip ekranı.
2.  **Google Fit / Apple Health Entegrasyonu:** Kullanıcının yaktığı aktif kalorileri otomatik olarak takvime yansıtarak net kalori bütçesini hesaplama.
3.  **Kişiselleştirilmiş Alerjen Filtreleri:** Glüten, laktoz veya kuruyemiş hassasiyeti olan aile üyeleri için tarif önerilerinde otomatik alerjen uyarısı.
