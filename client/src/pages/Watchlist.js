import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCoinData } from "../context/CoinDataContext"; 
import AddInvestmentModal from "../components/AddToPortfolioModal"; 

export default function Watchlist() {
  const { allCoins, loading } = useCoinData();

  const [coins, setCoins] = useState([]);
  const [, setWatchlist] = useState([]); 
  const [showModal, setShowModal] = useState(false); 
  const [selectedCoin, setSelectedCoin] = useState(null); 

  useEffect(() => {
    const fetchAndFilterWatchlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to view watchlist");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/user/watchlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message);
          return;
        }

        const watchlistIds = data.watchlist;
        setWatchlist(watchlistIds);

        if (watchlistIds.length > 0 && allCoins.length > 0) {
          const filteredCoins = allCoins.filter(coin => watchlistIds.includes(coin.id));
          setCoins(filteredCoins);
        } else {
          setCoins([]);
        }
      } catch (err) {
        toast.error("Unable to load watchlist");
      }
    };

    if (!loading) {
      fetchAndFilterWatchlist();
    }
  }, [loading, allCoins]); 

  const handleWatchlist = async (coinId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
        body: JSON.stringify({ coinId }),
      });

      const data = await res.json();
      if (res.ok) {
        setWatchlist(data.watchlist);
        toast.success("Removed from Watchlist");

        if (data.watchlist.length > 0) {
          const filteredCoins = allCoins.filter(c => data.watchlist.includes(c.id));
          setCoins(filteredCoins);
        } else {
          setCoins([]);
        }
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
      toast.error("Please login to add cryptos to portfolio!");
      return;
    }
    setSelectedCoin(coin); 
    setShowModal(true); 
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white p-8">
      <h2 className="text-3xl font-semibold mb-6">My Watchlist</h2>
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Coin</th>
                <th className="px-4 py-2">Price (USD)</th>
                <th className="px-4 py-2">24h Change</th>
                <th className="px-4 py-2">Market Cap</th>
                <th className="px-4 py-2 text-center">Remove</th>
                <th className="px-4 py-2 text-center">Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {loading && coins.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-gray-400 py-6">Loading Watchlist...</td></tr>
              ) : coins.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-gray-400 py-6">Your watchlist is empty.</td></tr>
              ) : (
                coins.map((coin, index) => (
                  <tr key={coin.id} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="px-4 py-2">{index + 1}</td>
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
                        onClick={() => handleWatchlist(coin.id)} 
                        className="text-lg text-yellow-400 hover:text-red-500" 
                        title="Remove from Watchlist"
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
                ))
              )}
            </tbody>
          </table>
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
