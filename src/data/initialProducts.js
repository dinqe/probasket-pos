export const initialProducts = [
  {
    id: "water-pure",
    name: "Spring Water",
    category: "Hydration",
    type: "simple",
    price: 1.50,
    stock: 80,
    variants: null,
    image: "💧",
    isFavorite: true
  },
  {
    id: "coconut-water",
    name: "Raw Coconut Water",
    category: "Hydration",
    type: "simple",
    price: 3.50,
    stock: 35,
    variants: null,
    image: "🥥",
    isFavorite: false
  },
  {
    id: "electrolyte-drink",
    name: "Electrolyte Sports Drink",
    category: "Hydration",
    type: "variable",
    price: 2.50,
    stock: 50,
    variants: [
      { name: "Blue Raspberry", image: "💧" },
      { name: "Lemon Lime", image: "🍋" },
      { name: "Orange Rush", image: "🍊" },
      { name: "Fruit Punch", image: "🍒" }
    ],
    image: "⚡",
    isFavorite: false
  },
  {
    id: "whey-shake",
    name: "Premium Whey Shake",
    category: "Protein",
    type: "variable",
    price: 4.50,
    stock: 40,
    variants: [
      { name: "Gourmet Chocolate", image: "🍫" },
      { name: "Vanilla Softserve", image: "🍦" },
      { name: "Strawberry Cream", image: "🍓" },
      { name: "Banana Split", image: "🍌" }
    ],
    image: "🥤",
    isFavorite: false
  },
  {
    id: "vegan-shake",
    name: "Organic Plant Protein",
    category: "Protein",
    type: "variable",
    price: 5.00,
    stock: 25,
    variants: [
      { name: "Chocolate Peanut Butter", image: "🥜" },
      { name: "Vanilla Bean", image: "🌱" },
      { name: "Mocha Fudge", image: "☕" }
    ],
    image: "🌱",
    isFavorite: false
  },
  {
    id: "collagen-water",
    name: "Collagen Beauty Water",
    category: "Protein",
    type: "simple",
    price: 3.75,
    stock: 20,
    variants: null,
    image: "✨",
    isFavorite: false
  },
  {
    id: "preworkout-shot",
    name: "Explosive Pre-Workout Shot",
    category: "Energy",
    type: "variable",
    price: 3.00,
    stock: 30,
    variants: [
      { name: "Sour Apple", image: "🍏" },
      { name: "Blue Lemonade", image: "🍋" },
      { name: "Cherry Bomb", image: "🍒" }
    ],
    image: "💥",
    isFavorite: false
  },
  {
    id: "energy-can",
    name: "Fit & Focus Energy Can",
    category: "Energy",
    type: "variable",
    price: 3.25,
    stock: 60,
    variants: [
      { name: "Sugar-Free Peach", image: "🍑" },
      { name: "Tropical Mango", image: "🥭" },
      { name: "Cosmic Grape", image: "🍇" },
      { name: "Berry Blast", image: "🍓" }
    ],
    image: "🔋",
    isFavorite: true
  },
  {
    id: "protein-coffee",
    name: "Iced Protein Coffee",
    category: "Energy",
    type: "simple",
    price: 4.25,
    stock: 15,
    variants: null,
    image: "☕",
    isFavorite: false
  },
  {
    id: "protein-bar",
    name: "High Protein Crisp Bar",
    category: "Snacks",
    type: "variable",
    price: 2.75,
    stock: 45,
    variants: [
      { name: "Salted Caramel", image: "🍯" },
      { name: "Cookie Dough", image: "🍪" },
      { name: "Peanut Butter Cup", image: "🥜" }
    ],
    image: "🍫",
    isFavorite: false
  },
  {
    id: "beef-jerky",
    name: "Biltong Beef Jerky",
    category: "Snacks",
    type: "simple",
    price: 4.50,
    stock: 20,
    variants: null,
    image: "🥩",
    isFavorite: false
  }
];
