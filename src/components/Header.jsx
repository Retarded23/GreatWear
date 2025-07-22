import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UseAuth";
import { LogOut, User, Plus, Home, Grid, Settings, Menu, X, Award } from "lucide-react";
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

  const linkClass = "text-zinc-600 hover:text-rose-600 transition-colors font-medium";
  const activeLinkClass = "text-rose-600 font-semibold";

  return (
    <nav className="bg-gradient-to-br from-orange-50 to-rose-50/70 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight text-rose-600 hover:text-rose-700 transition" onClick={closeMobileMenu}>
            <img src={logo} alt="logo" className="h-8 w-8" />
            <span>GreatWear</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
              Home
            </NavLink>
            <NavLink to="/browse" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
              Browse Items
            </NavLink>
            
            {userLoggedIn && (
              <>
                <NavLink to="/add-item" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
                  List Item
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
                  Dashboard
                </NavLink>
                {currentUser?.isAdmin && (
                  <NavLink to="/admin" className={({ isActive }) => `${isActive ? activeLinkClass : linkClass} flex items-center`}>
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {userLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-orange-800 border border-orange-200 rounded-full px-4 py-2 bg-orange-50 font-semibold">
                  <span>{currentUser?.points || 0}</span> pts
                </div>
                <div className="flex items-center space-x-2">
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" />
                  <span className="text-sm font-medium text-zinc-700 truncate max-w-32">
                    {currentUser?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-base text-zinc-700 hover:text-rose-600 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all text-base font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-zinc-700 hover:text-rose-600 transition-colors"
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
          <div className="md:hidden border-t border-rose-100 bg-white absolute top-full left-0 right-0 z-50 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              {/* User Info */}
              {userLoggedIn && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover"/>
                    <span className="text-sm font-medium text-zinc-700">
                      Welcome, {currentUser.name}!
                    </span>
                  </div>
                   <div className="text-sm text-orange-800 border border-orange-200 rounded-full px-3 py-1 bg-orange-100 font-semibold">
                      {currentUser?.points || 0} pts
                    </div>
                </div>
              )}

              {/* Navigation Links */}
              <NavLink to="/" onClick={closeMobileMenu} className={({isActive}) => `block px-3 py-3 rounded-md transition-colors ${isActive ? 'bg-rose-50 text-rose-600' : 'text-zinc-700 hover:bg-rose-50'}`}>
                <div className="flex items-center"><Home className="h-5 w-5 mr-3" />Home</div>
              </NavLink>
              
              <NavLink to="/browse" onClick={closeMobileMenu} className={({isActive}) => `block px-3 py-3 rounded-md transition-colors ${isActive ? 'bg-rose-50 text-rose-600' : 'text-zinc-700 hover:bg-rose-50'}`}>
                <div className="flex items-center"><Grid className="h-5 w-5 mr-3" />Browse Items</div>
              </NavLink>
              
              {userLoggedIn ? (
                <>
                  <NavLink to="/add-item" onClick={closeMobileMenu} className={({isActive}) => `block px-3 py-3 rounded-md transition-colors ${isActive ? 'bg-rose-50 text-rose-600' : 'text-zinc-700 hover:bg-rose-50'}`}>
                    <div className="flex items-center"><Plus className="h-5 w-5 mr-3" />Add Item</div>
                  </NavLink>
                  <NavLink to="/dashboard" onClick={closeMobileMenu} className={({isActive}) => `block px-3 py-3 rounded-md transition-colors ${isActive ? 'bg-rose-50 text-rose-600' : 'text-zinc-700 hover:bg-rose-50'}`}>
                    <div className="flex items-center"><User className="h-5 w-5 mr-3" />Dashboard</div>
                  </NavLink>
                  {currentUser?.isAdmin && (
                    <NavLink to="/admin" onClick={closeMobileMenu} className={({isActive}) => `block px-3 py-3 rounded-md transition-colors ${isActive ? 'bg-rose-50 text-rose-600' : 'text-zinc-700 hover:bg-rose-50'}`}>
                      <div className="flex items-center"><Settings className="h-5 w-5 mr-3" />Admin</div>
                    </NavLink>
                  )}
                  
                  <div className="border-t border-rose-100 my-2"></div>
                  
                  {/* Logout Button */}
                  <button onClick={handleLogout} className="w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <div className="flex items-center"><LogOut className="h-5 w-5 mr-3" />Logout</div>
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link to="/login" onClick={closeMobileMenu} className="block w-full text-center px-3 py-3 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors font-semibold">
                    Login
                  </Link>
                  <Link to="/signup" onClick={closeMobileMenu} className="block w-full text-center px-3 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-md hover:shadow-md transition-colors font-semibold">
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

export default Header;
