import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function isNew(createdAt) {
  if (!createdAt) return false;
  const now = new Date();
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const diff = (now - created) / (1000 * 60 * 60 * 24);
  return diff < 7;
}

const Card = ({ item }) => {
  return (
    <div className="relative bg-white rounded-2xl border border-rose-100 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col group" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'}}>
      <div className="relative">
        <img
          src={item.images?.[0] || "/placeholder-image.jpg"}
          alt={item.title}
          className="w-full h-56 object-cover bg-zinc-100"
        />
        {isNew(item.createdAt) && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">New</span>
        )}
        {item.avatar && (
          <img
            src={item.avatar}
            alt="Uploader avatar"
            className="absolute top-3 right-3 w-9 h-9 rounded-full border-2 border-white shadow"
          />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-zinc-800 truncate group-hover:text-rose-600 transition-colors" title={item.title}>{item.title}</h3>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">{item.points} pts</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
          {item.size && <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600">{item.size}</span>}
          <span className="text-xs bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full font-medium">{item.condition}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          {item.avatar && (
            <img src={item.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
          )}
          <span>{item.uploaderName || item.owner || "User"}</span>
        </div>
        <Link
          to={`/item/${item.id}`}
          className="mt-auto block w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-2 rounded-full font-semibold text-center hover:shadow-lg transition-all duration-300"
        >
          View Details <ArrowRight className="inline h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default Card; 