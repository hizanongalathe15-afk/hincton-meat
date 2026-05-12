Here's your updated **Hincton Meat Shop** README - rebranded from "Premium Meat Shop" with a professional, market-ready look:

---

# 🥩 Hincton Meat Shop - Complete E-commerce Platform

**Kenya's Premier Online Meat Delivery Service** — Fresh, quality meats delivered to your doorstep with real-time tracking and MPESA payment integration.

## 🌟 Features

### 🛒 Customer Features
- **Product Catalog**: Browse premium meat cuts across multiple categories
- **Advanced Search & Filtering**: Find products by category, price range, and cut type
- **Shopping Cart**: Add items with quantity and weight selection
- **Secure Checkout**: MPESA, card, and cash on delivery options
- **Order Tracking**: Live delivery status updates
- **User Accounts**: Registration, login, order history, and favorites

### 👨‍💼 Admin Features
- **Analytics Dashboard**: Real-time sales, revenue, and inventory insights
- **Product Management**: Full CRUD operations for all meat products
- **Order Management**: Process, track, and fulfill customer orders
- **Delivery Management**: Assign and monitor delivery personnel
- **Inventory Control**: Stock levels, low-stock alerts, and restock management
- **Customer Management**: View and manage customer accounts and history

### 💳 Payment Integration
- **MPESA STK Push**: Instant payment requests via Daraja API
- **Card Payments**: Visa, Mastercard, and American Express
- **Cash on Delivery**: Pay when your order arrives
- **Transaction Tracking**: Real-time payment status updates
- **Payment History**: Complete transaction records

### 🚚 Delivery System
- **Real-time GPS Tracking**: Live driver location updates
- **Delivery Personnel App**: Dedicated interface for delivery staff
- **ETA Calculations**: Accurate estimated arrival times
- **Customer Ratings**: Rate your delivery experience
- **SMS Notifications**: Order status updates via text message

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + TypeScript | Runtime & type safety |
| Express.js | REST API framework |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time features |
| JWT | Authentication |
| MPESA Daraja API | Payment integration |
| Nodemailer | Email notifications |
| Cloudinary | Image hosting |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI Framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Query | Data fetching & caching |
| React Router | Navigation |
| Socket.io Client | Real-time updates |
| Recharts | Analytics charts |

### Infrastructure
- Docker & Docker Compose
- Nginx (production)
- GitHub Actions (CI/CD)

## 📦 Meat Categories

| Category | Cuts Available | Features |
|----------|---------------|----------|
| **Beef** | Ribeye, Tenderloin, Sirloin, Brisket, Ground Beef, Oxtail, Liver | Halal certified, grass-fed |
| **Chicken** | Whole, Breast, Thighs, Drumsticks, Wings, Gizzards | Free-range, farm fresh |
| **Lamb** | Chops, Leg, Shoulder, Rack, Ground Lamb | Imported New Zealand |
| **Goat** | Whole, Leg, Shoulder, Ribs, Ground Goat | Local farm raised |
| **Pork** | Chops, Belly, Shoulder, Ribs, Bacon, Sausages | Premium quality |
| **Turkey** | Whole, Breast, Thighs, Ground Turkey | Hormone-free |
| **Exotic** | Ostrich, Crocodile, Camel, Buffalo | Specialty cuts |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- MongoDB (local dev)

### One-Click Deployment

#### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/hizanongalathe15-afk/hincton-meat.git
cd hincton-meat

# Start all services
docker-compose up -d

# Seed the database
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

#### Local Development
```bash
# Backend
cd backend && npm install
cp .env.example .env
npm run dev

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env
npm run dev
```

## 🔐 Default Accounts (Development)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hinctonmeat.com | admin123 |
| **Customer** | buyer@example.com | buyer123 |

## ⚙️ Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/hincton-meat

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# MPESA Daraja API
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://api.hinctonmeat.com/mpesa/callback

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@hinctonmeat.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=https://hinctonmeat.com
```

### Frontend (.env)
```env
VITE_API_URL=https://api.hinctonmeat.com/api
VITE_SOCKET_URL=https://api.hinctonmeat.com
VITE_MPESA_ENV=production
```

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |

### Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/products` | List all products | Public |
| GET | `/api/products/:id` | Get single product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/status` | Update status |

### Payments (MPESA)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mpesa/stk-push` | Initiate payment |
| POST | `/api/mpesa/callback` | MPESA webhook |
| GET | `/api/mpesa/transaction/:id` | Check status |

## 🏢 Admin Dashboard

### Key Metrics Tracked
- **Revenue**: Daily, weekly, monthly, and yearly
- **Orders**: Total, pending, processing, delivered
- **Customers**: New, returning, total active
- **Products**: Best sellers, low stock, out of stock
- **Delivery**: Average time, driver performance
- **Payments**: MPESA vs card vs cash breakdown

### Management Tools
- **Product Manager**: Bulk import/export, price updates
- **Order Queue**: Real-time order processing
- **Delivery Dispatch**: Assign drivers, optimize routes
- **Customer Support**: Live chat, ticket system
- **Inventory Alerts**: Automatic restock notifications

## 📱 Responsive Design

| Device | Breakpoint | Experience |
|--------|------------|------------|
| Desktop | 1200px+ | Full dashboard, all features |
| Tablet | 768px-1199px | Optimized layout |
| Mobile | 320px-767px | Touch-friendly, simplified navigation |

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (Admin/Customer)
- ✅ Input sanitization & validation
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS whitelist configuration
- ✅ Helmet.js security headers
- ✅ MongoDB injection protection
- ✅ XSS prevention

## 🚢 Deployment Guide

### Deploy to Render (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Render**
   - Create account at [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository

3. **Set Environment Variables**
   - Add all variables from `.env` files
   - Use Render's secret manager for sensitive data

4. **Deploy**
   - Click "Apply"
   - Monitor build logs
   - Both frontend & backend deploy automatically

### Database Setup

**Option 1: MongoDB Atlas (Free Forever)**
- 512 MB storage
- Auto-backups
- Global clusters

**Option 2: Render PostgreSQL (Free 90 days)**
- 500 MB storage
- Auto-scaling
- Built-in dashboard

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Update documentation for new features
- Add tests for critical functionality

## 📄 License

**MIT License** - Free for personal and commercial use.

## 📞 Support & Contact

| Channel | Details |
|---------|---------|
| **Email** | support@hinctonmeat.com |
| **Phone** | +254 797 416 181 |
| **Live Chat** | Available on website |
| **WhatsApp** | +254 797 416 181 |

## 🗺️ Roadmap

### Q2 2025
- [ ] Mobile app (React Native)
- [ ] WhatsApp ordering bot
- [ ] Subscription plans
- [ ] Loyalty points system

### Q3 2025
- [ ] AI-powered product recommendations
- [ ] Advanced delivery route optimization
- [ ] Supplier management portal
- [ ] Bulk ordering for businesses

### Q4 2025
- [ ] Multi-language support (Swahili, English)
- [ ] Advanced analytics dashboard
- [ ] Automated marketing campaigns
- [ ] Integration with major Kenyan supermarkets

---

<div align="center">

**🇰🇪 Proudly Kenyan | Fresh from farm to fork 🇰🇪**

[Website](https://hinctonmeat.com) • [Twitter](https://twitter.com/hinctonmeat) • [Instagram](https://instagram.com/hinctonmeat) • [Facebook](https://facebook.com/hinctonmeat)

*Built with ❤️ for Kenya's premium meat industry*

</div>

