# MoveinSync - Fleet Management System

MoveinSync is a comprehensive fleet management system designed to help businesses manage their transportation assets, including vendors, vehicles, drivers, and compliance documentation. The application provides role-based dashboards for different levels of management, from drivers to super administrators.

## Project Structure

The project is organized into two main directories:

```
├── Frontend - React application built with Vite
└── Backend - Node.js Express REST API
```

## Features

- **User Authentication & Authorization** - Secure login with role-based access control
- **Vendor Management** - Hierarchical vendor management system with parent-child relationships
- **Vehicle Management** - Track and manage vehicle details and documentation
- **Driver Management** - Onboarding, document verification, and management of drivers
- **Document Management** - Upload, verify, and track compliance documents
- **Role-Based Dashboards** - Tailored interfaces for:
  - Drivers
  - City Managers
  - Regional Managers
  - Super Administrators
- **Analytics & Reports** - Track compliance metrics and operational statistics

## Technology Stack

### Backend

- **Framework**: Node.js with Express
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Other Libraries**: bcryptjs, cors, dotenv

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: CSS Modules

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MoveinSync
```

2. Install Backend Dependencies
```bash
cd Backend
npm install
```

3. Set up environment variables
Copy the `.env.example` file to a new file named `.env` in the Backend directory:
```bash
cp .env.example .env
```

Then edit the `.env` file with your specific configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/moveinsync  # Your MongoDB connection string
JWT_SECRET=your_jwt_secret                        # Generate a strong secret
JWT_EXPIRES_IN=30d
```

4. Install Frontend Dependencies
```bash
cd ../Frontend
npm install
```

5. Set up frontend environment variables
Create a `.env` file in the Frontend directory with:
```
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

#### Backend

```bash
cd Backend
npm run dev  # For development with hot reload
# OR
npm start    # For production
```

The backend server will start on http://localhost:5000

#### Frontend

```bash
cd Frontend
npm run dev
```

The frontend development server will start on http://localhost:5173

## Security Best Practices

1. **Environment Variables**:
   - Never commit your `.env` file to version control
   - Use the provided `.env.example` as a template
   - For production, set environment variables through your hosting platform

2. **MongoDB Connection String**:
   - Create a dedicated database user with limited permissions
   - Use a strong password for your MongoDB user
   - Restrict network access to your database with IP whitelisting

3. **JWT Secret**:
   - Generate a strong random string for your JWT_SECRET
   - Consider using a tool like `openssl rand -hex 32` to generate a secure secret
   - Rotate the JWT secret periodically in production environments

4. **File Uploads**:
   - The upload directories are gitignored except for `.gitkeep` files
   - Implement additional validation for uploaded files in production

### Building for Production

```bash
cd Frontend
npm run build
```

The build output will be in the `dist` directory.

## API Endpoints

The application exposes several REST API endpoints:

- `/api/auth` - Authentication routes
- `/api/vendors` - Vendor management
- `/api/vehicles` - Vehicle management
- `/api/drivers` - Driver management
- `/api/documents` - Document management
- `/api/stats` - Statistics and analytics

## Folder Structure

```
MoveinSync/
├── .gitignore                # Git ignore rules
├── .env.example              # Example environment variables (safe to commit)
├── README.md                 # Project documentation
│
├── Backend/
│   ├── .env                  # Environment variables (not committed to Git)
│   ├── package.json          # Backend dependencies and scripts
│   ├── seed.js               # Database seeding script
│   ├── fix-permissions.js    # Utility script for permissions
│   ├── update-password.js    # Utility for password management
│   ├── update-permissions-seed.js # Permission seeding utility
│   ├── checkVendors.js       # Vendor validation utility
│   ├── createSampleHierarchy.js # Sample data generator
│   │
│   ├── src/
│   │   ├── app.js            # Express application setup
│   │   ├── server.js         # Server entry point
│   │   │
│   │   ├── config/
│   │   │   └── db.js         # Database configuration
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js      # Authentication logic
│   │   │   ├── documentController.js  # Document management
│   │   │   ├── driverController.js    # Driver management
│   │   │   ├── vehicleController.js   # Vehicle management
│   │   │   └── vendorController.js    # Vendor management
│   │   │
│   │   ├── middleware/
│   │   │   ├── authenticate.js        # JWT authentication
│   │   │   ├── authorize.js           # Role-based authorization
│   │   │   └── errorHandler.js        # Global error handling
│   │   │
│   │   ├── models/
│   │   │   ├── Driver.js     # Driver data model
│   │   │   ├── User.js       # User account model
│   │   │   ├── Vehicle.js    # Vehicle data model
│   │   │   └── Vendor.js     # Vendor data model
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js       # Authentication routes
│   │   │   ├── documents.js  # Document management routes
│   │   │   ├── drivers.js    # Driver management routes
│   │   │   ├── stats.js      # Analytics & statistics
│   │   │   ├── vehicles.js   # Vehicle management routes
│   │   │   └── vendors.js    # Vendor management routes
│   │   │
│   │   └── utils/
│   │       ├── generateToken.js  # JWT token generation
│   │       └── subtree.js        # Hierarchical data utilities
│   │
│   └── uploads/                  # File upload storage (not committed)
│       ├── drivers/              # Driver documents
│       │   └── .gitkeep          # Empty file to maintain directory
│       └── vehicles/             # Vehicle documents
│           └── .gitkeep          # Empty file to maintain directory
│
└── Frontend/
    ├── package.json          # Frontend dependencies and scripts
    ├── index.html            # Root HTML file
    ├── vite.config.js        # Vite configuration
    ├── eslint.config.js      # ESLint configuration
    │
    ├── public/               # Static assets 
    │   └── index.html        # Public index file
    │
    └── src/
        ├── App.jsx           # Root React component
        ├── AppRoutes.jsx     # Application routes
        ├── main.jsx          # Application entry point
        │
        ├── api/              # API client and service functions
        │   ├── apiClient.js  # Base API client setup
        │   ├── auth.js       # Authentication API
        │   ├── documents.js  # Document API
        │   ├── drivers.js    # Driver API
        │   ├── fleet.js      # Fleet management API
        │   ├── stats.js      # Statistics API
        │   ├── vehicles.js   # Vehicle API
        │   └── vendors.js    # Vendor API
        │
        ├── components/       # Reusable React components
        │   ├── CreateDriverForm.jsx
        │   ├── CreateVehicleForm.jsx
        │   ├── DashboardStats.jsx
        │   ├── DocumentStatus.jsx
        │   ├── DocumentUploadForm.jsx
        │   ├── DriverDetails.jsx
        │   ├── FileUpload.jsx
        │   ├── FleetManagement.jsx
        │   ├── LoginForm.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── Sidebar.jsx
        │   ├── SubVendorForm.jsx
        │   ├── VehicleDetails.jsx
        │   ├── Vendordetails.jsx
        │   ├── VendorPermissionsManager.jsx
        │   └── VendorTree.jsx
        │
        ├── pages/            # Page components
        │   ├── AnalyticsPage.jsx
        │   ├── CityHomePage.jsx
        │   ├── CompliancePage.jsx
        │   ├── Dashboard.jsx
        │   ├── DashboardCity.jsx
        │   ├── DashboardDriver.jsx
        │   ├── DashboardRegional.jsx
        │   ├── DashboardSuper.jsx
        │   ├── DriverDocumentsPage.jsx
        │   ├── DriverHomePage.jsx
        │   ├── DriversPage.jsx
        │   ├── FleetPage.jsx
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── NotFound.jsx
        │   ├── RegionalHomePage.jsx
        │   ├── SimpleDashboard.jsx
        │   ├── SuperHomePage.jsx
        │   ├── VehiclesPage.jsx
        │   ├── VendorsPage.jsx
        │   └── VerificationPage.jsx
        │
        ├── store/            # State management
        │   └── authStore.js  # Authentication state
        │
        ├── styles/           # CSS stylesheets
        │   ├── global.css    # Global styles
        │   ├── dashboard.css # Dashboard styles
        │   ├── form.css      # Form styles
        │   └── ...           # Other component-specific styles
        │
        └── utils/            # Utility functions
            └── constants.js  # Application constants
```
