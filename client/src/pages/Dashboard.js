import { useEffect, useState } from "react";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCoinData } from "../context/CoinDataContext";
import AddInvestmentModal from "../components/AddToPortfolioModal"; 
import { API_BASE_URL } from "../api";


export default function Dashboard() {
  const { allCoins, loading } = useCoinData();

  const [watchlist, setWatchlist] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [coinsPerPage, setCoinsPerPage] = useState(20);
  const [showModal, setShowModal] = useState(false); 
  const [selectedCoin, setSelectedCoin] = useState(null); 


  const fetchUserWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setWatchlist(data.watchlist);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  };
  useEffect(() => { fetchUserWatchlist(); }, []);

  const handleWatchlist = async (coinId, coinName) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to use the watchlist!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/user/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ coinId }),
      });

      const data = await res.json();
      if (res.ok) {
        setWatchlist(data.watchlist);
        toast.success(data.message || "Watchlist updated");
      } else {
        toast.error(data.message || "Failed to update watchlist");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleAddToPortfolio = (coin) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add coins to your portfolio!");
      return;
    }
    setSelectedCoin(coin); 
    setShowModal(true); 
  };



  const indexOfLastCoin = currentPage * coinsPerPage;
  const indexOfFirstCoin = indexOfLastCoin - coinsPerPage;
  const currentCoins = allCoins.slice(indexOfFirstCoin, indexOfLastCoin);
  const totalPages = Math.ceil(allCoins.length / coinsPerPage);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="p-8">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cryptocurrency Prices by Market Cap</h2>
          <table className="table-auto w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-800">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Coin</th>
                <th className="px-4 py-2">Price (USD)</th>
                <th className="px-4 py-2">24h Change</th>
                <th className="px-4 py-2">Market Cap</th>
                <th className="px-4 py-2 text-center">Watchlist</th>
                <th className="px-4 py-2 text-center">Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
              ) : (
                currentCoins.map((coin, index) => { 
                  const saved = watchlist.includes(coin.id);
                  return (
                    <tr key={coin.id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                      <td className="px-4 py-2">{(currentPage - 1) * coinsPerPage + index + 1}</td>
                      <td className="px-4 py-2 flex items-center space-x-2">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                        <Link to={`/coin/${coin.id}`} className="hover:underline text-white">{coin.name}</Link>
                        <span className="text-gray-400 uppercase text-sm">{coin.symbol}</span>
                      </td>
                      <td className="px-4 py-2">${coin.current_price.toLocaleString()}</td>
                      <td className={`px-4 py-2 ${coin.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {coin.price_change_percentage_24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2">${coin.market_cap.toLocaleString()}</td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => handleWatchlist(coin.id, coin.name)} 
                          className={`text-lg ${saved ? "text-yellow-400" : "text-gray-400"} hover:text-yellow-400`} 
                          title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          ★
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleAddToPortfolio(coin)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
          <div className="text-gray-400 text-sm">
            Showing {indexOfFirstCoin + 1} - {Math.min(indexOfLastCoin, allCoins.length)} out of {allCoins.length}
          </div>
          <div className="flex-1 flex justify-center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, value) => {
                setCurrentPage(value);
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#9ca3af",
                  "&:hover": {
                    backgroundColor: "#374151",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
                  },
                },
                "& .Mui-selected": {
                  backgroundColor: "#2563eb !important",
                  color: "#fff !important",
                },
              }}
              shape="rounded"
            />
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-sm">Rows per page:</span>
            <Select
              value={coinsPerPage}
              onChange={(e) => {
                setCoinsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              size="small"
              sx={{
                backgroundColor: "#1f2937",
                color: "#fff",
                "& .MuiSelect-icon": { color: "#9ca3af" },
                "&:hover": { backgroundColor: "#374151" },
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </div>
        </div>
      </div>
            {showModal && (
              <AddInvestmentModal
                coin={selectedCoin}
                onClose={() => setShowModal(false)}
              />
            )}
    </div>
  );
}
