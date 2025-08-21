import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCoinData } from "../context/CoinDataContext";
import AddInvestmentModal from "../components/AddToPortfolioModal"; 

export default function Home() {
  const { allCoins, loading } = useCoinData();
  const coins = allCoins.slice(0, 10);

  const [watchlist, setWatchlist] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [showModal, setShowModal] = useState(false); 
  const [selectedCoin, setSelectedCoin] = useState(null); 

  const fetchUserWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/user/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setWatchlist(data.watchlist);
    } catch (err) {
      console.error("Failed to fetch watchlist", err);
    }
  };

  useEffect(() => {
    fetchUserWatchlist();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [allCoins, loading]);

  const handleWatchlist = async (coinId, coinName) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to use the watchlist!");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/user/watchlist", {
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
        toast.success(
          data.watchlist.includes(coinId)
            ? `${coinName} added to watchlist`
            : `${coinName} removed from watchlist`
        );
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
      toast.error("Please login to add cryptos to your portfolio!");
      return;
    }
    setSelectedCoin(coin); 
    setShowModal(true); 
  };




  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="flex flex-col items-center justify-center pt-10 px-6">
        <h1 className="text-5xl font-bold text-center">
          Track All Your Cryptos <br /> From One Place
        </h1>
        <p className="mt-6 text-gray-400 text-lg text-center max-w-2xl">
          Connect your portfolio to track, buy, and manage your crypto assets
          easily.
        </p>
      </div>

      <div className="p-8">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Today's Top 10 Cryptocurrencies</h2>
            {lastUpdated && (
              <span className="text-gray-400 text-sm">
                Last updated:- {lastUpdated}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800">
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
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  coins.map((coin, index) => {
                    const saved = watchlist.includes(coin.id);
                    return (
                      <tr
                        key={coin.id}
                        className="border-b border-gray-700 hover:bg-gray-800 transition"
                      >
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2 flex items-center space-x-2">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-6 h-6"
                          />
                          <Link
                            to={`/coin/${coin.id}`}
                            className="hover:underline text-white"
                          >
                            {coin.name}
                          </Link>
                          <span className="text-gray-400 uppercase text-sm">
                            {coin.symbol}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          ${coin.current_price.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2 ${
                            coin.price_change_percentage_24h >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </td>
                        <td className="px-4 py-2">
                          ${coin.market_cap.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleWatchlist(coin.id, coin.name)}
                            className={`text-lg ${
                              saved ? "text-yellow-400" : "text-gray-400"
                            } hover:text-yellow-400`}
                            title={
                              saved
                                ? "Remove from Watchlist"
                                : "Add to Watchlist"
                            }
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

