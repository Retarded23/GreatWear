import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, Heart, Sparkles, ShoppingBag, RefreshCw } from "lucide-react";
import { useAuth } from "../context/UseAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import Card from "../components/Card";
import Logo from "../../public/image.png";

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
  { icon: Users, value: "10K+", label: "Active Users" },
  { icon: ShoppingBag, value: "50K+", label: "Items Swapped" },
  { icon: Heart, value: "95%", label: "Satisfaction Rate" },
  { icon: TrendingUp, value: "2.5K+", label: "Monthly Swaps" },
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
    <div className="min-h-screen bg-orange-50 text-zinc-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-rose-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-sm">
              <Sparkles className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-600">Join the fashion revolution</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 mb-4 leading-tight">
              <img src={Logo} alt="ReWear Logo" className="h-16 md:h-24 inline-block mr-2" />
              {userLoggedIn
                ? (<>
                    <span className="block">Welcome Back, <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0] || ''}</span></span>
                    <span className="block text-3xl md:text-4xl font-bold text-rose-800 mt-2">What are you looking for today?</span>
                  </>)
                : (<>
                    Start your journey with <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">GreatWear</span>
                  </>)}
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Curate Your Wardrobe. Cultivate Your Circle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!userLoggedIn ? (
                <Link 
                  to="/login" 
                  className="group bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg"
                >
                  Start Swapping 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/browse" 
                    className="group bg-rose-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg hover:bg-rose-600"
                  >
                    Browse Items 
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/add-item" 
                    className="group bg-lime-100 text-lime-800 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center text-lg hover:bg-lime-200"
                  >
                    List an Item 
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <stat.icon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-zinc-900 mb-2">{stat.value}</div>
                <div className="text-zinc-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Explore Categories</h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Find exactly what you're looking for across our diverse collection of fashion categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/browse?category=${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group relative bg-white rounded-2xl shadow-sm py-8 px-4 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:bg-rose-50 hover:ring-2 hover:ring-rose-200"
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-5xl mb-3 drop-shadow-sm transition-transform group-hover:scale-110">{cat.emoji}</span>
                  <span className="font-semibold text-zinc-800 text-base tracking-tight mt-1 text-center group-hover:text-rose-800 transition-colors">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Featured Items</h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Discover amazing pre-loved fashion pieces from our community
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                <span className="text-zinc-600">Loading amazing items...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {randomItems.map((item) => (
                <div key={item.id}>
                  <Card item={item} />
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/browse"
              className="inline-flex items-center bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              View All Items
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!userLoggedIn ? (
        <section className="py-20 bg-gradient-to-r from-orange-500 to-rose-500">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Fashion Journey?
            </h2>
            
            <Link
              to="/signup"
              className="bg-white text-rose-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-flex items-center"
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
