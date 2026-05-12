"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const slugify = (input) => input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const categories = [
    { name: 'Sausages', image: '/hincton/hero-platter.jpg' },
    { name: 'Beef Cuts', image: '/hincton/beef-cuts.jpg' },
    { name: 'Lamb/Goat Cuts', image: '/hincton/lamb-mutton.jpg' },
    { name: 'Capon', image: '/hincton/chicken.jpg' },
];
const products = [
    ['Sausages', 'Value Pack Beef Sausages 1Kg', 700],
    ['Sausages', 'Beef Catering Sausage 1Kg', 700],
    ['Sausages', 'Beef Vienna 1kg', 950],
    ['Sausages', 'Beef Choma 1kg', 950],
    ['Sausages', 'Beef Burger 400g', 1500],
    ['Sausages', 'Meat Balls 300g', 950],
    ['Beef Cuts', 'Rib Eye steak, boneless, portioned per kg', 1400],
    ['Beef Cuts', 'Rib Eye Steak, bone-in, portioned per kg', 850],
    ['Beef Cuts', 'Striploin steak, portioned per kg', 900],
    ['Beef Cuts', 'T-Bone Steak portioned per kg', 1500],
    ['Beef Cuts', 'Rump Steak per kg', 900],
    ['Beef Cuts', 'Top Side per kg', 900],
    ['Beef Cuts', 'Cubed Beef on Bone per kg', 750],
    ['Beef Cuts', 'Beef Boneless Cube per kg', 800],
    ['Beef Cuts', 'Silver Side per kg', 800],
    ['Beef Cuts', 'Beef Fillet per kg', 1300],
    ['Beef Cuts', 'Lean Beef Mince per kg', 900],
    ['Beef Cuts', 'Beef Strips per kg', 900],
    ['Beef Cuts', 'Barbeque Beef Ribs per kg', 800],
    ['Beef Cuts', 'Tomahawk Steak per kg', 0],
    ['Beef Cuts', 'Ossobuco per kg', 700],
    ['Beef Cuts', 'Oxtail portioned per kg', 650],
    ['Beef Cuts', 'Brisket per kg', 950],
    ['Beef Cuts', 'Bone Marrow per kg', 200],
    ['Beef Cuts', 'Beef Slice per kg', 900],
    ['Beef Cuts', 'Ox Liver per kg', 800],
    ['Beef Cuts', 'Ox Kidneys per kg', 800],
    ['Beef Cuts', 'Whole Beef Carcass per kg', 550],
    ['Beef Cuts', 'Beef Forequarter per kg', 600],
    ['Beef Cuts', 'Beef Hindquarter per kg', 600],
    ['Lamb/Goat Cuts', 'Whole Lamb per kg', 900],
    ['Lamb/Goat Cuts', 'Whole Lamb Leg Bone per kg', 900],
    ['Lamb/Goat Cuts', 'Lamb Leg Sliced Bone In per kg', 900],
    ['Lamb/Goat Cuts', 'Lamb Shoulder Chops per kg', 900],
    ['Lamb/Goat Cuts', 'Lamb Loin Chops per kg', 1400],
    ['Lamb/Goat Cuts', 'Rack of Lamb per kg', 900],
    ['Lamb/Goat Cuts', 'Lamb Cube Boneless per kg', 1500],
    ['Lamb/Goat Cuts', 'Lamb Cubed Bone per kg', 1200],
    ['Lamb/Goat Cuts', 'Lamb Ribs per kg', 1200],
    ['Lamb/Goat Cuts', 'Frenched Lamb Chops per kg', 1500],
    ['Lamb/Goat Cuts', 'Lamb Casserole', 900],
    ['Lamb/Goat Cuts', 'Whole Goat per kg', 850],
    ['Lamb/Goat Cuts', 'Cubed Goat Bone per kg', 900],
    ['Lamb/Goat Cuts', 'Goat Liver per kg', 800],
    ['Lamb/Goat Cuts', 'Goat Kidneys', 1400],
    ['Capon', 'Drum Legs per kg', 450],
    ['Capon', 'Wings per kg', 600],
    ['Capon', 'Boneless per kg', 750],
    ['Capon', 'Thigh per kg', 600],
    ['Capon', 'Drum Steak per kg', 650],
    ['Capon', 'Soup Pack per kg', 200],
    ['Capon', 'Spring Chicken per kg', 450],
    ['Capon', 'Capon size 1.1kg, 1.2kg, 1.3kg, 1.4kg, 1.5kg', 450],
];
async function main() {
    const categoryMap = new Map();
    for (const category of categories) {
        const saved = await prisma.category.upsert({
            where: { slug: slugify(category.name) },
            update: { name: category.name, image: category.image, isActive: true },
            create: {
                name: category.name,
                slug: slugify(category.name),
                image: category.image,
                isActive: true,
                isFeatured: true,
            },
        });
        categoryMap.set(category.name, saved.id);
    }
    for (const [categoryName, name, price] of products) {
        const slug = slugify(name);
        const categoryId = categoryMap.get(categoryName);
        const image = categoryName === 'Capon' ? '/hincton/chicken.jpg' :
            categoryName === 'Lamb/Goat Cuts' ? '/hincton/lamb-mutton.jpg' :
                categoryName === 'Beef Cuts' ? '/hincton/beef-cuts.jpg' :
                    '/hincton/hero-platter.jpg';
        const saved = await prisma.product.upsert({
            where: { slug },
            update: {
                name,
                price: (price || 1),
                categoryId,
                isPublished: price > 0,
                brand: 'Hincton Meat Products',
                stockQuantity: 100,
            },
            create: {
                name,
                slug,
                sku: `HMP-${slug.slice(0, 24).toUpperCase()}`,
                description: `${name}. Prices are subject to change without prior notice.`,
                price: (price || 1),
                categoryId,
                isPublished: price > 0,
                isFeatured: price > 0,
                brand: 'Hincton Meat Products',
                stockQuantity: 100,
                productImages: { create: [{ url: image, isPrimary: true, sortOrder: 0 }] },
            },
        });
        const images = await prisma.productImage.count({ where: { productId: saved.id } });
        if (!images) {
            await prisma.productImage.create({ data: { productId: saved.id, url: image, isPrimary: true } });
        }
    }
    console.log(`Seeded ${products.length} Hincton pricelist products.`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seedHinctonPricelist.js.map