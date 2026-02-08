/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdvertGenerator from './pages/AdvertGenerator';
import Announcements from './pages/Announcements';
import BusinessAnalytics from './pages/BusinessAnalytics';
import Customers from './pages/Customers';
import DamagedInventory from './pages/DamagedInventory';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Expenditures from './pages/Expenditures';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import InventorySections from './pages/InventorySections';
import ProductSalesReport from './pages/ProductSalesReport';
import QuickSale from './pages/QuickSale';
import Sales from './pages/Sales';
import SalesBySections from './pages/SalesBySections';
import ShopGallery from './pages/ShopGallery';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import VideoConference from './pages/VideoConference';
import CustomerShop from './pages/CustomerShop';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import PublicShop from './pages/PublicShop';
import ShopCustomization from './pages/ShopCustomization';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdvertGenerator": AdvertGenerator,
    "Announcements": Announcements,
    "BusinessAnalytics": BusinessAnalytics,
    "Customers": Customers,
    "DamagedInventory": DamagedInventory,
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Expenditures": Expenditures,
    "Home": Home,
    "Inventory": Inventory,
    "InventorySections": InventorySections,
    "ProductSalesReport": ProductSalesReport,
    "QuickSale": QuickSale,
    "Sales": Sales,
    "SalesBySections": SalesBySections,
    "ShopGallery": ShopGallery,
    "Suppliers": Suppliers,
    "Transactions": Transactions,
    "Users": Users,
    "VideoConference": VideoConference,
    "CustomerShop": CustomerShop,
    "Shop": Shop,
    "Orders": Orders,
    "PublicShop": PublicShop,
    "ShopCustomization": ShopCustomization,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};