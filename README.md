# StockPilot

## 🎯 Description
A comprehensive inventory management system designed for Indian businesses with real-time stock tracking, vendor management, and AI-powered analytics.

## ✨ Features
- Real-time Inventory Tracking with batch management and expiry date monitoring
- Vendor Management with performance analytics and delivery tracking
- Purchase & Sales Management with automated invoice generation
- Advanced Analytics with interactive dashboards and forecasting
- AI Chat Assistant for intelligent inventory queries
- Comprehensive PDF Reports (Stock Statement, Vendor Performance)
- Third-party Integrations (Email, Razorpay, WhatsApp Business)
- India-specific Features with GST compliance and HSN codes

## 🛠️ Technologies Used
- React 19 with TypeScript
- Tailwind CSS 4
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Chart.js for data visualization
- jsPDF for report generation
- React Router for navigation
- Vite for build tooling

## � How to Run
1. Clone this repository
   ```bash
   git clone https://github.com/TeamEquinox-05/StockPilot.git
   cd StockPilot
   ```
2. Navigate to the project folder and install backend dependencies
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```
4. Set up environment variables:
   - Create `.env` files in both backend and frontend folders
   - Backend: Add MongoDB URI, JWT secret, email credentials
   - Frontend: Add API URL and app name
5. Run the backend: `npm run dev` (from backend folder)
6. Run the frontend: `npm run dev` (from frontend folder)
7. Access at: `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend API)

## � Team Members
- **Rhugved Dangui** - [@Rhugved Dangui](https://github.com/rhugveddangui) -Fullstack Developer
- **Fayaz khan** - [@](https://github.com/PalletCoder) - Frontend Developer
- **Tanmay Desai** - [@tanmaydesai07](https://github.com/tanmaydesai07) - AI ml Developer

A modern inventory management system built with React, Node.js, and MongoDB.

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your values:
   ```env
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
   MONGODB_URI=mongodb://localhost:27017/stockpilot
   PORT=5000
   NODE_ENV=development
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your values:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_API_AUTH_ENDPOINT=/api/auth
   VITE_APP_NAME=StockPilot
   VITE_ENV=development
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### MongoDB Setup

Make sure you have MongoDB running locally on port 27017, or update the `MONGODB_URI` in your backend `.env` file to point to your MongoDB instance.

## Environment Variables

### Backend (.env)
- `JWT_SECRET`: Secret key for JWT token signing (make it long and complex)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Port number for the backend server
- `NODE_ENV`: Environment mode (development/production)

### Frontend (.env)
- `VITE_API_BASE_URL`: Base URL for the backend API
- `VITE_API_AUTH_ENDPOINT`: Authentication endpoint path
- `VITE_APP_NAME`: Application name displayed in the UI
- `VITE_ENV`: Environment mode

## Features

### 🔐 Authentication & Security
- ✅ User authentication with JWT tokens
- ✅ Protected routes and automatic login redirects
- ✅ Secure token management with automatic refresh
- ✅ Password hashing with bcrypt
- ✅ Role-based access control

### 🏪 Vendor Management
- ✅ Add new vendors with complete contact information
- ✅ View all vendors in organized table format
- ✅ Vendor selection in purchase workflows
- ✅ Vendor contact details (name, phone, email, address)

### 📦 Product Management
- ✅ Add new products with categories
- ✅ Product search and autocomplete functionality
- ✅ Product batch management system
- ✅ Barcode support (optional field)
- ✅ Expiry date tracking
- ✅ MRP and tax rate management

### 🛒 Purchase Management
- ✅ Create purchase orders with multiple items
- ✅ Intelligent product autocomplete with batch details
- ✅ Dynamic vendor selection
- ✅ Real-time quantity and pricing calculations
- ✅ Batch number generation and tracking
- ✅ Expiry date management with validation
- ✅ Tax rate configuration per product
- ✅ Purchase history and tracking

### 💰 Sales Management
- ✅ Point-of-Sale (POS) interface
- ✅ Product search with live autocomplete suggestions
- ✅ Stock availability checking in real-time
- ✅ Customer information management
- ✅ Auto-incrementing bill number system (BILL-YYYYMMDD-XXXX format)
- ✅ Professional sales table with item details
- ✅ Percentage-based discount system
- ✅ Tax calculations using actual purchase tax rates
- ✅ Payment method selection (Cash, Card, UPI)
- ✅ Sale validation and confirmation dialogs
- ✅ Receipt generation with professional formatting
- ✅ Automatic stock deduction after sales

### 📊 Inventory Tracking
- ✅ Real-time stock level monitoring
- ✅ Automatic stock updates on purchases and sales
- ✅ Batch-wise inventory tracking
- ✅ Stock availability checks during sales
- ✅ Quantity validation and alerts

### 🎨 User Interface & Experience
- ✅ Clean, professional UI design with Tailwind CSS
- ✅ Responsive sidebar navigation
- ✅ Modern component library (ShadCN UI)
- ✅ Professional table layouts matching business standards
- ✅ Loading states and user feedback
- ✅ Error handling with user-friendly messages
- ✅ Confirmation dialogs for critical actions

### 🔧 Technical Features
- ✅ Environment-based configuration
- ✅ Hot reloading during development
- ✅ TypeScript for type safety
- ✅ RESTful API architecture
- ✅ MongoDB database with optimized schemas
- ✅ CORS enabled for cross-origin requests
- ✅ Input validation on both frontend and backend
- ✅ Error logging and debugging endpoints

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login with JWT token generation
- `GET /verify` - Token verification and user details

### Vendor Routes (`/api/vendors`)
- `GET /` - Get all vendors
- `POST /` - Create new vendor
- `GET /:id` - Get vendor by ID
- `PUT /:id` - Update vendor
- `DELETE /:id` - Delete vendor

### Product Routes (`/api/products`)
- `GET /` - Get all products
- `POST /` - Create new product
- `GET /search` - Search products with autocomplete
- `GET /:id` - Get product by ID
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product

### Purchase Routes (`/api/purchases`)
- `GET /` - Get all purchases
- `POST /` - Create new purchase with items
- `GET /search-products` - Search products for purchase autocomplete
- `GET /:id` - Get purchase by ID with items
- `PUT /:id` - Update purchase
- `DELETE /:id` - Delete purchase

### Sales Routes (`/api/sales`)
- `GET /` - Get all sales
- `POST /` - Create new sale with automatic stock deduction
- `GET /search-products` - Search products for sales with stock availability
- `GET /next-bill-number` - Generate next auto-incrementing bill number
- `GET /debug/products` - Debug endpoint for product verification
- `GET /:id` - Get sale by ID with items

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Collections
- **users** - User authentication and profile data
- **vendors** - Vendor contact and business information  
- **products** - Product catalog with categories
- **product_batches** - Batch-wise inventory with stock levels
- **purchases** - Purchase orders and vendor transactions
- **purchase_items** - Individual items within purchase orders
- **sales** - Sales transactions and customer information
- **sale_items** - Individual items within sales transactions

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and hot reloading
- Tailwind CSS for responsive styling
- ShadCN UI components for modern interface
- React Router for client-side navigation
- Fetch API for HTTP requests

**Backend:**
- Node.js with Express framework
- MongoDB with Mongoose ODM
- JWT for secure authentication
- bcrypt for password hashing
- CORS enabled for cross-origin requests
- dotenv for environment configuration

**Development Tools:**
- TypeScript for type safety
- ESLint for code quality
- Environment-based configuration
- Hot reloading for both frontend and backend

## Project Structure

```
StockPilot/
├── backend/
│   ├── controllers/          # API route handlers
│   │   ├── authController.js
│   │   ├── salesController.js
│   │   ├── purchaseController.js
│   │   ├── productController.js
│   │   └── vendorController.js
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   ├── Product.js
│   │   ├── ProductBatch.js
│   │   ├── Purchase.js
│   │   ├── PurchaseItem.js
│   │   ├── Sale.js
│   │   └── SaleItem.js
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── productRoutes.js
│   │   └── vendorRoutes.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── server.js           # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # ShadCN UI components
│   │   │   ├── AuthRouter.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages/          # Application pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Purchases.tsx
│   │   │   └── Sales.tsx
│   │   ├── utils/          # Utility functions
│   │   │   └── auth.ts
│   │   ├── lib/           # Library configurations
│   │   │   └── utils.ts
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── .env.example       # Environment variables template
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Usage Examples

### Creating a Purchase Order
1. Navigate to Purchases page
2. Select vendor from dropdown
3. Search and add products using autocomplete
4. Set quantities, MRP, and tax rates
5. Batch numbers auto-generate or can be manually entered
6. Add expiry dates where applicable
7. Submit purchase to update inventory

### Processing a Sale
1. Navigate to Sales page  
2. Search products using autocomplete (shows only items in stock)
3. Add items to cart with quantities
4. Apply percentage-based discounts if needed
5. Enter customer details
6. System auto-generates bill number (BILL-YYYYMMDD-XXXX format)
7. Complete sale to automatically:
   - Deduct stock quantities
   - Generate professional receipt
   - Store transaction records

### Managing Inventory
- Real-time stock levels displayed during product search
- Batch-wise tracking with expiry date monitoring
- Automatic stock updates on purchases and sales
- Stock availability validation prevents overselling

## Development

Both frontend and backend support hot reloading during development. Make sure to have both servers running for full functionality.

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:5000

### Development Commands
```bash
# Backend
cd backend
npm run dev        # Start with nodemon
npm start         # Start production server

# Frontend  
cd frontend
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```