import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCoinData } from "../context/CoinDataContext"; 

export default function SearchBar({ watchlist = [] }) {
  const { allCoins } = useCoinData();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
        const data = await res.json();
        
        if (data.coins) {
          
          const homeCoinsIds = allCoins.slice(0, 10).map(c => c.id);
          
          const taggedResults = data.coins.slice(0, 7).map((coin) => ({ 
            ...coin,
            inHome: homeCoinsIds.includes(coin.id),
            inWatchlist: watchlist.includes(coin.id),
          }));
          setResults(taggedResults);
          
        }
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [query, allCoins, watchlist]); 

  const handleSelect = (coinId) => {
    setQuery("");
    setResults([]);
    navigate(`/coin/${coinId}`);
  };

  return (
    <div className="relative w-64">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search coin..."
        className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
      />

      {results.length > 0 && (
        <ul className="absolute mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg max-h-64 overflow-y-auto z-50">
          {results.map((coin) => (
            <li
              key={coin.id}
              onClick={() => handleSelect(coin.id)}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center"
            >
              <span className="flex items-center gap-2">
                <img src={coin.thumb} alt={coin.name} className="w-5 h-5" />
                {coin.name} ({coin.symbol.toUpperCase()})
              </span>
              <span className="text-xs text-gray-400">
                {coin.inHome && "🏠 "}
                {coin.inWatchlist && "⭐ "}
                {!coin.inHome && !coin.inWatchlist && "📊"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}