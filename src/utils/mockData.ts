/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recipe } from '../types';

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: "rec-1",
    name: "Mercimek Çorbası",
    calories: 140,
    prepTime: 25,
    category: "Çorba",
    ingredients: [
      { name: "Kırmızı Mercimek", amount: "1 su bardağı", category: "Kuru Gıda" },
      { name: "Kuru Soğan", amount: "1 adet", category: "Manav" },
      { name: "Havuç", amount: "1 adet", category: "Manav" },
      { name: "Zeytinyağı", amount: "2 yemek kaşığı", category: "Market" },
      { name: "Sıcak Su", amount: "5 su bardağı", category: "Diğer" },
      { name: "Tuz, Karabiber, Kimyon", amount: "1'er çay kaşığı", category: "Baharat" }
    ],
    instructions: [
      "Soğanı ve havucu küp küp doğrayıp zeytinyağında soteleyin.",
      "Yıkanmış mercimeği ekleyip 1-2 dakika daha karıştırın.",
      "Sıcak suyu ve baharatları ilave edip mercimekler yumuşayana kadar pişirin.",
      "Çorbayı pürüzsüz olana kadar blenderdan geçirin. Limonla servis yapın."
    ],
    isFavorite: true,
    servings: 4
  },
  {
    id: "rec-2",
    name: "Izgara Tavuk Göğsü",
    calories: 280,
    prepTime: 20,
    category: "Ana Yemek",
    ingredients: [
      { name: "Tavuk Göğsü", amount: "200 gr", category: "Kasap" },
      { name: "Zeytinyağı", amount: "1 yemek kaşığı", category: "Market" },
      { name: "Kekik", amount: "1 çay kaşığı", category: "Baharat" },
      { name: "Pulbiber", amount: "1 çay kaşığı", category: "Baharat" },
      { name: "Tuz", amount: "1/2 çay kaşığı", category: "Baharat" }
    ],
    instructions: [
      "Tavuk göğsünü ince dilimler halinde kesin.",
      "Zeytinyağı, kekik, pulbiber ve tuz ile marine edin.",
      "Isınmış döküm tavada her iki tarafını da 5-6 dakika pişirin.",
      "Sıcak olarak servis yapın."
    ],
    isFavorite: true,
    servings: 1
  },
  {
    id: "rec-3",
    name: "Zeytinyağlı Taze Fasulye",
    calories: 120,
    prepTime: 40,
    category: "Ana Yemek",
    ingredients: [
      { name: "Taze Fasulye", amount: "500 gr", category: "Manav" },
      { name: "Domates", amount: "2 adet", category: "Manav" },
      { name: "Kuru Soğan", amount: "1 adet", category: "Manav" },
      { name: "Zeytinyağı", amount: "4 yemek kaşığı", category: "Market" },
      { name: "Tuz", amount: "1 çay kaşığı", category: "Baharat" },
      { name: "Toz Şeker", amount: "1 çay kaşığı", category: "Market" }
    ],
    instructions: [
      "Fasulyelerin kılçıklarını temizleyip uzunlamasına dilimleyin.",
      "Kuru soğanı yemeklik, domatesleri ise küp doğrayın.",
      "Zeytinyağında soğanı soteleyin, ardından domates ve fasulyeleri ekleyin.",
      "Tuz, şeker ve yarım bardak sıcak su ilave ederek tencerenin kapağını kapatın.",
      "Kısık ateşte fasulyeler yumuşayana kadar yaklaşık 35 dakika pişirin."
    ],
    isFavorite: false,
    servings: 4
  },
  {
    id: "rec-4",
    name: "Yulaflı Meyveli Yoğurt",
    calories: 220,
    prepTime: 5,
    category: "Kahvaltı",
    ingredients: [
      { name: "Süzme Yoğurt", amount: "1 su bardağı", category: "Şarküteri" },
      { name: "Yulaf Ezmesi", amount: "3 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Bal", amount: "1 tatlı kaşığı", category: "Market" },
      { name: "Muz", amount: "1/2 adet", category: "Manav" },
      { name: "Ceviz İçi", amount: "2 adet", category: "Kuru Gıda" }
    ],
    instructions: [
      "Kaseye yoğurdu ekleyip pürüzsüz kıvama gelene kadar çırpın.",
      "Yulaf ezmesi ve balı ekleyip karıştırın.",
      "Üzerini muz dilimleri ve ceviz içiyle süsleyerek servis yapın."
    ],
    isFavorite: true,
    servings: 1
  },
  {
    id: "rec-5",
    name: "Fırında Somon",
    calories: 320,
    prepTime: 25,
    category: "Ana Yemek",
    ingredients: [
      { name: "Somon Fileto", amount: "1 dilim (150gr)", category: "Kasap" },
      { name: "Limon", amount: "1/2 adet", category: "Manav" },
      { name: "Zeytinyağı", amount: "1 tatlı kaşığı", category: "Market" },
      { name: "Defne Yaprağı", amount: "1 adet", category: "Baharat" },
      { name: "Tuz ve Karabiber", amount: "1/2 çay kaşığı", category: "Baharat" }
    ],
    instructions: [
      "Somon dilimini zeytinyağı, tuz ve karabiber ile ovun.",
      "Yağlı kağıt serili fırın tepsisine somonu yerleştirin.",
      "Üzerine limon dilimleri ve defne yaprağını koyun.",
      "Önceden ısıtılmış 200 derece fırında 15-18 dakika pişirin."
    ],
    isFavorite: false,
    servings: 1
  },
  {
    id: "rec-6",
    name: "Nohutlu Pirinç Pilavı",
    calories: 340,
    prepTime: 25,
    category: "Ana Yemek",
    ingredients: [
      { name: "Baldo Pirinç", amount: "1 su bardağı", category: "Kuru Gıda" },
      { name: "Haşlanmış Nohut", amount: "1/2 su bardağı", category: "Kuru Gıda" },
      { name: "Tereyağı", amount: "1.5 yemek kaşığı", category: "Şarküteri" },
      { name: "Zeytinyağı", amount: "1 yemek kaşığı", category: "Market" },
      { name: "Sıcak Su", amount: "1.5 su bardağı", category: "Diğer" },
      { name: "Tuz", amount: "1 çay kaşığı", category: "Baharat" }
    ],
    instructions: [
      "Pirinçleri sıcak tuzlu suda 15 dakika bekletip süzün.",
      "Tencerede tereyağı ve zeytinyağını eritin, süzülen pirinçleri ekleyip şeffaflaşana kadar kavurun.",
      "Haşlanmış nohutları, sıcak suyu ve tuzu ekleyin.",
      "Tencerenin kapağını kapatıp kaynayana kadar orta ateşte, ardından kısık ateşte suyunu çekene kadar pişirin.",
      "10-15 dakika demlendirip servis yapın."
    ],
    isFavorite: false,
    servings: 4
  },
  {
    id: "rec-7",
    name: "Akdeniz Salatası",
    calories: 90,
    prepTime: 10,
    category: "Salata",
    ingredients: [
      { name: "Göbek Marul", amount: "1/2 adet", category: "Manav" },
      { name: "Salatalık", amount: "1 adet", category: "Manav" },
      { name: "Çeri Domates", amount: "5 adet", category: "Manav" },
      { name: "Siyah Zeytin", amount: "5 adet", category: "Şarküteri" },
      { name: "Beyaz Peynir", amount: "50 gr", category: "Şarküteri" },
      { name: "Sızma Zeytinyağı", amount: "1 yemek kaşığı", category: "Market" },
      { name: "Limon Suyu", amount: "1 yemek kaşığı", category: "Manav" }
    ],
    instructions: [
      "Marulu, salatalığı ve domatesleri yıkayıp dilediğiniz boyutta doğrayın.",
      "Salata kasesine alın, üzerine ufaladığınız beyaz peyniri ve zeytinleri ekleyin.",
      "Zeytinyağı ve limon suyunu çırparak üzerine gezdirip karıştırın."
    ],
    isFavorite: false,
    servings: 2
  },
  {
    id: "rec-8",
    name: "Izgara Ev Köftesi",
    calories: 310,
    prepTime: 25,
    category: "Ana Yemek",
    ingredients: [
      { name: "Dana Kıyma", amount: "300 gr", category: "Kasap" },
      { name: "Kuru Soğan", amount: "1 adet", category: "Manav" },
      { name: "Ekmek İçi", amount: "2 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Yumurta", amount: "1 adet", category: "Şarküteri" },
      { name: "Maydanoz", amount: "1/4 demet", category: "Manav" },
      { name: "Kimyon, Karbonat, Karabiber", amount: "1'er çay kaşığı", category: "Baharat" }
    ],
    instructions: [
      "Soğanı rendeleyip suyunu sıkın.",
      "Tüm malzemeleri derin bir kapta 10 dakika boyunca yoğurun.",
      "Köfte harcını buzdolabında yarım saat dinlendirin.",
      "Ceviz büyüklüğünde parçalar koparıp şekil verin ve yağsız tavada pişirin."
    ],
    isFavorite: true,
    servings: 3
  },
  {
    id: "rec-9",
    name: "Zeytinyağlı Enginar",
    calories: 150,
    prepTime: 35,
    category: "Ana Yemek",
    ingredients: [
      { name: "Enginar Çanağı", amount: "4 adet", category: "Manav" },
      { name: "Garnitür (Bezelye, Havuç, Patates)", amount: "1 su bardağı", category: "Market" },
      { name: "Arpacık Soğan", amount: "8 adet", category: "Manav" },
      { name: "Sızma Zeytinyağı", amount: "4 yemek kaşığı", category: "Market" },
      { name: "Dereotu", amount: "1/2 demet", category: "Manav" },
      { name: "Portakal Suyu", amount: "1/2 su bardağı", category: "Manav" }
    ],
    instructions: [
      "Enginar çanaklarını limonlu suda bekletin.",
      "Geniş bir tencereye enginarları dizin, üzerlerine sotelediğiniz arpacık soğanları ve garnitürü paylaştırın.",
      "Zeytinyağı, portakal suyu ve tuzu ekleyip kısık ateşte enginarlar yumuşayana kadar pişirin.",
      "Üzerine ince kıyılmış dereotu serperek soğuk servis edin."
    ],
    isFavorite: false,
    servings: 4
  },
  {
    id: "rec-10",
    name: "Fit Muzlu Pankek",
    calories: 190,
    prepTime: 15,
    category: "Kahvaltı",
    ingredients: [
      { name: "Olgun Muz", amount: "1 adet", category: "Manav" },
      { name: "Yumurta", amount: "1 adet", category: "Şarküteri" },
      { name: "Yulaf Unu", amount: "4 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Süt", amount: "3 yemek kaşığı", category: "Şarküteri" },
      { name: "Kabartma Tozu", amount: "1/2 çay kaşığı", category: "Market" }
    ],
    instructions: [
      "Muzu çatal yardımıyla pürüzsüz olana kadar ezin.",
      "Yumurta, yulaf unu, süt ve kabartma tozunu ekleyip çırpın.",
      "Teflon tavayı hafifçe yağlayıp kaşık yardımıyla döktüğünüz harcı arkalı önlü pişirin.",
      "Meyveler ve bal eşliğinde servis edin."
    ],
    isFavorite: false,
    servings: 2
  },
  {
    id: "rec-11",
    name: "Chia Çilekli Puding",
    calories: 160,
    prepTime: 10,
    category: "Tatlı",
    ingredients: [
      { name: "Chia Tohumu", amount: "3 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Badem Sütü", amount: "1 su bardağı", category: "Market" },
      { name: "Taze Çilek", amount: "6 adet", category: "Manav" },
      { name: "Akçaağaç Şurubu veya Bal", amount: "1 tatlı kaşığı", category: "Market" }
    ],
    instructions: [
      "Bir kapta badem sütü, chia tohumu ve balı karıştırın.",
      "Karışımı 15 dakika arayla iki kez karıştırıp buzdolabında en az 4 saat (tercihen bir gece) bekletin.",
      "Puding jelleştiğinde çilek püresi ve çilek dilimleriyle katmanlar halinde bardağa doldurup servis yapın."
    ],
    isFavorite: true,
    servings: 1
  },
  {
    id: "rec-12",
    name: "Fırın Sebzeli Mücver",
    calories: 130,
    prepTime: 30,
    category: "Aperatif",
    ingredients: [
      { name: "Kabak", amount: "3 adet", category: "Manav" },
      { name: "Taze Soğan", amount: "3 dal", category: "Manav" },
      { name: "Dereotu", amount: "1/2 demet", category: "Manav" },
      { name: "Tam Buğday Unu", amount: "3 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Yumurta", amount: "2 adet", category: "Şarküteri" },
      { name: "Beyaz Peynir", amount: "80 gr", category: "Şarküteri" }
    ],
    instructions: [
      "Kabakları rendeleyin ve sularını avucunuzla sıkarak tamamen çıkarın.",
      "Derin bir kapta ince kıyılmış dereotu, taze soğan, yumurta, un ve ufalanmış peynirle birleştirin.",
      "Fırın tepsisine yağlı kağıt serip harçtan kaşık kaşık porsiyonlar halinde dökün.",
      "180 derece fırında üzerleri kızarana kadar yaklaşık 20-25 dakika pişirin."
    ],
    isFavorite: false,
    servings: 4
  },
  {
    id: "rec-13",
    name: "Sütlü Domates Çorbası",
    calories: 110,
    prepTime: 20,
    category: "Çorba",
    ingredients: [
      { name: "Olgun Domates", amount: "4 adet", category: "Manav" },
      { name: "Tereyağı", amount: "1 yemek kaşığı", category: "Şarküteri" },
      { name: "Un", amount: "1.5 yemek kaşığı", category: "Kuru Gıda" },
      { name: "Süt", amount: "1/2 su bardağı", category: "Şarküteri" },
      { name: "Sıcak Su veya Sebze Suyu", amount: "3 su bardağı", category: "Diğer" },
      { name: "Rende Kaşar Peyniri", amount: "30 gr", category: "Şarküteri" }
    ],
    instructions: [
      "Tereyağını tencerede eritin ve unu kokusu çıkana kadar kavurun.",
      "Rendelenmiş domatesleri ekleyip 5 dakika daha soteleyin.",
      "Sıcak suyu ekleyin ve kaynamaya bırakın, kaynadıktan sonra 10 dakika kısık ateşte pişirin.",
      "Çorbayı blenderdan geçirin, ardından yavaşça sütü ilave ederek karıştırın ve bir taşım daha kaynatın.",
      "Üzerine rendelenmiş kaşar peyniri serperek sıcak servis edin."
    ],
    isFavorite: false,
    servings: 4
  }
];
