# 🥩 Premium Meat Shop - Complete E-commerce Platform

A full-featured e-commerce platform for selling premium quality meats online with admin management, MPESA payment integration, and real-time delivery tracking.

## 🌟 Features

### 🛒 Customer Features
- **Product Catalog**: Browse 50+ meat varieties across 10 categories
- **Advanced Search & Filtering**: Find products by category, price, and more
- **Shopping Cart**: Add to cart with quantity and weight selection
- **Secure Checkout**: Multiple payment methods including MPESA
- **Order Tracking**: Real-time delivery status updates
- **User Accounts**: Registration, login, and profile management

### 👨‍💼 Admin Features
- **Dashboard**: Comprehensive analytics and sales insights
- **Product Management**: Full CRUD operations for meat products
- **Order Management**: Process and track customer orders
- **Delivery Management**: Assign and monitor delivery personnel
- **Inventory Management**: Stock levels and alerts
- **Customer Management**: View and manage customer accounts

### 💳 Payment Integration
- **MPESA Integration**: Complete Kenyan mobile money support
- **STK Push**: Instant payment requests
- **Transaction Tracking**: Real-time payment status updates
- **Payment History**: Complete transaction records

### 🚚 Delivery System
- **Real-time Tracking**: Live location updates
- **Delivery Personnel Management**: Assign and track delivery staff
- **Delivery Analytics**: Performance metrics and reports
- **Customer Ratings**: Feedback system for delivery service

## 🏗️ Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time features
- **JWT** authentication
- **MPESA API** integration
- **Nodemailer** for email services

### Frontend
- **React 18** with **TypeScript**
- **Vite** build tool
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Lucide React** for icons
- **Socket.io Client** for real-time updates

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** reverse proxy
- **MongoDB** database

## 📦 Meat Categories & Products

### Available Categories
1. **Beef** (10+ cuts): Ribeye, Tenderloin, Sirloin, Brisket, Ground Beef, Ox Tail, Liver, Shank, Flank, Chuck
2. **Chicken** (8+ cuts): Whole Chicken, Breast, Thighs, Drumsticks, Wings, Gizzards, Liver, Backquarters
3. **Lamb** (6+ cuts): Chops, Leg, Shoulder, Rack, Neck, Ground Lamb
4. **Goat** (5+ cuts): Whole Goat, Leg, Shoulder, Ribs, Ground Goat
5. **Pork** (8+ cuts): Pork Chops, Belly, Shoulder, Ribs, Ham, Sausages, Bacon, Ground Pork
6. **Turkey** (5+ cuts): Whole Turkey, Breast, Thighs, Drumsticks, Ground Turkey
7. **Duck** (4+ cuts): Whole Duck, Breast, Legs, Confit
8. **Rabbit** (3+ cuts): Whole Rabbit, Legs, Loin
9. **Venison** (4+ cuts): Steaks, Roast, Sausages, Ground
10. **Exotic** (5+ types): Ostrich, Crocodile, Camel, Buffalo, Wild Boar

### Product Features
- **Editable by Admin**: Full CRUD operations for all products
- **Nutritional Information**: Calories, protein, fat, carbs
- **Storage Instructions**: Proper handling and storage guidelines
- **Shelf Life**: Freshness and expiration information
- **Halal Certification**: Marked for certified products
- **Weight Options**: Multiple weight units (kg, g, lbs)
- **Stock Management**: Real-time inventory tracking
- **Discount System**: Promotional pricing support

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd premium-meat-shop
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

4. **Seed the database**
   ```bash
   docker-compose exec backend npm run seed
   ```

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Setup environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start MongoDB**
   ```bash
   mongod
   ```

4. **Run the application**
   ```bash
   # Backend (in one terminal)
   cd backend
   npm run dev

   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

5. **Seed the database**
   ```bash
   cd backend
   npm run seed
   ```

## 📋 Default Accounts

After seeding the database, you can use these accounts:

### Admin Account
- **Email**: admin@premiummeatshop.com
- **Password**: admin123
- **Access**: Full admin dashboard and management features

### Customer Account
- **Email**: buyer@example.com
- **Password**: buyer123
- **Access**: Customer shopping and order management

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/premium-meat-shop
PORT=5000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# MPESA
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Product Endpoints
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:category` - Get products by category

### Order Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders (user/admin)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin)
- `PATCH /api/orders/:id/cancel` - Cancel order

### MPESA Endpoints
- `POST /api/mpesa/stk-push` - Initiate MPESA payment
- `POST /api/mpesa/callback` - MPESA callback webhook
- `GET /api/mpesa/transaction/:id` - Check transaction status

## 🏢 Admin Dashboard Features

### Dashboard Overview
- **Sales Analytics**: Revenue, orders, and customer metrics
- **Product Performance**: Best-selling items and inventory status
- **Order Management**: Real-time order processing and tracking
- **Customer Insights**: User statistics and behavior analytics

### Product Management
- **Add New Products**: Create meat products with all details
- **Edit Products**: Update prices, descriptions, images, and inventory
- **Delete Products**: Remove discontinued items
- **Stock Management**: Update quantities and availability
- **Bulk Operations**: Import/export product data

### Order Processing
- **Order Queue**: View and process incoming orders
- **Status Updates**: Track order progress from pending to delivered
- **Delivery Assignment**: Assign delivery personnel to orders
- **Customer Communication**: Send order updates and notifications

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and user role separation
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin resource sharing controls
- **Helmet.js**: Security headers and protections

## 🚀 Deployment

### Production Deployment with Docker

1. **Configure environment variables**
   - Update `.env` files with production values
   - Set secure JWT secrets
   - Configure MPESA production credentials

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Setup reverse proxy** (nginx/Apache)
4. **Configure SSL certificates**
5. **Setup monitoring and logging**

### Environment-Specific Configurations
- **Development**: Hot reload, detailed logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, security hardening

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@premiummeatshop.com
- 📞 Phone: +254 797416181
- 💬 Live Chat: Available on the website

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics Dashboard
- [ ] Loyalty Program System
- [ ] Subscription Services
- [ ] Multi-language Support
- [ ] Advanced Inventory Management
- [ ] Supplier Management
- [ ] Marketing Campaign Tools

### Technical Improvements
- [ ] Microservices Architecture
- [ ] Advanced Caching Strategy
- [ ] Performance Optimization
- [ ] Enhanced Security Features
- [ ] Automated Testing Suite
- [ ] CI/CD Pipeline

---

**Built with ❤️ for the premium meat industry in Kenya**
