import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, Heart, Sparkles, ShoppingBag, RefreshCw } from "lucide-react";
import { useAuth } from "../context/UseAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import ProductCard from "../components/ProductCard";
import Logo from "/logo.png"
const categories = [
  { name: "Tops", emoji: "👕" },
  { name: "Bottoms", emoji: "👖" },
  { name: "Dresses", emoji: "👗" },
  { name: "Outerwear", emoji: "🧥" },
  { name: "Shoes", emoji: "👟" },
  { name: "Accessories", emoji: "🧢" },
  { name: "Bags", emoji: "🛍️" },
  { name: "Jewelry", emoji: "💍" },
  { name: "Athletic wear", emoji: "🏃" },
  { name: "Formal wear", emoji: "👨‍💼" },
];

const stats = [
  { icon: Users, value: "10K+", label: "Active Users", color: "text-blue-600" },
  { icon: ShoppingBag, value: "50K+", label: "Items Swapped", color: "text-green-600" },
  { icon: Heart, value: "95%", label: "Satisfaction Rate", color: "text-green-600" },
  { icon: TrendingUp, value: "2.5K", label: "Monthly Swaps", color: "text-green-600" },
];

function getRandomItems(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

const LandingPage = () => {
  const { userLoggedIn, currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsQuery = query(
          collection(db, "items"),
          where("status", "==", "approved"),
          where("available", "==", true)
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemsData = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);



  const randomItems = getRandomItems(items, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-lg">
              <Sparkles className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Join the fashion revolution</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 leading-tight">
              <img src={Logo} alt="ReWear Logo" className="h-16 md:h-24 inline-block mr-2" />
              {userLoggedIn
                ? (<>
                    <span className="block">Welcome Back <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0] || ''}</span></span>
                    <span className="block text-3xl md:text-4xl font-bold text-green-700 mt-2">What are you looking for today?</span>
                  </>)
                : (<>
                    Start your journey with <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">GreatWear</span>
                  </>)}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
              Curate Your Wardrobe. Cultivate Your Circle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!userLoggedIn ? (
                <Link 
                  to="/login" 
                  className="group bg-gradient-to-r from-green-500 to-emerald-400 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg"
                >
                  Start Swapping 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/browse" 
                    className="group bg-white text-green-600 border-2 border-green-200 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg hover:bg-green-50"
                  >
                    Browse Items 
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/add-item" 
                    className="group bg-green-100 text-green-700 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg hover:bg-green-200"
                  >
                    List an Item 
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="group bg-yellow-100 text-green-700 px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-yellow-200 transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Categories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find exactly what you're looking for across our diverse collection of fashion categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {categories.map((cat, index) => (
              <Link
                key={cat.name}
                to={`/browse?category=${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group relative bg-green-50 rounded-2xl shadow-md py-8 px-4 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:bg-green-100 hover:ring-2 hover:ring-green-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-5xl mb-3 drop-shadow-sm transition-transform group-hover:scale-110">{cat.emoji}</span>
                  <span className="font-semibold text-green-900 text-base tracking-tight mt-1 text-center group-hover:text-green-700 transition-colors">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Items</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing pre-loved fashion pieces from our community
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
                <span className="text-gray-600">Loading amazing items...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {randomItems.map((item,) => (
                <div
                  key={item.id}                >
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/browse"
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-400 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              View All Items
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!userLoggedIn ? (
        <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-400">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Fashion Journey?
            </h2>
            
            <Link
              to="/signup"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center"
            >
              Join GreatWear Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default LandingPage;