import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import ProductCard from "../components/ProductCard";
import { Search, Filter, Grid, List, RefreshCw, ArrowLeft } from "lucide-react";

const CategoryPage = () => {
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  const categories = [
    "Jackets", "Dresses", "Shoes", "Accessories", "Shirts", "Pants"
  ];

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsQuery = query(
          collection(db, "items"),
          where("status", "==", "approved"),
          where("available", "==", true),
          where("category", "==", category),
          orderBy("createdAt", "desc")
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemsData = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(itemsData);
        setFilteredItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [category]);

  useEffect(() => {
    let filtered = items;
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered = [...filtered].sort((a, b) => 
          (b.createdAt?.toDate?.() || new Date(b.createdAt)) - 
          (a.createdAt?.toDate?.() || new Date(a.createdAt))
        );
        break;
      case "oldest":
        filtered = [...filtered].sort((a, b) => 
          (a.createdAt?.toDate?.() || new Date(a.createdAt)) - 
          (b.createdAt?.toDate?.() || new Date(b.createdAt))
        );
        break;
      case "points-high":
        filtered = [...filtered].sort((a, b) => (b.points || 0) - (a.points || 0));
        break;
      case "points-low":
        filtered = [...filtered].sort((a, b) => (a.points || 0) - (b.points || 0));
        break;
      case "alphabetical":
        filtered = [...filtered].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      default:
        break;
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, sortBy]);

  const getCategoryIcon = (cat) => {
    const icons = {
      "Jackets": "🧥",
      "Dresses": "👗",
      "Shoes": "👟",
      "Accessories": "👜",
      "Shirts": "👕",
      "Pants": "👖"
    };
    return icons[cat] || "👕";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
          <span className="text-gray-600">Loading {category} items...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/browse"
              className="flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Browse
            </Link>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">{getCategoryIcon(category)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category}</h1>
              <p className="text-gray-600">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search in this category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="points-high">Points: High to Low</option>
                  <option value="points-low">Points: Low to High</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/category/${cat}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  cat === category
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                <span className="text-lg">{getCategoryIcon(cat)}</span>
                <span className="font-medium">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{getCategoryIcon(category)}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {category} items found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? `No items match "${searchTerm}" in ${category}` : `No ${category} items are currently available`}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
              : "grid-cols-1"
          }`}>
            {filteredItems.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage; 