import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

function getCategoryFromQueryParam(param) {
  if (!param) return "";
  // Convert hyphenated lowercase to normal category
  const map = {
    "tops": "Tops",
    "bottoms": "Bottoms",
    "dresses": "Dresses",
    "outerwear": "Outerwear",
    "shoes": "Shoes",
    "accessories": "Accessories",
    "bags": "Bags",
    "jewelry": "Jewelry",
    "athletic-wear": "Athletic wear",
    "formal-wear": "Formal wear"
  };
  return map[param] || "";
}

const BrowseItemsPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [paginatedItems, setPaginatedItems] = useState([]);

  const categories = [
    "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", 
    "Accessories", "Bags", "Jewelry", "Athletic wear", "Formal wear"
  ];

  const conditions = [
    "Like New", "Excellent", "Good", "Fair"
  ];

  const location = useLocation();

  useEffect(() => {
    // Read category from query params
    const params = new URLSearchParams(location.search);
    const catParam = params.get("category");
    if (catParam) {
      setSelectedCategory(getCategoryFromQueryParam(catParam));
    }
  }, [location.search]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsQuery = query(
          collection(db, "items"),
          where("status", "==", "approved"),
          where("available", "==", true),
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

  useEffect(() => {
    const filterAndSortItems = () => {
      let filtered = [...items];

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Category filter
      if (selectedCategory) {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }

      // Condition filter
      if (selectedCondition) {
        filtered = filtered.filter(item => item.condition === selectedCondition);
      }

      // Sort
      switch (sortBy) {
        case "newest":
          filtered.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
          break;
        case "oldest":
          filtered.sort((a, b) => new Date(a.createdAt?.toDate()) - new Date(b.createdAt?.toDate()));
          break;
        case "pointsLow":
          filtered.sort((a, b) => a.points - b.points);
          break;
        case "pointsHigh":
          filtered.sort((a, b) => b.points - a.points);
          break;
        case "titleAZ":
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          break;
      }

      setFilteredItems(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    };

    filterAndSortItems();
  }, [items, searchTerm, selectedCategory, selectedCondition, sortBy]);

  // Pagination useEffect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(filteredItems.slice(startIndex, endIndex));
  }, [filteredItems, currentPage, itemsPerPage]);

  // Pagination helpers
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredItems.length);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const range = [];
    const showPages = 5; // Number of page buttons to show
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    // Adjust start if we're near the end
    if (end - start < showPages - 1) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedCondition("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Items</h1>
          <p className="text-gray-600">
            Discover amazing pre-loved fashion from our community
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="pointsLow">Points: Low to High</option>
              <option value="pointsHigh">Points: High to Low</option>
              <option value="titleAZ">Title: A to Z</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>

          {/* Results and View Toggle */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {filteredItems.length > 0 ? (
                <>Showing {startItem}-{endItem} of {filteredItems.length} items</>
              ) : (
                <>No items found</>
              )}
            </p>
            <div className="flex space-x-2">
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

        {/* Items Grid/List */}
        {filteredItems.length > 0 ? (
          <>
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {paginatedItems.map((item) => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <img
                  src={item.images?.[0] || "/placeholder-image.jpg"}
                  alt={item.title}
                  className={`object-cover ${
                    viewMode === "list" 
                      ? "w-48 h-32" 
                      : "w-full h-64"
                  }`}
                />
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium ml-2">
                      {item.points} pts
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{item.category}</p>
                  <p className="text-gray-500 text-sm mb-2">Size: {item.size}</p>
                  <p className="text-gray-500 text-sm mb-3">Condition: {item.condition}</p>
                  {viewMode === "list" && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      by {item.uploaderName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            </div>

            {/* Pagination */}
            {filteredItems.length > itemsPerPage && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {getPaginationRange().map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg ${
                          page === currentPage 
                            ? "bg-green-600 text-white" 
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={clearFilters}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseItemsPage;