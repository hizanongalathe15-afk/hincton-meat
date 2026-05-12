"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const meatProducts = [
    // Beef Products
    {
        name: 'Premium Beef Ribeye Steak',
        category: 'Beef',
        subCategory: 'Ribeye',
        description: 'Premium cut ribeye steak, perfectly marbled for exceptional flavor and tenderness',
        price: 1200,
        images: ['/uploads/products/ribeye-steak.jpg'],
        weight: { min: 0.5, max: 1.0, unit: 'kg' },
        stockQuantity: 50,
        nutritionalInfo: { calories: 280, protein: 26, fat: 18, carbs: 0 },
        storageInstructions: 'Keep refrigerated, consume within 3-4 days',
        shelfLife: '3-4 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['premium', 'steak', 'grilling']
    },
    {
        name: 'Beef Tenderloin Filet',
        category: 'Beef',
        subCategory: 'Tenderloin',
        description: 'Most tender cut of beef, lean and flavorful',
        price: 1500,
        images: ['/uploads/products/tenderloin.jpg'],
        weight: { min: 0.3, max: 0.8, unit: 'kg' },
        stockQuantity: 30,
        nutritionalInfo: { calories: 250, protein: 28, fat: 15, carbs: 0 },
        storageInstructions: 'Keep refrigerated, best consumed within 2-3 days',
        shelfLife: '2-3 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['premium', 'lean', 'tender']
    },
    {
        name: 'Beef Sirloin Steak',
        category: 'Beef',
        subCategory: 'Sirloin',
        description: 'Lean and flavorful steak, perfect for grilling or pan-searing',
        price: 800,
        images: ['/uploads/products/sirloin.jpg'],
        weight: { min: 0.4, max: 1.2, unit: 'kg' },
        stockQuantity: 40,
        nutritionalInfo: { calories: 240, protein: 27, fat: 14, carbs: 0 },
        storageInstructions: 'Refrigerate immediately, use within 4 days',
        shelfLife: '4 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['grilling', 'lean', 'popular']
    },
    {
        name: 'Ground Beef (80/20)',
        category: 'Beef',
        subCategory: 'Ground Beef',
        description: 'Quality ground beef with 80% lean, 20% fat ratio',
        price: 450,
        images: ['/uploads/products/ground-beef.jpg'],
        weight: { min: 0.5, max: 2.0, unit: 'kg' },
        stockQuantity: 100,
        nutritionalInfo: { calories: 290, protein: 22, fat: 23, carbs: 0 },
        storageInstructions: 'Refrigerate or freeze immediately',
        shelfLife: '2 days refrigerated, 3 months frozen',
        origin: 'Kenya',
        isHalal: true,
        tags: ['versatile', 'cooking', 'family']
    },
    {
        name: 'Beef Brisket',
        category: 'Beef',
        subCategory: 'Brisket',
        description: 'Perfect for slow cooking and smoking',
        price: 600,
        images: ['/uploads/products/brisket.jpg'],
        weight: { min: 2.0, max: 5.0, unit: 'kg' },
        stockQuantity: 25,
        nutritionalInfo: { calories: 310, protein: 24, fat: 24, carbs: 0 },
        storageInstructions: 'Refrigerate, ideal for slow cooking',
        shelfLife: '5 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['slow-cooking', 'smoking', 'large-cut']
    },
    // Chicken Products
    {
        name: 'Whole Fresh Chicken',
        category: 'Chicken',
        subCategory: 'Whole Chicken',
        description: 'Fresh whole chicken, perfect for roasting',
        price: 350,
        images: ['/uploads/products/whole-chicken.jpg'],
        weight: { min: 1.2, max: 2.0, unit: 'kg' },
        stockQuantity: 60,
        nutritionalInfo: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
        storageInstructions: 'Keep refrigerated, use within 2 days',
        shelfLife: '2 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['roasting', 'whole', 'popular']
    },
    {
        name: 'Chicken Breast Fillets',
        category: 'Chicken',
        subCategory: 'Breast',
        description: 'Boneless, skinless chicken breast fillets',
        price: 480,
        images: ['/uploads/products/chicken-breast.jpg'],
        weight: { min: 0.8, max: 1.5, unit: 'kg' },
        stockQuantity: 80,
        nutritionalInfo: { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
        storageInstructions: 'Refrigerate, use within 2 days',
        shelfLife: '2 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['lean', 'healthy', 'versatile']
    },
    {
        name: 'Chicken Thighs',
        category: 'Chicken',
        subCategory: 'Thighs',
        description: 'Bone-in chicken thighs, juicy and flavorful',
        price: 320,
        images: ['/uploads/products/chicken-thighs.jpg'],
        weight: { min: 0.5, max: 1.0, unit: 'kg' },
        stockQuantity: 70,
        nutritionalInfo: { calories: 177, protein: 24, fat: 8.1, carbs: 0 },
        storageInstructions: 'Keep refrigerated, use within 2 days',
        shelfLife: '2 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['flavorful', 'grilling', 'budget-friendly']
    },
    {
        name: 'Chicken Wings',
        category: 'Chicken',
        subCategory: 'Wings',
        description: 'Fresh chicken wings, perfect for frying or grilling',
        price: 380,
        images: ['https://example.com/images/chicken-wings.jpg'],
        weight: { min: 0.8, max: 1.2, unit: 'kg' },
        stockQuantity: 45,
        nutritionalInfo: { calories: 203, protein: 19, fat: 12, carbs: 0 },
        storageInstructions: 'Refrigerate, use within 2 days',
        shelfLife: '2 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['appetizer', 'game-day', 'popular']
    },
    // Lamb Products
    {
        name: 'Lamb Chops',
        category: 'Lamb',
        subCategory: 'Chops',
        description: 'Premium lamb chops, tender and flavorful',
        price: 950,
        images: ['https://example.com/images/lamb-chops.jpg'],
        weight: { min: 0.4, max: 0.8, unit: 'kg' },
        stockQuantity: 35,
        nutritionalInfo: { calories: 292, protein: 25, fat: 20, carbs: 0 },
        storageInstructions: 'Refrigerate, use within 3 days',
        shelfLife: '3 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['premium', 'grilling', 'special-occasion']
    },
    {
        name: 'Lamb Leg Roast',
        category: 'Lamb',
        subCategory: 'Leg',
        description: 'Whole lamb leg, perfect for roasting',
        price: 750,
        images: ['https://example.com/images/lamb-leg.jpg'],
        weight: { min: 2.0, max: 4.0, unit: 'kg' },
        stockQuantity: 20,
        nutritionalInfo: { calories: 278, protein: 24, fat: 19, carbs: 0 },
        storageInstructions: 'Refrigerate, ideal for roasting',
        shelfLife: '4 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['roasting', 'large-cut', 'family-meal']
    },
    // Goat Products
    {
        name: 'Goat Meat Pieces',
        category: 'Goat',
        subCategory: 'Pieces',
        description: 'Fresh goat meat pieces, perfect for stews and curries',
        price: 520,
        images: ['https://example.com/images/goat-meat.jpg'],
        weight: { min: 1.0, max: 2.0, unit: 'kg' },
        stockQuantity: 40,
        nutritionalInfo: { calories: 143, protein: 27, fat: 3, carbs: 0 },
        storageInstructions: 'Refrigerate, use within 3 days',
        shelfLife: '3 days refrigerated',
        origin: 'Kenya',
        isHalal: true,
        tags: ['stew', 'curry', 'traditional']
    },
    // Pork Products
    {
        name: 'Pork Chops',
        category: 'Pork',
        subCategory: 'Chops',
        description: 'Fresh pork chops, juicy and tender',
        price: 420,
        images: ['https://example.com/images/pork-chops.jpg'],
        weight: { min: 0.6, max: 1.0, unit: 'kg' },
        stockQuantity: 30,
        nutritionalInfo: { calories: 242, protein: 25, fat: 15, carbs: 0 },
        storageInstructions: 'Refrigerate, use within 3 days',
        shelfLife: '3 days refrigerated',
        origin: 'Kenya',
        isHalal: false,
        tags: ['grilling', 'pan-fry', 'popular']
    },
    {
        name: 'Pork Belly',
        category: 'Pork',
        subCategory: 'Belly',
        description: 'Fresh pork belly, perfect for slow cooking',
        price: 380,
        images: ['https://example.com/images/pork-belly.jpg'],
        weight: { min: 1.0, max: 2.5, unit: 'kg' },
        stockQuantity: 25,
        nutritionalInfo: { calories: 518, protein: 17, fat: 53, carbs: 0 },
        storageInstructions: 'Refrigerate, ideal for slow cooking',
        shelfLife: '4 days refrigerated',
        origin: 'Kenya',
        isHalal: false,
        tags: ['slow-cooking', 'bacon', 'rich-flavor']
    }
];
const seedDatabase = async () => {
    try {
        // Connect to database
        await prisma_1.prisma.$connect();
        // Clear existing data
        await prisma_1.prisma.product.deleteMany({});
        await prisma_1.prisma.user.deleteMany({});
        // Create admin user
        const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
        const adminUser = await prisma_1.prisma.user.create({
            data: {
                email: 'admin@meat.hub',
                roles: ['ADMIN'],
                profile: {
                    create: {
                        fullName: 'Super Admin'
                    }
                },
                security: {
                    create: {
                        password_hash: hashedPassword,
                        isEmailVerified: true
                    }
                }
            }
        });
        // Create sample buyer user with address
        const buyerPassword = await bcryptjs_1.default.hash('buyer123', 12);
        // const buyerAddress = await prisma.address.create({
        //   data: {
        //     street: '123 Main St',
        //     city: 'Nairobi',
        //     state: 'Nairobi',
        //     zipCode: '00100'
        //   }
        // });
        const buyerUser = await prisma_1.prisma.user.create({
            data: {
                email: 'buyer@example.com',
                phone: '+254712345678',
                roles: ['BUYER'],
                profile: {
                    create: {
                        fullName: 'John Buyer'
                    }
                },
                security: {
                    create: {
                        password_hash: buyerPassword,
                        isEmailVerified: true
                    }
                }
            }
        });
        // Insert meat products
        for (const product of meatProducts) {
            await prisma_1.prisma.product.create({
                data: {
                    name: product.name,
                    slug: product.name.toLowerCase().replace(/\s+/g, '-'),
                    description: product.description,
                    price: product.price,
                    sku: `MEAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    stockQuantity: product.stockQuantity || 10,
                    stockStatus: 'in_stock',
                    isPublished: true,
                    isFeatured: false,
                    productImages: {
                        create: product.images.map((url, index) => ({
                            url,
                            alt: `${product.name} image ${index + 1}`,
                            sortOrder: index,
                            isPrimary: index === 0
                        }))
                    }
                }
            });
        }
        console.log('Database seeded successfully!');
        console.log('Admin user: admin@hinctonmeatproducts.com / admin123');
        console.log('Buyer user: buyer@example.com / buyer123');
        await prisma_1.prisma.$disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        await prisma_1.prisma.$disconnect();
        process.exit(1);
    }
};
if (require.main === module) {
    seedDatabase();
}
exports.default = seedDatabase;
//# sourceMappingURL=seedData.js.map