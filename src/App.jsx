import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import ItemDetailPage from "./pages/ItemDetailPage";
import AddItemPage from "./pages/AddItemPage";
import BrowseItemsPage from "./pages/BrowseItemsPage";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoutes from "./components/ProtectedRoutes";

function AppContent() {
  const location = useLocation();
  const hideNavbar = ["/login", "/signup"].includes(location.pathname);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!hideNavbar && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/browse" element={<BrowseItemsPage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          } />
          <Route path="/add-item" element={
            <ProtectedRoutes>
              <AddItemPage />
            </ProtectedRoutes>
          } />
          <Route path="/admin" element={
            <ProtectedRoutes requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoutes>
          } />
        </Routes>
      </main>
    </div>
  );
}

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;