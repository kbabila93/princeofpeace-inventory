import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Sales from './pages/Sales';
import Expenditures from './pages/Expenditures';
import Employees from './pages/Employees';
import Users from './pages/Users';
import VideoConference from './pages/VideoConference';
import AdvertGenerator from './pages/AdvertGenerator';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Announcements from './pages/Announcements';
import CallCenter from './pages/CallCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Inventory": Inventory,
    "Transactions": Transactions,
    "Sales": Sales,
    "Expenditures": Expenditures,
    "Employees": Employees,
    "Users": Users,
    "VideoConference": VideoConference,
    "AdvertGenerator": AdvertGenerator,
    "Customers": Customers,
    "Suppliers": Suppliers,
    "Announcements": Announcements,
    "CallCenter": CallCenter,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};