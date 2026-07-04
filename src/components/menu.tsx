import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock, Flame, Star, Heart, X, Minus, Plus, ChevronDown,
  Droplets, Coffee, Beaker, Users, UtensilsCrossed, ChefHat, Cookie,
  ArrowDownUp, BadgeCheck, Sparkles, Tags
} from "lucide-react";
import {
  ADD_ON_OPTIONS,
  DRINK_OPTIONS,
  REMOVE_INGREDIENT_OPTIONS,
  SIDE_OPTIONS,
  SPICE_LEVELS,
  formatCartMoney,
  getAddOnTotal,
  getDefaultCustomization,
  toPesoAmount,
  type CartCurrency,
  type CartCustomization,
} from "@/lib/cart";
import { useAuth } from "@/context/auth-context";
import { getUserFavoriteIds, toggleUserFavorite } from "@/lib/favorites";

type ProductCategory = "burgers" | "drinks" | "family" | "sides" | "desserts";
type CategoryKey = "all" | ProductCategory;
type ProductTag = "popular" | "new" | "spicy" | "bestSeller";
type SortKey = "popular" | "new" | "spicy" | "bestSeller" | "priceAsc" | "priceDesc";

export interface Product {
  id: number;
  name: string;
  image: string;
  badges: string[];
  rating: string;
  reviews: string | null;
  price: string;
  oldPrice: string;
  time: string;
  detailLine: string;
  description: string;
  detail1: { label: string; value: string; icon?: any };
  detail2: { label: string; value: string; icon?: any };
  detail3: { label: string; value: string; icon?: any };
  category: ProductCategory;
  tags?: ProductTag[];
  sizes?: { label: string; price: number }[];
  addOns?: string[];
  expandContent?: {
    ingredients?: string[];
    flavor?: string;
    texture?: string;
    pairing?: string;
    prep?: string;
    note?: string;
  };
}

interface MenuProps {
  onAddToCart: (item: Omit<import("@/lib/cart").CartItem, "id">) => void;
}

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "burgers", label: "Burgers" },
  { key: "drinks", label: "Drinks" },
  { key: "sides", label: "Sides" },
  { key: "desserts", label: "Desserts" },
  { key: "family", label: "Family Meal" },
];

function isCategoryKey(value: string | null): value is CategoryKey {
  return CATEGORIES.some((category) => category.key === value);
}

const SORT_OPTIONS: { key: SortKey; label: string; icon: any }[] = [
  { key: "popular", label: "Popular", icon: Star },
  { key: "new", label: "New", icon: Sparkles },
  { key: "spicy", label: "Spicy", icon: Flame },
  { key: "bestSeller", label: "Best Seller", icon: BadgeCheck },
  { key: "priceAsc", label: "Price: Low to High", icon: ArrowDownUp },
  { key: "priceDesc", label: "Price: High to Low", icon: ArrowDownUp },
];

export const PRODUCTS: Product[] = [
  {
    id: 1, name: "The Classic Burger", image: "/images/classic.jpg",
    badges: ["POPULAR", "SIGNATURE"], rating: "4.9", reviews: "365",
    price: "149", oldPrice: "199", time: "10m", detailLine: "850 cal",
    description: "A juicy grilled beef patty layered with fresh lettuce, cheese, and signature sauce inside a soft toasted bun.",
    detail1: { label: "Protein", value: "45g" },
    detail2: { label: "Carbs", value: "65g" },
    detail3: { label: "Fat", value: "28g" },
    category: "burgers",
    tags: ["popular", "bestSeller"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Double", price: 2.5 }],
    addOns: ["Extra Cheese", "Extra Patty", "No Sauce", "Extra Sauce", "Jalape\u00f1os", "Double Toasted Bun"],
    expandContent: {
      ingredients: ["100% Angus Beef", "Brioche Bun", "Lettuce", "Tomato", "Signature Sauce"],
      flavor: "Rich, savory, and balanced with a tangy kick from our secret sauce.",
      texture: "Juicy patty with crisp fresh veggies and a soft toasted bun.",
      pairing: "Pairs perfectly with Classic Fries and an Iced Tea Lemon.",
      note: "Our #1 best-seller for a reason. Customers call it 'the perfect burger.'",
    }
  },
  {
    id: 2, name: "Smoky BBQ Burger", image: "/images/smoky.jpg",
    badges: ["PREMIUM", "HOT"], rating: "4.9", reviews: null,
    price: "169", oldPrice: "219", time: "12m", detailLine: "650 cal",
    description: "Grilled beef topped with smoky BBQ sauce, crispy onions, and melted cheddar.",
    detail1: { label: "Protein", value: "28g" },
    detail2: { label: "Carbs", value: "48g" },
    detail3: { label: "Fat", value: "35g" },
    category: "burgers",
    tags: ["popular", "spicy"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Double", price: 2.5 }],
    addOns: ["Extra Cheese", "Extra Patty", "No Sauce", "Extra Sauce", "Jalape\u00f1os", "Double Toasted Bun"],
    expandContent: {
      ingredients: ["Smoked Beef Patty", "Crispy Onions", "BBQ Glaze", "Cheddar Cheese"],
      flavor: "Deep smoky sweetness with a hint of tang from the BBQ glaze.",
      texture: "Crispy fried onions contrast beautifully with the tender beef.",
      pairing: "Best with Classic Cola or a Strawberry Milkshake.",
      note: "The smoky aroma hits before the first bite. A fan favorite for BBQ lovers.",
    }
  },
  {
    id: 3, name: "Spicy Fire Burger", image: "/images/spicy.jpg",
    badges: ["POPULAR", "HOT"], rating: "4.8", reviews: "405",
    price: "159", oldPrice: "209", time: "12m", detailLine: "650 cal",
    description: "A fiery, flavor-packed burger made with a juicy grilled beef patty, melted cheese, and topped with fresh jalape\u00f1os and rich spicy sauce for the perfect kick.",
    detail1: { label: "Protein", value: "27g" },
    detail2: { label: "Carbs", value: "45g" },
    detail3: { label: "Fat", value: "28g" },
    category: "burgers",
    tags: ["popular", "spicy", "bestSeller"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Double", price: 2.5 }],
    addOns: ["Extra Cheese", "Extra Patty", "No Sauce", "Extra Sauce", "Jalape\u00f1os", "Double Toasted Bun"],
    expandContent: {
      ingredients: ["Fresh Jalape\u00f1os", "Spicy Sauce", "Melted Cheese", "Beef Patty"],
      flavor: "Bold, fiery heat with a cheesy, creamy finish.",
      texture: "Crunchy jalape\u00f1os meet juicy beef — every bite packs heat.",
      pairing: "Cool it down with Fresh Orange Juice or Vanilla Sundae.",
      note: "Spice level: Medium-High. Ask for extra jalape\u00f1os if you dare.",
    }
  },
  {
    id: 4, name: "Crispy Chicken Burger", image: "/images/chicken.jpg",
    badges: ["PREMIUM", "POPULAR"], rating: "4.9", reviews: "405",
    price: "149", oldPrice: "199", time: "12m", detailLine: "850 cal",
    description: "A perfectly crispy, golden-fried chicken fillet layered with fresh lettuce and creamy mayo, all tucked inside a soft toasted bun.",
    detail1: { label: "Protein", value: "58g" },
    detail2: { label: "Carbs", value: "36g" },
    detail3: { label: "Fat", value: "29g" },
    category: "burgers",
    tags: ["popular", "new"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Double", price: 2.5 }],
    addOns: ["Extra Cheese", "Extra Patty", "No Sauce", "Extra Sauce", "Jalape\u00f1os", "Double Toasted Bun"],
    expandContent: {
      ingredients: ["Golden Chicken Fillet", "Crispy Lettuce", "Creamy Mayo", "Toasted Bun"],
      flavor: "Crispy, creamy, and satisfying with a subtle pepper finish.",
      texture: "Shatteringly crispy chicken coating with silky mayo.",
      pairing: "Pairs great with Crispy Onion Rings and Classic Cola.",
      note: "Our secret buttermilk marinade keeps the chicken tender inside.",
    }
  },
  {
    id: 5, name: "Classic Cola", image: "/images/drinks/cola.png",
    badges: ["POPULAR", "BEST SELLER"], rating: "4.8", reviews: "210",
    price: "89", oldPrice: "69", time: "1m", detailLine: "140 cal",
    description: "Ice-cold classic cola with the perfect balance of sweetness and fizz. The ultimate burger companion.",
    detail1: { label: "Sugar", value: "39g", icon: Droplets },
    detail2: { label: "Caffeine", value: "34mg", icon: Coffee },
    detail3: { label: "Volume", value: "500ml", icon: Beaker },
    category: "drinks",
    tags: ["popular", "bestSeller"],
    sizes: [{ label: "Small", price: 0 }, { label: "Medium", price: 0.5 }, { label: "Large", price: 1.0 }],
    addOns: ["Extra Ice", "Lemon Slice", "No Ice", "Extra Syrup"],
    expandContent: {
      ingredients: ["Carbonated Water", "Natural Flavor", "Cane Sugar", "Caramel Color"],
      flavor: "Sweet, fizzy, and perfectly refreshing with a signature cola kick.",
      texture: "Light, effervescent bubbles with a smooth, sweet finish.",
      pairing: "Pairs with any burger or spicy side.",
      note: "Served ice-cold. Add a lemon slice for extra zest.",
    }
  },
  {
    id: 6, name: "Iced Tea Lemon", image: "/images/drinks/icedtea.png",
    badges: ["SIGNATURE", "REFRESHING"], rating: "4.7", reviews: "156",
    price: "59", oldPrice: "79", time: "1m", detailLine: "90 cal",
    description: "Freshly brewed iced tea infused with real lemon and a hint of mint. Crisp, refreshing, and perfectly balanced.",
    detail1: { label: "Sugar", value: "22g", icon: Droplets },
    detail2: { label: "Caffeine", value: "18mg", icon: Coffee },
    detail3: { label: "Volume", value: "500ml", icon: Beaker },
    category: "drinks",
    tags: ["new"],
    sizes: [{ label: "Small", price: 0 }, { label: "Medium", price: 0.5 }, { label: "Large", price: 1.0 }],
    addOns: ["Extra Ice", "Lemon Slice", "Mint Leaves", "No Sugar"],
    expandContent: {
      ingredients: ["Brewed Black Tea", "Real Lemon Juice", "Mint Leaves", "Natural Sweetener"],
      flavor: "Crisp, citrus-forward with a subtle mint cool-down.",
      texture: "Light and refreshing with a clean, thirst-quenching finish.",
      pairing: "Pairs beautifully with spicy burgers or loaded nachos.",
      note: "No artificial flavors. The mint is fresh-cut daily.",
    }
  },
  {
    id: 7, name: "Strawberry Milkshake", image: "/images/drinks/milkshake.png",
    badges: ["POPULAR", "CREAMY"], rating: "4.9", reviews: "312",
    price: "129", oldPrice: "159", time: "3m", detailLine: "420 cal",
    description: "Thick, creamy strawberry milkshake blended with real fruit, topped with whipped cream and a cherry.",
    detail1: { label: "Sugar", value: "52g", icon: Droplets },
    detail2: { label: "Protein", value: "12g", icon: Coffee },
    detail3: { label: "Volume", value: "450ml", icon: Beaker },
    category: "drinks",
    tags: ["popular", "bestSeller"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Large", price: 1.0 }],
    addOns: ["Extra Whipped Cream", "Chocolate Drizzle", "Oreo Crumbs", "Extra Strawberry"],
    expandContent: {
      ingredients: ["Fresh Strawberries", "Vanilla Ice Cream", "Whole Milk", "Whipped Cream"],
      flavor: "Sweet, creamy, and fruity with real strawberry taste in every sip.",
      texture: "Thick, velvety, and luxuriously smooth.",
      pairing: "Pairs with any burger or as a standalone treat.",
      note: "Made with real fruit — no artificial syrups. A customer favorite since day one.",
    }
  },
  {
    id: 8, name: "Fresh Orange Juice", image: "/images/drinks/orangejuice.png",
    badges: ["FRESH", "HEALTHY"], rating: "4.8", reviews: "189",
    price: "89", oldPrice: "119", time: "2m", detailLine: "120 cal",
    description: "100% freshly squeezed oranges, no added sugar. Bursting with vitamin C and natural citrus goodness.",
    detail1: { label: "Sugar", value: "21g", icon: Droplets },
    detail2: { label: "Vitamin C", value: "80mg", icon: Coffee },
    detail3: { label: "Volume", value: "400ml", icon: Beaker },
    category: "drinks",
    tags: ["new"],
    sizes: [{ label: "Small", price: 0 }, { label: "Medium", price: 0.5 }, { label: "Large", price: 1.0 }],
    addOns: ["Extra Ice", "Pulp", "No Pulp", "Ginger Shot"],
    expandContent: {
      ingredients: ["100% Fresh Oranges", "No Added Sugar", "Natural Vitamin C"],
      flavor: "Bright, tangy, and naturally sweet with a pure citrus burst.",
      texture: "Smooth with optional pulp for added texture.",
      pairing: "Pairs with breakfast items, desserts, or as a healthy refresher.",
      note: "Squeezed fresh to order. Contains 2x your daily Vitamin C needs.",
    }
  },
  {
    id: 9, name: "The Big Feast", image: "/images/family/feast.png",
    badges: ["BEST FOR SHARING", "POPULAR"], rating: "4.9", reviews: "89",
    price: "699", oldPrice: "899", time: "20m", detailLine: "3,200 cal",
    description: "The ultimate feast for the whole crew! Includes 4 burgers, 2 large fries, 4 drinks, and a bucket of nuggets.",
    detail1: { label: "Good for", value: "4-5 persons", icon: Users },
    detail2: { label: "Items", value: "11 items", icon: UtensilsCrossed },
    detail3: { label: "Total Protein", value: "185g", icon: ChefHat },
    category: "family",
    tags: ["popular", "bestSeller"],
    addOns: ["Extra Sauce Pack", "Spicy Upgrade", "Dessert Add-on", "Extra Fries"],
    expandContent: {
      ingredients: ["4 Classic Burgers", "2 Large Fries", "4 Drinks", "Bucket of Nuggets"],
      flavor: "A complete flavor journey — savory, crispy, sweet, and refreshing all in one box.",
      texture: "Everything from juicy patties to crunchy nuggets and smooth drinks.",
      pairing: "The ultimate party or family night meal. No need for anything else.",
      note: "Feeds 4-5 people comfortably. Most popular choice for birthdays and game nights.",
    }
  },
  {
    id: 10, name: "Double Stack Combo", image: "/images/family/doublestack.png",
    badges: ["SIGNATURE", "VALUE"], rating: "4.8", reviews: "124",
    price: "399", oldPrice: "499", time: "15m", detailLine: "2,100 cal",
    description: "Two stacked burgers of your choice, two sides, and two drinks. Perfect for date night or a hungry pair.",
    detail1: { label: "Good for", value: "2 persons", icon: Users },
    detail2: { label: "Items", value: "6 items", icon: UtensilsCrossed },
    detail3: { label: "Total Protein", value: "98g", icon: ChefHat },
    category: "family",
    tags: ["bestSeller"],
    addOns: ["Extra Sauce Pack", "Spicy Upgrade", "Dessert Add-on", "Extra Fries"],
    expandContent: {
      ingredients: ["2 Stacked Burgers", "2 Sides", "2 Drinks"],
      flavor: "Double the burger, double the joy. Mix and match your favorites.",
      texture: "Hearty, filling, and satisfying with two full meals in one box.",
      pairing: "Date night classic. Comes with 2 sides and drinks of your choice.",
      note: "Choose any 2 burgers from our full menu. Perfect for sharing or not.",
    }
  },
  {
    id: 11, name: "Chicken Lovers Box", image: "/images/family/chickenlovers.png",
    badges: ["HOT", "PREMIUM"], rating: "4.7", reviews: "67",
    price: "499", oldPrice: "599", time: "18m", detailLine: "2,400 cal",
    description: "Crispy chicken galore! 8-piece nuggets, 2 chicken burgers, large fries, coleslaw, and 2 dipping sauces.",
    detail1: { label: "Good for", value: "3 persons", icon: Users },
    detail2: { label: "Items", value: "7 items", icon: UtensilsCrossed },
    detail3: { label: "Total Protein", value: "115g", icon: ChefHat },
    category: "family",
    tags: ["new", "spicy"],
    addOns: ["Extra Sauce Pack", "Spicy Upgrade", "Dessert Add-on", "Extra Fries"],
    expandContent: {
      ingredients: ["8pc Nuggets", "2 Chicken Burgers", "Large Fries", "Coleslaw", "2 Dips"],
      flavor: "All chicken, all the time. Crispy, juicy, and finger-licking good.",
      texture: "Crunchy nuggets, tender burgers, creamy slaw — pure chicken heaven.",
      pairing: "For the chicken obsessed. Enough variety to keep every bite interesting.",
      note: "Our chicken is marinated overnight for maximum tenderness and flavor.",
    }
  },
  {
    id: 12, name: "Mega Bundle", image: "/images/family/megabundle.png",
    badges: ["BEST VALUE", "POPULAR"], rating: "4.9", reviews: "203",
    price: "999", oldPrice: "1199", time: "25m", detailLine: "4,500 cal",
    description: "The king of bundles. 6 burgers, 3 large fries, 2 onion rings, 6 drinks, nuggets, and 2 desserts. Party sorted.",
    detail1: { label: "Good for", value: "5-6 persons", icon: Users },
    detail2: { label: "Items", value: "19 items", icon: UtensilsCrossed },
    detail3: { label: "Total Protein", value: "220g", icon: ChefHat },
    category: "family",
    tags: ["popular", "bestSeller"],
    addOns: ["Extra Sauce Pack", "Spicy Upgrade", "Dessert Add-on", "Extra Fries"],
    expandContent: {
      ingredients: ["6 Burgers", "3 Large Fries", "2 Onion Rings", "6 Drinks", "Nuggets", "2 Desserts"],
      flavor: "The ultimate crowd-pleaser. Every flavor profile covered in one epic bundle.",
      texture: "From crispy to creamy to juicy — a textural adventure for everyone.",
      pairing: "The go-to choice for parties, office lunches, or big family dinners.",
      note: "Our largest bundle. Serves 5-6 and includes a little bit of everything.",
    }
  },
  {
    id: 13, name: "Classic Fries", image: "/images/sides/fries.png",
    badges: ["POPULAR", "SIGNATURE"], rating: "4.8", reviews: "452",
    price: "79", oldPrice: "109", time: "5m", detailLine: "320 cal",
    description: "Golden, crispy, perfectly salted fries cut fresh daily. The classic side that never disappoints.",
    detail1: { label: "Calories", value: "320", icon: Flame },
    detail2: { label: "Weight", value: "180g", icon: UtensilsCrossed },
    detail3: { label: "Serving", value: "1 person", icon: Users },
    category: "sides",
    tags: ["popular", "bestSeller"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Large", price: 1.5 }],
    addOns: ["Cheese Sauce", "Chili Topping", "Truffle Oil", "Loaded Style"],
    expandContent: {
      ingredients: ["Fresh Potatoes", "Sea Salt", "Vegetable Oil"],
      flavor: "Classic, salty, and irresistibly crispy. The perfect side.",
      texture: "Golden exterior with a fluffy, soft interior. Cut fresh daily.",
      pairing: "Pairs with literally everything on the menu. The universal side.",
      note: "Double-fried for extra crispiness. Add cheese sauce for a loaded upgrade.",
    }
  },
  {
    id: 14, name: "Crispy Onion Rings", image: "/images/sides/onionrings.png",
    badges: ["CRISPY", "NEW"], rating: "4.7", reviews: "178",
    price: "99", oldPrice: "129", time: "6m", detailLine: "280 cal",
    description: "Thick-cut onions in a light, crispy golden batter. Served hot with a side of tangy dipping sauce.",
    detail1: { label: "Calories", value: "280", icon: Flame },
    detail2: { label: "Weight", value: "160g", icon: UtensilsCrossed },
    detail3: { label: "Serving", value: "1 person", icon: Users },
    category: "sides",
    tags: ["new"],
    sizes: [{ label: "Regular", price: 0 }, { label: "Large", price: 1.5 }],
    addOns: ["Spicy Dip", "Ranch Dip", "BBQ Dip", "Loaded Style"],
    expandContent: {
      ingredients: ["Thick-Cut Onions", "Light Batter", "Vegetable Oil"],
      flavor: "Sweet onion flavor wrapped in a crispy, golden shell.",
      texture: "Crunchy and light with a tender, sweet onion center.",
      pairing: "Great with burgers, as a standalone snack, or dipped in ranch.",
      note: "Served piping hot. The new item customers are already raving about.",
    }
  },
  {
    id: 15, name: "Chicken Nuggets (8pc)", image: "/images/sides/nuggets.png",
    badges: ["POPULAR", "KIDS FAV"], rating: "4.8", reviews: "310",
    price: "129", oldPrice: "159", time: "7m", detailLine: "380 cal",
    description: "8 pieces of tender, juicy chicken in a crunchy golden breadcrumb coating. Comes with your choice of dipping sauce.",
    detail1: { label: "Calories", value: "380", icon: Flame },
    detail2: { label: "Weight", value: "200g", icon: UtensilsCrossed },
    detail3: { label: "Serving", value: "1-2 persons", icon: Users },
    category: "sides",
    tags: ["popular"],
    sizes: [{ label: "8pc", price: 0 }, { label: "12pc", price: 2.0 }],
    addOns: ["Spicy Dip", "Ranch Dip", "BBQ Dip", "Honey Mustard"],
    expandContent: {
      ingredients: ["Tender Chicken", "Golden Breadcrumb Coating", "Choice of Dipping Sauce"],
      flavor: "Mild, savory chicken with a satisfying crunchy coating and your favorite dip.",
      texture: "Crispy exterior gives way to juicy, tender chicken inside.",
      pairing: "A kids' favorite that adults secretly love too. Perfect for sharing.",
      note: "Made with 100% white meat chicken. Choose from 4 dipping sauces.",
    }
  },
  {
    id: 16, name: "Loaded Nachos", image: "/images/sides/nachos.png",
    badges: ["SHAREABLE", "HOT"], rating: "4.6", reviews: "95",
    price: "149", oldPrice: "189", time: "8m", detailLine: "450 cal",
    description: "Crispy tortilla chips smothered in melted cheese, jalape\u00f1os, sour cream, and fresh salsa. Made for sharing.",
    detail1: { label: "Calories", value: "450", icon: Flame },
    detail2: { label: "Weight", value: "250g", icon: UtensilsCrossed },
    detail3: { label: "Serving", value: "2 persons", icon: Users },
    category: "sides",
    tags: ["new", "spicy"],
    addOns: ["Extra Cheese", "Guacamole", "Ground Beef", "Sour Cream"],
    expandContent: {
      ingredients: ["Tortilla Chips", "Melted Cheese", "Jalape\u00f1os", "Salsa", "Sour Cream"],
      flavor: "Bold, cheesy, and spicy with fresh salsa cutting through the richness.",
      texture: "Crunchy chips loaded with gooey cheese and creamy toppings.",
      pairing: "The ultimate shareable side. Grab a friend and dig in together.",
      note: "Add guacamole or ground beef to take it to the next level.",
    }
  },
  {
    id: 17, name: "Chocolate Lava Cake", image: "/images/desserts/lavacake.png",
    badges: ["SIGNATURE", "HOT"], rating: "4.9", reviews: "267",
    price: "129", oldPrice: "159", time: "8m", detailLine: "480 cal",
    description: "Warm, decadent chocolate cake with a molten center that flows like liquid gold. Pure indulgence on a plate.",
    detail1: { label: "Sugar", value: "42g", icon: Cookie },
    detail2: { label: "Calories", value: "480", icon: Flame },
    detail3: { label: "Serving", value: "1 person", icon: Users },
    category: "desserts",
    tags: ["bestSeller"],
    addOns: ["Vanilla Ice Cream", "Extra Chocolate Sauce", "Whipped Cream", "Berry Compote"],
    expandContent: {
      ingredients: ["Dark Chocolate Cake", "Molten Chocolate Center", "Cocoa Powder"],
      flavor: "Intensely chocolatey with a warm, flowing center that melts on your tongue.",
      texture: "Soft, warm cake exterior with a liquid gold chocolate core.",
      pairing: "Serve with Vanilla Ice Cream for the ultimate hot-cold contrast.",
      note: "Baked fresh when ordered. The molten center flows for about 2 minutes.",
    }
  },
  {
    id: 18, name: "Vanilla Sundae", image: "/images/desserts/sundae.png",
    badges: ["POPULAR", "CREAMY"], rating: "4.8", reviews: "198",
    price: "99", oldPrice: "129", time: "3m", detailLine: "320 cal",
    description: "Creamy vanilla soft serve topped with whipped cream, chocolate drizzle, rainbow sprinkles, and a cherry on top.",
    detail1: { label: "Sugar", value: "38g", icon: Cookie },
    detail2: { label: "Calories", value: "320", icon: Flame },
    detail3: { label: "Serving", value: "1 person", icon: Users },
    category: "desserts",
    tags: ["popular"],
    addOns: ["Extra Toppings", "Caramel Drizzle", "Cookie Crumbles", "Brownie Chunks"],
    expandContent: {
      ingredients: ["Vanilla Soft Serve", "Whipped Cream", "Chocolate Drizzle", "Sprinkles"],
      flavor: "Sweet, creamy vanilla with rich chocolate and playful rainbow sprinkles.",
      texture: "Silky soft serve topped with light, airy whipped cream.",
      pairing: "The perfect sweet ending to any burger meal.",
      note: "Topped with a real cherry. Add brownie chunks for extra indulgence.",
    }
  },
  {
    id: 19, name: "Strawberry Cheesecake", image: "/images/desserts/cheesecake.png",
    badges: ["PREMIUM", "FRESH"], rating: "4.9", reviews: "145",
    price: "149", oldPrice: "189", time: "5m", detailLine: "420 cal",
    description: "Velvety New York-style cheesecake with a buttery graham crust, topped with fresh strawberry compote and glaze.",
    detail1: { label: "Sugar", value: "35g", icon: Cookie },
    detail2: { label: "Calories", value: "420", icon: Flame },
    detail3: { label: "Serving", value: "1 person", icon: Users },
    category: "desserts",
    tags: ["new", "bestSeller"],
    addOns: ["Extra Strawberry", "Chocolate Sauce", "Whipped Cream", "Berry Mix"],
    expandContent: {
      ingredients: ["Cream Cheese", "Graham Crust", "Fresh Strawberry Compote", "Glaze"],
      flavor: "Rich, tangy cream cheese balanced with sweet, fruity strawberry.",
      texture: "Velvety smooth with a buttery crunch from the graham crust.",
      pairing: "Pairs with Fresh Orange Juice for a refreshing dessert combo.",
      note: "Made with real Philadelphia cream cheese and fresh seasonal strawberries.",
    }
  },
  {
    id: 20, name: "Cinnamon Churros", image: "/images/desserts/churros.png",
    badges: ["HOT", "CRISPY"], rating: "4.7", reviews: "112",
    price: "119", oldPrice: "149", time: "6m", detailLine: "350 cal",
    description: "Crispy fried churros dusted in cinnamon sugar, served warm with a rich chocolate dipping sauce on the side.",
    detail1: { label: "Sugar", value: "28g", icon: Cookie },
    detail2: { label: "Calories", value: "350", icon: Flame },
    detail3: { label: "Serving", value: "1-2 persons", icon: Users },
    category: "desserts",
    tags: ["new"],
    addOns: ["Extra Chocolate Sauce", "Caramel Dip", "Whipped Cream", "Ice Cream Pairing"],
    expandContent: {
      ingredients: ["Flour Dough", "Cinnamon Sugar", "Chocolate Dipping Sauce"],
      flavor: "Warm cinnamon sweetness with rich chocolate for dipping.",
      texture: "Crispy fried exterior, soft and fluffy inside. Perfect for dunking.",
      pairing: "Best shared with friends. The chocolate sauce is made with Belgian cocoa.",
      note: "Served warm within 5 minutes of frying. Dust extra cinnamon on request.",
    }
  },
];

const BADGE_COLORS: Record<string, string> = {
  POPULAR: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  SIGNATURE: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  PREMIUM: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  HOT: "bg-red-500/15 text-red-400 border border-red-500/30",
  "BEST SELLER": "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  REFRESHING: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  CREAMY: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
  FRESH: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  HEALTHY: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  "BEST FOR SHARING": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  VALUE: "bg-lime-500/15 text-lime-400 border border-lime-500/30",
  "BEST VALUE": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  NEW: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  "KIDS FAV": "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  SHAREABLE: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  CRISPY: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
};

function getBadgeClass(badge: string): string {
  return BADGE_COLORS[badge] || "bg-white/5 text-white/60 border border-white/10";
}

function getProductPrice(product: Product): number {
  return Number.parseFloat(product.price) || 0;
}

function getReviewCount(product: Product): number {
  if (!product.reviews) return 0;
  return Number.parseInt(product.reviews.replace(/\D/g, ""), 10) || 0;
}

function getPopularityScore(product: Product): number {
  const ratingScore = (Number.parseFloat(product.rating) || 0) * 1000;
  const reviewScore = getReviewCount(product);
  const tagBoost = product.tags?.includes("popular") ? 500 : 0;
  const bestSellerBoost = product.tags?.includes("bestSeller") ? 250 : 0;
  return ratingScore + reviewScore + tagBoost + bestSellerBoost;
}

function hasProductTag(product: Product, tag: ProductTag): boolean {
  return product.tags?.includes(tag) ?? false;
}

export default function MenuSection({ onAddToCart }: MenuProps) {
  const { requireAuth, user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [selectedSort, setSelectedSort] = useState<SortKey>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [touchedExpand, setTouchedExpand] = useState<Set<number>>(new Set());
  const [customizeProduct, setCustomizeProduct] = useState<Product | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setFavorites(new Set());
      return () => {
        cancelled = true;
      };
    }

    getUserFavoriteIds(user.uid)
      .then((ids) => {
        if (!cancelled) setFavorites(ids);
      })
      .catch(() => {
        if (!cancelled) setFavorites(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const applyCategory = (category: string | null) => {
      if (!isCategoryKey(category)) return;
      setActiveCategory(category);
      setSelectedSort("popular");
    };

    const queuedCategory = window.sessionStorage.getItem("bnb_menu_category");
    if (queuedCategory) {
      window.sessionStorage.removeItem("bnb_menu_category");
      applyCategory(queuedCategory);
    } else {
      applyCategory(new URLSearchParams(window.location.search).get("category"));
    }

    const handleCategoryRequest = (event: Event) => {
      applyCategory((event as CustomEvent<string>).detail);
    };

    window.addEventListener("bnb:set-menu-category", handleCategoryRequest);
    return () => window.removeEventListener("bnb:set-menu-category", handleCategoryRequest);
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTouchedExpand((prev) => new Set(prev).add(id));
  };

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.reduce<Record<CategoryKey, number>>((counts, category) => {
        counts[category.key] =
          category.key === "all"
            ? PRODUCTS.length
            : PRODUCTS.filter((product) => product.category === category.key).length;
        return counts;
      }, {} as Record<CategoryKey, number>),
    []
  );

  const filteredProducts = useMemo(() => {
    const categoryProducts =
      activeCategory === "all"
        ? [...PRODUCTS]
        : PRODUCTS.filter((product) => product.category === activeCategory);

    let refinedProducts = categoryProducts;

    if (selectedSort === "new") {
      refinedProducts = categoryProducts.filter((product) => hasProductTag(product, "new"));
    } else if (selectedSort === "spicy") {
      refinedProducts = categoryProducts.filter((product) => hasProductTag(product, "spicy"));
    } else if (selectedSort === "bestSeller") {
      refinedProducts = categoryProducts.filter((product) => hasProductTag(product, "bestSeller"));
    }

    const sortedProducts = [...refinedProducts];

    if (selectedSort === "priceAsc") {
      sortedProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (selectedSort === "priceDesc") {
      sortedProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    } else if (selectedSort === "new") {
      sortedProducts.sort((a, b) => b.id - a.id);
    } else {
      sortedProducts.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    }

    return sortedProducts;
  }, [activeCategory, selectedSort]);

  const activeCategoryLabel = CATEGORIES.find((category) => category.key === activeCategory)?.label ?? "All";
  const selectedSortOption = SORT_OPTIONS.find((option) => option.key === selectedSort) ?? SORT_OPTIONS[0];
  const SelectedSortIcon = selectedSortOption.icon;

  const toggleFavorite = async (product: Product) => {
    if (!user) return;

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });

    try {
      const active = await toggleUserFavorite(user.uid, {
        productId: product.id,
        productName: product.name,
        image: product.image,
        category: product.category,
        price: toPesoAmount(product.price),
        availability: "Available",
        badge: product.badges[0],
        description: product.description,
      });

      setFavorites((prev) => {
        const next = new Set(prev);
        if (active) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(product.id)) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
    }
  };

  return (
    <section id="menu" className="py-20 md:py-24 bg-[#0A0A0A] overflow-x-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[#FF3B3B] font-bold tracking-[0.2em] uppercase text-xs mb-2">Showing Menu</p>
            <h2 className="font-display text-4xl md:text-5xl font-black">Featured Items</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60 w-full md:w-auto">
            <span className="text-white font-bold">{filteredProducts.length}</span> items in{" "}
            <span className="text-[#FF4D2E] font-bold">{activeCategoryLabel}</span>
          </div>
        </div>

        {/* Menu filters */}
        <div className="mb-10 rounded-[28px] border border-white/10 bg-[#111111]/80 p-3 sm:p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-3 flex items-center gap-2 text-white/50">
                <Tags className="w-4 h-4 text-[#FF4D2E]" />
                <p className="text-xs font-bold uppercase tracking-[0.18em]">Categories</p>
              </div>
              <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        aria-pressed={isActive}
                        className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 ${
                          isActive
                            ? "border-transparent text-white"
                            : "border-white/10 bg-white/[0.03] text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                        }`}
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(135deg, #FF3B3B 0%, #E62E2E 100%)",
                                boxShadow: "0 0 20px rgba(255,59,59,0.28), 0 0 36px rgba(255,59,59,0.1)",
                              }
                            : undefined
                        }
                      >
                        {cat.label}
                        <span className={`ml-2 text-xs ${isActive ? "text-white/75" : "text-white/30"}`}>
                          {categoryCounts[cat.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((open) => !open)}
                  aria-expanded={isSortOpen}
                  className={`flex h-[52px] min-w-[150px] items-center justify-between gap-4 rounded-full border px-5 text-base font-black transition-all duration-300 ${
                    isSortOpen
                      ? "border-[#FF3B3B]/60 bg-[#FF3B3B]/15 text-white shadow-[0_0_24px_rgba(255,59,59,0.16)]"
                      : "border-white/10 bg-black/20 text-white hover:border-[#FF3B3B]/35"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <SelectedSortIcon className="w-4 h-4 text-[#FF4D2E]" />
                    Sort
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/70 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {isSortOpen && (
                <div className="mt-3 -mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
                    {SORT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = selectedSort === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSelectedSort(option.key)}
                          aria-pressed={isActive}
                          className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                            isActive
                              ? "border-[#FFB000] bg-[#FF3B3B]/15 text-white shadow-[0_0_20px_rgba(255,176,0,0.16)]"
                              : "border-white/10 bg-black/20 text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-[#FF4D2E]" : "text-white/35"}`} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
            <div
              key={`${activeCategory}-${selectedSort}-${product.id}`}
              className="group bg-[#111111] border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-[#FF3B3B]/30 hover:shadow-[0_0_40px_rgba(255,77,46,0.1)] hover:-translate-y-1 transition-all duration-500"
            >
              {/* Image area — zoomed fill with overlay badges */}
              <div className="relative w-full h-[220px] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Top-left SAVE badge */}
                <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2.5 py-1 rounded text-[10px] font-bold tracking-wider">
                  SAVE 20%
                </div>
                {/* Top-right: rating + heart aligned */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 h-8">
                    <Star className="w-3 h-3 fill-[#FF8A00] text-[#FF8A00]" />
                    <span className="text-white text-xs font-bold">{product.rating}</span>
                    {product.reviews && (
                      <span className="text-white/50 text-[10px]">({product.reviews})</span>
                    )}
                  </div>
                  <button
                    onClick={() => requireAuth(() => void toggleFavorite(product))}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.has(product.id) ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-white/70"}`}
                    />
                  </button>
                </div>
                {/* Bottom badges overlay */}
                <div className="absolute bottom-3 right-3 z-10 flex justify-end gap-2">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getBadgeClass(badge)} backdrop-blur-sm`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Details area */}
              <div className="flex-1 p-5 flex flex-col gap-3">
                {/* Name + Price */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold leading-snug">{product.name}</h3>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-[#FF3B3B]">
                      {formatCartMoney(toPesoAmount(product.price))}
                    </span>
                    <div className="text-xs text-white/30 line-through">
                      {formatCartMoney(toPesoAmount(product.oldPrice))}
                    </div>
                  </div>
                </div>

                {/* Time + Cals */}
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {product.time}</span>
                  <span className="text-white/10">|</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {product.detailLine}</span>
                </div>

                {/* Description */}
                <p className="text-white/50 text-sm leading-relaxed line-clamp-2">{product.description}</p>

                {/* Stats with colored dots */}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {product.detail1.label} <span className="text-white font-bold">{product.detail1.value}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {product.detail2.label} <span className="text-white font-bold">{product.detail2.value}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {product.detail3.label} <span className="text-white font-bold">{product.detail3.value}</span>
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => requireAuth(() => setCustomizeProduct(product))}
                    className="flex-1 h-10 rounded-full text-xs font-bold tracking-[0.1em] text-white flex items-center justify-center gap-1 hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{
                      background: "linear-gradient(135deg, #FF3B3B 0%, #E62E2E 100%)",
                    }}
                  >
                    CUSTOMIZE
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleExpand(product.id)}
                    className={`w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all ${expandedIds.has(product.id) ? "rotate-180" : ""}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Expand content */}
                {product.expandContent && touchedExpand.has(product.id) && (
                  <div
                    className={expandedIds.has(product.id) ? "animate-expand-open" : "animate-expand-close"}
                  >
                    <div className="pt-3 pb-1 border-t border-white/5 space-y-3">
                      {product.expandContent.ingredients && (
                        <div>
                          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase mb-1.5">Ingredients</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.expandContent.ingredients.map((ing) => (
                              <span key={ing} className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[11px] border border-white/5">{ing}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.expandContent.flavor && (
                        <div>
                          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase mb-0.5">Flavor Profile</p>
                          <p className="text-white/50 text-xs leading-relaxed">{product.expandContent.flavor}</p>
                        </div>
                      )}
                      {product.expandContent.texture && (
                        <div>
                          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase mb-0.5">Texture</p>
                          <p className="text-white/50 text-xs leading-relaxed">{product.expandContent.texture}</p>
                        </div>
                      )}
                      {product.expandContent.pairing && (
                        <div>
                          <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase mb-0.5">Perfect Pairing</p>
                          <p className="text-white/50 text-xs leading-relaxed">{product.expandContent.pairing}</p>
                        </div>
                      )}
                      {product.expandContent.note && (
                        <div className="bg-[#FF3B3B]/5 border border-[#FF3B3B]/10 rounded-lg px-3 py-2">
                          <p className="text-[#FF4D2E] text-[11px] leading-relaxed">{product.expandContent.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            ))
          ) : (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="font-display text-2xl font-black text-white">No items found</p>
              <p className="mt-2 text-sm text-white/45">
                Try another category or switch back to Popular to browse more Bun & Bite favorites.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customize modal */}
      {customizeProduct && (
        <CustomizeModal
          product={customizeProduct}
          onClose={() => setCustomizeProduct(null)}
          onConfirm={onAddToCart}
          currency="PHP"
        />
      )}
    </section>
  );
}

export function CustomizeModal({
  product,
  onClose,
  onConfirm,
  mode = "add",
  initialSizeIdx = 0,
  initialAddOns = [],
  initialQuantity = 1,
  initialCustomization,
  currency = "PHP",
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (data: {
    productId: number;
    name: string;
    image: string;
    badge: string;
    size: string;
    addOns: string[];
    quantity: number;
    unitPrice: number;
    baseUnitPrice: number;
    addOnTotal: number;
    customization: CartCustomization;
    currency: CartCurrency;
  }) => void;
  mode?: "add" | "edit";
  initialSizeIdx?: number;
  initialAddOns?: string[];
  initialQuantity?: number;
  initialCustomization?: CartCustomization;
  currency?: CartCurrency;
}) {
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(initialSizeIdx);
  const [quantity, setQuantity] = useState(initialQuantity);
  const initialOptions = {
    ...getDefaultCustomization(),
    ...initialCustomization,
    addOns: initialCustomization?.addOns ?? initialAddOns,
  };
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set(initialOptions.addOns));
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(
    new Set(initialOptions.removeIngredients),
  );
  const [spiceLevel, setSpiceLevel] = useState(initialOptions.spiceLevel);
  const [drinkOption, setDrinkOption] = useState(initialOptions.drinkOption);
  const [sideOption, setSideOption] = useState(initialOptions.sideOption);
  const [notes, setNotes] = useState(initialOptions.notes);

  const basePrice = toPesoAmount(product.price);
  const sizePrice = toPesoAmount(product.sizes?.[selectedSizeIdx]?.price ?? 0);
  const addOnPrice = getAddOnTotal(Array.from(selectedAddOns));
  const baseUnitPrice = basePrice + sizePrice;
  const unitPrice = basePrice + sizePrice + addOnPrice;
  const total = unitPrice * quantity;
  const oldPrice = toPesoAmount(product.oldPrice);

  const handleConfirm = () => {
    const customization: CartCustomization = {
      addOns: Array.from(selectedAddOns),
      removeIngredients: Array.from(removedIngredients),
      spiceLevel,
      drinkOption,
      sideOption,
      notes: notes.trim(),
    };

    onConfirm({
      productId: product.id,
      name: product.name,
      image: product.image,
      badge: product.badges[0] || "",
      size: product.sizes?.[selectedSizeIdx]?.label || "Regular",
      addOns: customization.addOns,
      quantity,
      unitPrice,
      baseUnitPrice,
      addOnTotal: addOnPrice,
      customization,
      currency,
    });
    onClose();
  };

  const toggleAddOn = (addon: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(addon)) next.delete(addon);
      else next.add(addon);
      return next;
    });
  };

  const toggleRemovedIngredient = (ingredient: string) => {
    setRemovedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient)) next.delete(ingredient);
      else next.add(ingredient);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
      <div
        className="bunbite-scrollbar relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#111111]/90 border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="relative w-full h-52 bg-[#0d0d0d] flex items-center justify-center p-6">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-full object-contain drop-shadow-[0_10px_30px_rgba(255,59,59,0.2)]"
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold">{product.name}</h3>
              <p className="text-white/40 text-sm mt-1">{product.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-[#FF3B3B]">{formatCartMoney(basePrice, currency)}</span>
              <div className="text-sm text-white/30 line-through">{formatCartMoney(oldPrice, currency)}</div>
            </div>
          </div>

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 tracking-wider uppercase">Select Size</label>
              <div className="flex gap-2">
                {product.sizes.map((size, i) => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSizeIdx(i)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      selectedSizeIdx === i
                        ? "bg-[#FF3B3B]/15 border-[#FF3B3B]/40 text-[#FF3B3B]"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    {size.label}
                    {size.price > 0 && (
                      <span className="block text-[10px] font-medium text-white/30 mt-0.5">
                        +{formatCartMoney(toPesoAmount(size.price), currency)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 tracking-wider uppercase">
              Add-ons
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ADD_ON_OPTIONS.map((addon) => (
                <button
                  key={addon.label}
                  type="button"
                  onClick={() => toggleAddOn(addon.label)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    selectedAddOns.has(addon.label)
                      ? "bg-[#FF3B3B]/15 border-[#FF3B3B]/40 text-[#FFB4AB]"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  <span>{addon.label}</span>
                  <span className="text-white/40">
                    +{formatCartMoney(addon.price, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Remove ingredients */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 tracking-wider uppercase">Remove ingredients</label>
            <div className="flex flex-wrap gap-2">
              {REMOVE_INGREDIENT_OPTIONS.map((ingredient) => (
                <button
                  key={ingredient}
                  type="button"
                  onClick={() => toggleRemovedIngredient(ingredient)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    removedIngredients.has(ingredient)
                      ? "bg-[#FF3B3B]/15 border-[#FF3B3B]/40 text-[#FFB4AB]"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {ingredient}
                </button>
              ))}
            </div>
          </div>

          {/* Spice level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 tracking-wider uppercase">Spice level</label>
            <div className="grid grid-cols-3 gap-2">
              {SPICE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceLevel(level)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                    spiceLevel === level
                      ? "bg-[#FF3B3B]/15 border-[#FF3B3B]/40 text-[#FFB4AB]"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Drink and side */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-bold text-white/40 tracking-wider uppercase">Drink option</span>
              <select
                value={drinkOption}
                onChange={(event) => setDrinkOption(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none focus:border-[#FF3B3B]/40"
              >
                {DRINK_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#111111] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-bold text-white/40 tracking-wider uppercase">Side option</span>
              <select
                value={sideOption}
                onChange={(event) => setSideOption(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none focus:border-[#FF3B3B]/40"
              >
                {SIDE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#111111] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Notes */}
          <label className="block space-y-2">
            <span className="block text-xs font-bold text-white/40 tracking-wider uppercase">Special instructions</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={140}
              placeholder="Example: less sauce, toast the bun more, separate the dressing"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-white outline-none placeholder:text-white/25 focus:border-[#FF3B3B]/40"
            />
            <span className="block text-right text-[10px] text-white/25">{notes.length}/140</span>
          </label>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white/40 tracking-wider uppercase">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Minus className="w-4 h-4 text-white/60" />
              </button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Total & Add */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/40">Total</span>
              <span className="text-3xl font-black text-[#FF3B3B]">{formatCartMoney(total, currency)}</span>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full h-12 rounded-full font-bold text-white bg-[#FF3B3B] hover:bg-[#ff5252] transition-colors"
            >
              {mode === "edit" ? "Save Changes" : "Add to Cart"} - {formatCartMoney(total, currency)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
