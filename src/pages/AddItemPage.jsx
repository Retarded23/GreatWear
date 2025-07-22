import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/UseAuth";
import { Upload, X, Plus, ArrowLeft, Camera, Tag, Award, Package, Info } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import toast from "react-hot-toast";

const AddItemPage = () => {
  const { currentUser, updateUserPoints } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    size: "",
    condition: "",
    tags: "",
    points: ""
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const categories = [
    "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", 
    "Accessories", "Bags", "Jewelry", "Athletic wear", "Formal wear"
  ];

  const conditions = [
    "Like New", "Excellent", "Good", "Fair"
  ];

  const sizes = [
    // Indian clothing sizes
    "XS (28)", "S (30)", "M (32)", "L (34)", "XL (36)", "XXL (38)", "XXXL (40)", "XXXXL (42)",
    // Indian shoe sizes
    "Shoe 3", "Shoe 4", "Shoe 5", "Shoe 6", "Shoe 7", "Shoe 8", "Shoe 9", "Shoe 10", "Shoe 11", "Shoe 12",
    // Indian traditional sizes
    "Free Size", "One Size", "Adjustable"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Only allow 1 image
    if (files.length > 1) {
      toast.error("Only 1 image allowed");
      return;
    }

    if (selectedImages.length > 0) {
      toast.error("Only 1 image allowed. Remove the existing image first.");
      return;
    }

    setSelectedImages(files);

    // Create preview for single image
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews([e.target.result]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedImages.length === 0) {
      toast.error("Please add an image");
      return;
    }

    setLoading(true);

    try {
      // Upload single image to Cloudinary
      const imageUrl = await uploadToCloudinary(selectedImages[0]);

      // Create item document
      const itemData = {
        ...formData,
        points: parseInt(formData.points),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        images: [imageUrl], // Single image in array
        uploaderId: currentUser.uid,
        uploaderName: currentUser.name,
        uploaderEmail: currentUser.email,
        status: "pending", // Requires admin approval
        available: false, // Will be set to true after admin approval
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "items"), itemData);
      
      // Give user 5 points for listing an item
      await updateUserPoints(5, `Listed item: ${itemData.title}`);
      
      toast.success("Item submitted for review! It will be available after admin approval.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is banned
  if (currentUser?.banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Banned</h2>
          <p className="text-gray-600 mb-4">Your account has been banned. You cannot add items.</p>
          <p className="text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 rounded-full hover:bg-rose-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-rose-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">List Your Item</h1>
                <p className="text-zinc-600">Share your sustainable fashion with the community</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-zinc-500">
              <Package className="h-4 w-4 text-orange-500" />
              <span>Complete the form to list your item</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-3">
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
             <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-zinc-800">Item Photo</h2>
                    <span className="text-red-500">*</span>
                  </div>

                  <div className="space-y-4">
                    {imagePreviews.length > 0 ? (
                      <div className="relative w-full max-w-md">
                        <img
                          src={imagePreviews[0]}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-xl border-2 border-rose-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(0)}
                          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full max-w-md">
                        <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:border-rose-400 hover:bg-rose-50 cursor-pointer transition-all duration-200 group">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="bg-orange-100 rounded-full p-4 group-hover:bg-orange-200 transition-colors">
                              <Upload className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-zinc-900">Upload Item Photo</p>
                              <p className="text-sm text-zinc-500 mt-1">Click to browse or drag and drop</p>
                              <p className="text-xs text-zinc-400 mt-2">PNG, JPG up to 10MB</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-zinc-800">Basic Information</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Item Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                        placeholder="e.g., Vintage Denim Jacket"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                        placeholder="Describe the item, its style, fit, and any special features..."
                      />
                    </div>

                    {/* Category and Type */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="category"
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <input
                          type="text"
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                          placeholder="e.g., T-shirt, Jeans, Sneakers"
                        />
                      </div>
                    </div>

                    {/* Size, Condition, and Points */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                          Size <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="size"
                          name="size"
                          required
                          value={formData.size}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                        >
                          <option value="">Select size</option>
                          {sizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="condition"
                          name="condition"
                          required
                          value={formData.condition}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                        >
                          <option value="">Select condition</option>
                          {conditions.map(condition => (
                            <option key={condition} value={condition}>{condition}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                            Points Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="points"
                            name="points"
                            required
                            min="10"
                            max="200"
                            value={formData.points}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                            placeholder="e.g., 50"
                          />
                        </div>
                      </div>
                          
                      {/* Tags */}
                    <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-zinc-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4" />
                        <span>Tags</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
                      placeholder="vintage, casual, summer (separated by commas)"
                    />
                    <p className="mt-2 text-sm text-zinc-500">
                      Add tags separated by commas to help others find your item
                    </p>
                  </div>
                </div>
              </div>
                          
                  {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-rose-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-3 rounded-full hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center font-semibold text-lg transition-all transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      List Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Tips Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-zinc-800">Listing Tips</h3>
                </div>
                <div className="space-y-3 text-sm text-zinc-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Use clear, well-lit photos showing the item from multiple angles</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Be honest about the condition and any flaws</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Include relevant tags to help others find your item</p>
                  </div>
                </div>
              </div>

              {/* Points Info */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-zinc-800">Points System</h3>
                </div>
                <div className="space-y-3 text-sm text-orange-900/80">
                  <p><strong>10-50 pts:</strong> Basic items, fair condition</p>
                  <p><strong>51-100 pts:</strong> Good quality, popular brands</p>
                  <p><strong>101-200 pts:</strong> Premium items, excellent condition</p>
                </div>
                <div className="mt-4 p-3 bg-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">
                    You'll earn 5 points just for listing this item!
                  </p>
                </div>
              </div>

              {/* Process Info */}
              <div className="bg-lime-50 rounded-2xl border border-lime-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-800 mb-3">What happens next?</h3>
                <div className="space-y-3 text-sm text-lime-900/80">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-lime-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <p>Your item will be reviewed by our team</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-lime-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <p>Once approved, it becomes available for swapping</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-lime-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <p>You'll receive notifications about swap requests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemPage;