import AdvertGenerator from './pages/AdvertGenerator';
import Announcements from './pages/Announcements';
import Customers from './pages/Customers';
import DamagedInventory from './pages/DamagedInventory';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Expenditures from './pages/Expenditures';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import InventorySections from './pages/InventorySections';
import ProductSalesReport from './pages/ProductSalesReport';
import Sales from './pages/Sales';
import SalesBySections from './pages/SalesBySections';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import VideoConference from './pages/VideoConference';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdvertGenerator": AdvertGenerator,
    "Announcements": Announcements,
    "Customers": Customers,
    "DamagedInventory": DamagedInventory,
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Expenditures": Expenditures,
    "Home": Home,
    "Inventory": Inventory,
    "InventorySections": InventorySections,
    "ProductSalesReport": ProductSalesReport,
    "Sales": Sales,
    "SalesBySections": SalesBySections,
    "Suppliers": Suppliers,
    "Transactions": Transactions,
    "Users": Users,
    "VideoConference": VideoConference,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};