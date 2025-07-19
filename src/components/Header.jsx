import React,{useState} from 'react'
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UseAuth";
import { LogOut, User, Plus, Home, Grid, Settings, Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../../public/image.png";

function Header() {
    const { currentUser, userLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
          await logout();
          toast.success("Logged out successfully");
          navigate("/");
          setIsMobileMenuOpen(false);
        } catch {
          toast.error("Failed to logout");
        }
    };    

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };
    return (
    <nav className="bg-green-50 border-b border-green-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight text-green-600 hover:text-green-700 transition" onClick={closeMobileMenu}>
            <img src={logo} alt="logo" className="h-6 w-6 md:h-7 md:w-7" />
            <span>ReWear</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-gray-700 hover:text-green-600 transition-colors">
              Browse Items
            </Link>
            
            {userLoggedIn ? (
              <>
                <Link to="/add-item" className="flex items-center text-gray-700 hover:text-green-600 transition-colors">                  Add Item
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
                  Dashboard
                </Link>
                {currentUser?.isAdmin && (
                  <Link to="/admin" className="flex items-center text-gray-700 hover:text-green-600 transition-colors">
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
              </>
            ) : null}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {userLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-green-700 border border-green-300 rounded-full px-4 py-2 bg-green-100">
                  <span className="font-bold">{currentUser?.points || 0}</span> pts
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                    {currentUser?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-red-600 transition-colors p-1"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-base text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-base"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {userLoggedIn && (
              <div className="text-xs text-green-700 mr-2 border border-green-300 rounded-full px-3 py-1.5 bg-green-100">
                <span className="font-bold">{currentUser?.points || 0}</span> pts
              </div>
            )}
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-green-600 transition-colors p-1"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-200 bg-green-50 absolute top-16 left-0 right-0 z-50">
            <div className="px-4 py-3 space-y-2">
              {/* User Info */}
              {userLoggedIn && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Welcome back!
                  </span>
                </div>
              )}

              {/* Navigation Links */}
              <Link
                to="/"
                className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-3" />
                  Home
                </div>
              </Link>
              
              <Link
                to="/browse"
                className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center">
                  <Grid className="h-5 w-5 mr-3" />
                  Browse Items
                </div>
              </Link>
              
              {userLoggedIn ? (
                <>
                  <Link
                    to="/add-item"
                    className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center">
                      <Plus className="h-5 w-5 mr-3" />
                      Add Item
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3" />
                      Dashboard
                    </div>
                  </Link>
                  {currentUser?.isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 mr-3" />
                        Admin
                      </div>
                    </Link>
                  )}
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </div>
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link
                    to="/login"
                    className="block px-3 py-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header