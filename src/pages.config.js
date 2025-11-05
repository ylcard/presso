import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import MiniBudgets from './pages/MiniBudgets';
import Budgets from './pages/Budgets';
import BudgetDetail from './pages/BudgetDetail';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "Categories": Categories,
    "Reports": Reports,
    "Settings": Settings,
    "MiniBudgets": MiniBudgets,
    "Budgets": Budgets,
    "BudgetDetail": BudgetDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};