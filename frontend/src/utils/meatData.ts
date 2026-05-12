

export const MEAT_SUBCATEGORIES = {
  Beef: [
    'Ribeye',
    'Tenderloin', 
    'Sirloin',
    'Brisket',
    'Ground Beef',
    'Ox Tail',
    'Liver',
    'Shank',
    'Flank',
    'Chuck'
  ],
  Chicken: [
    'Whole Chicken',
    'Breast',
    'Thighs',
    'Drumsticks', 
    'Wings',
    'Gizzards',
    'Liver',
    'Backquarters'
  ],
  Lamb: [
    'Chops',
    'Leg',
    'Shoulder',
    'Rack',
    'Neck',
    'Ground Lamb'
  ],
  Goat: [
    'Whole Goat',
    'Leg',
    'Shoulder', 
    'Ribs',
    'Ground Goat'
  ],
  Pork: [
    'Pork Chops',
    'Belly',
    'Shoulder',
    'Ribs',
    'Ham',
    'Sausages',
    'Bacon',
    'Ground Pork'
  ],
  Turkey: [
    'Whole Turkey',
    'Breast',
    'Thighs',
    'Drumsticks',
    'Ground Turkey'
  ],
  Duck: [
    'Whole Duck',
    'Breast',
    'Legs',
    'Confit'
  ],
  Rabbit: [
    'Whole Rabbit',
    'Legs',
    'Loin'
  ],
  Venison: [
    'Steaks',
    'Roast',
    'Sausages',
    'Ground'
  ],
  Exotic: [
    'Ostrich',
    'Crocodile',
    'Camel',
    'Buffalo',
    'Wild Boar'
  ]
} as const

export const MEAT_DESCRIPTIONS = {
  Beef: 'Premium quality beef from locally sourced farms, perfect for all your favorite dishes',
  Chicken: 'Fresh, tender chicken raised without antibiotics, ideal for healthy meals',
  Lamb: 'Delicious and tender lamb, perfect for special occasions and traditional dishes',
  Goat: 'Lean and flavorful goat meat, a favorite in many traditional cuisines',
  Pork: 'High-quality pork cuts, perfect for roasting, grilling, and frying',
  Turkey: 'Lean and healthy turkey, great for roasts and sandwiches',
  Duck: 'Rich and flavorful duck, perfect for gourmet cooking',
  Rabbit: 'Lean and tender rabbit meat, a healthy alternative to traditional meats',
  Venison: 'Wild game meat with a rich, distinctive flavor',
  Exotic: 'Unique and exotic meats for the adventurous foodie'
} as const

export const NUTRITIONAL_INFO = {
  Beef: { calories: 250, protein: 26, fat: 15, carbs: 0 },
  Chicken: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  Lamb: { calories: 292, protein: 25, fat: 20, carbs: 0 },
  Goat: { calories: 143, protein: 27, fat: 3, carbs: 0 },
  Pork: { calories: 242, protein: 25, fat: 15, carbs: 0 },
  Turkey: { calories: 135, protein: 30, fat: 1, carbs: 0 },
  Duck: { calories: 337, protein: 24, fat: 28, carbs: 0 },
  Rabbit: { calories: 173, protein: 30, fat: 3.5, carbs: 0 },
  Venison: { calories: 158, protein: 30, fat: 3, carbs: 0 },
  Exotic: { calories: 200, protein: 28, fat: 8, carbs: 0 }
} as const

export const getRandomMeatImage = (category: string): string => {
  const imageUrls = {
    Beef: 'https://images.unsplash.com/photo-1546823998-b7c00af72b9d?w=400',
    Chicken: 'https://images.unsplash.com/photo-1528735602780-2552fd935ab7?w=400',
    Lamb: 'https://images.unsplash.com/photo-1588167333853-34698c7b0a1c?w=400',
    Goat: 'https://images.unsplash.com/photo-1594384784916-35c5a58d79af?w=400',
    Pork: 'https://images.unsplash.com/photo-1529198859222-e4a261cd5f6e?w=400',
    Turkey: 'https://images.unsplash.com/photo-1589980394763-8c0a9c0c0c0c?w=400',
    Duck: 'https://images.unsplash.com/photo-1588167333853-34698c7b0a1c?w=400',
    Rabbit: 'https://images.unsplash.com/photo-1588167333853-34698c7b0a1c?w=400',
    Venison: 'https://images.unsplash.com/photo-1588167333853-34698c7b0a1c?w=400',
    Exotic: 'https://images.unsplash.com/photo-1588167333853-34698c7b0a1c?w=400'
  }
  
  return imageUrls[category as keyof typeof imageUrls] || imageUrls.Beef
}
