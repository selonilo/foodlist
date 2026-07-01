/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to generate a stable hash code from any string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Convert common Turkish recipe names/ingredients to English query tags for dynamic food image APIs
function getEnglishFoodTag(recipeName: string): string {
  const name = recipeName.toLowerCase();
  if (name.includes("mercimek") || name.includes("ezogelin") || name.includes("tarhana") || name.includes("çorba") || name.includes("corba")) return "soup,lentils";
  if (name.includes("domates çorba") || name.includes("domates corba")) return "tomato,soup";
  if (name.includes("somon") || name.includes("balik") || name.includes("balık") || name.includes("levrek") || name.includes("çipura") || name.includes("cipura")) return "salmon,fish";
  if (name.includes("tavuk") || name.includes("piliç") || name.includes("pilic") || name.includes("hindi") || name.includes("sote")) return "chicken,dish";
  if (name.includes("makarna") || name.includes("pasta") || name.includes("spagetti") || name.includes("erişte") || name.includes("penne")) return "pasta,spaghetti";
  if (name.includes("salata") || name.includes("yeşillik") || name.includes("akdeniz") || name.includes("roka")) return "salad,fresh";
  if (name.includes("omlet") || name.includes("yumurta") || name.includes("menemen") || name.includes("çılbır") || name.includes("cilbir")) return "omelette,eggs";
  if (name.includes("pankek") || name.includes("pancake") || name.includes("waffle") || name.includes("krep")) return "pancake,crepe";
  if (name.includes("yulaf") || name.includes("oat") || name.includes("bowl") || name.includes("granola") || name.includes("puding")) return "oatmeal,yogurt";
  if (name.includes("köfte") || name.includes("kofte") || name.includes("ızgara köfte")) return "meatballs,plate";
  if (name.includes("kebap") || name.includes("kebab") || name.includes("döner") || name.includes("iskender") || name.includes("şiş")) return "kebab,grilled";
  if (name.includes("et ") || name.includes("bonfile") || name.includes("antrikot") || name.includes("biftek") || name.includes("kıyma")) return "steak,beef";
  if (name.includes("tatlı") || name.includes("tatli") || name.includes("kek") || name.includes("kurabiye") || name.includes("puding") || name.includes("sütlaç") || name.includes("baklava") || name.includes("brownie")) return "dessert,cake";
  if (name.includes("fasulye") || name.includes("nohut") || name.includes("sebze") || name.includes("türlü") || name.includes("turlu") || name.includes("mücver") || name.includes("enginar") || name.includes("bamya") || name.includes("ıspanak") || name.includes("ispanak")) return "vegetables,healthy";
  if (name.includes("pide") || name.includes("lahmacun") || name.includes("pizza") || name.includes("margarita")) return "pizza,flatbread";
  if (name.includes("hamburger") || name.includes("burger")) return "burger";
  if (name.includes("sandviç") || name.includes("tost") || name.includes("sandwich")) return "sandwich";
  if (name.includes("börek") || name.includes("borek") || name.includes("poğaça") || name.includes("pogaca")) return "pastry,bake";
  if (name.includes("humus") || name.includes("meze")) return "hummus,appetizer";
  if (name.includes("smoothie") || name.includes("detoks") || name.includes("meyve") || name.includes("shake")) return "smoothie,juice";
  if (name.includes("pilav") || name.includes("bulgur") || name.includes("pirinç")) return "rice,grain";
  if (name.includes("patates") || name.includes("kızartma") || name.includes("kizartma")) return "fries,potato";
  if (name.includes("dürüm") || name.includes("wrap") || name.includes("burrito")) return "wrap,burrito";
  return "food,plate";
}

export function getFoodImage(recipeName: string, category?: string): string {
  if (!recipeName) {
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400";
  }

  const name = recipeName.toLowerCase().trim();
  
  // 1. High-quality curated Unsplash mappings for popular dishes
  if (name.includes("mercimek") || name.includes("ezogelin") || name.includes("tarhana") || name.includes("çorbası") || name.includes("çorba") || name.includes("corba")) {
    return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600"; // Soup
  }
  if (name.includes("domates") && (name.includes("çorba") || name.includes("corba"))) {
    return "https://images.unsplash.com/photo-1547592160-a219a501a25f?auto=format&fit=crop&q=80&w=600"; // Tomato soup
  }
  if (name.includes("somon") || name.includes("balik") || name.includes("balık") || name.includes("levrek") || name.includes("çipura") || name.includes("cipura")) {
    return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600"; // Salmon/Fish
  }
  if (name.includes("tavuk göğsü") || name.includes("ızgara tavuk") || name.includes("tavuk") || name.includes("pilic") || name.includes("piliç") || name.includes("hindi")) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=600"; // Grilled Chicken
  }
  if (name.includes("salata") || name.includes("yeşillik") || name.includes("akdeniz") || name.includes("roka") || name.includes("bostan")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600"; // Salad
  }
  if (name.includes("omlet") || name.includes("yumurta") || name.includes("menemen") || name.includes("kahvaltı") || name.includes("kahvalti")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600"; // Breakfast/Eggs
  }
  if (name.includes("makarna") || name.includes("pasta") || name.includes("spagetti") || name.includes("erişte") || name.includes("penne") || name.includes("mantı") || name.includes("manti")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600"; // Pasta
  }
  if (name.includes("yulaf") || name.includes("oat") || name.includes("bowl") || name.includes("yogurt") || name.includes("yoğurt") || name.includes("chia") || name.includes("granola")) {
    return "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&q=80&w=600"; // Oatmeal / Yogurt bowl
  }
  if (name.includes("köfte") || name.includes("kofte") || name.includes("kıyma")) {
    return "https://images.unsplash.com/photo-1529692236671-f1f6e940a926?auto=format&fit=crop&q=80&w=600"; // Meatballs
  }
  if (name.includes("kebap") || name.includes("kebab") || name.includes("döner") || name.includes("iskender") || name.includes("şiş")) {
    return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600"; // Premium Kebab/Grill
  }
  if (name.includes("et ") || name.includes("bonfile") || name.includes("antrikot") || name.includes("biftek") || name.includes("lokum")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600"; // Steak
  }
  if (name.includes("tatlı") || name.includes("tatli") || name.includes("kek") || name.includes("kurabiye") || name.includes("puding") || name.includes("sütlaç") || name.includes("baklava") || name.includes("brownie") || name.includes("pasta")) {
    return "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&q=80&w=600"; // Dessert
  }
  if (name.includes("fasulye") || name.includes("nohut") || name.includes("sebze") || name.includes("türlü") || name.includes("turlu") || name.includes("mücver") || name.includes("enginar") || name.includes("ispanak") || name.includes("ıspanak")) {
    return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600"; // Vegetables / Legumes
  }
  if (name.includes("pide") || name.includes("lahmacun") || name.includes("pizza") || name.includes("margarita")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"; // Pizza / Flatbread
  }
  if (name.includes("hamburger") || name.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"; // Hamburger
  }
  if (name.includes("sandviç") || name.includes("tost") || name.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=600"; // Sandwich
  }
  if (name.includes("börek") || name.includes("borek") || name.includes("poğaça") || name.includes("pogaca")) {
    return "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600"; // Turkish pastry
  }
  if (name.includes("humus") || name.includes("meze") || name.includes("cacık") || name.includes("haydari")) {
    return "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=600"; // Hummus/Dips
  }
  if (name.includes("smoothie") || name.includes("detoks") || name.includes("meyve") || name.includes("shake")) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600"; // Smoothie
  }
  if (name.includes("pilav") || name.includes("bulgur") || name.includes("pirinç")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600"; // Rice pilaf
  }
  if (name.includes("patates") || name.includes("kızartma") || name.includes("kizartma")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600"; // Potatoes
  }
  if (name.includes("dürüm") || name.includes("wrap") || name.includes("burrito")) {
    return "https://images.unsplash.com/photo-1626700051175-6518c4793f06?auto=format&fit=crop&q=80&w=600"; // Wrap/Burrito
  }

  // 2. Category-based curated mappings
  const cat = String(category || '').toLowerCase();
  if (cat.includes("çorba")) {
    return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600";
  }
  if (cat.includes("kahvaltı")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600";
  }
  if (cat.includes("salata")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600";
  }
  if (cat.includes("tatlı")) {
    return "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&q=80&w=600";
  }
  if (cat.includes("ara öğün") || cat.includes("aperatif")) {
    return "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600";
  }

  // 3. Fallback to premium, stable, keyword-seeded food illustration/photo
  // Uses a stable seed hash so the same dish always gets the same high-quality photo!
  const englishTag = getEnglishFoodTag(recipeName);
  const stableSeed = hashCode(recipeName) % 1000;
  return `https://loremflickr.com/600/450/food,dish,plate,${englishTag}/all?lock=${stableSeed}`;
}

