import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useCoinData } from "../context/CoinDataContext"; 

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { allCoins } = useCoinData(); 

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef();
  const lastQueryRef = useRef("");
  const debounceRef = useRef(null);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleWatchlistClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast.error("Please login to access the Watchlist");
    }
  };


  const handlePortfolioClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast.error("Please login to access the Portfolio");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
    lastQueryRef.current = "";
  };

  
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchTerm || !searchTerm.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setLoadingSearch(false);
      lastQueryRef.current = "";
      return;
    }

    setLoadingSearch(true);
    const query = searchTerm.trim();
    lastQueryRef.current = query;

    debounceRef.current = setTimeout(async () => {
      try {
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
        if (!searchRes.ok) throw new Error("Search failed");
        const searchData = await searchRes.json();
        if (lastQueryRef.current !== query) return;

        const coinsFound = Array.isArray(searchData.coins) ? searchData.coins.slice(0, 5) : [];
        if (coinsFound.length === 0) {
          setSearchResults([]);
          setShowDropdown(true);
          setLoadingSearch(false);
          return;
        }

        const allCoinsMap = new Map(allCoins.map(coin => [coin.id, coin]));

        const merged = coinsFound.map((coin) => {
          const marketData = allCoinsMap.get(coin.id);
          return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.thumb || coin.small || coin.large || "",
            current_price: marketData?.current_price ?? null,
            price_change_percentage_24h: marketData?.price_change_percentage_24h ?? null,
          };
        });

        setSearchResults(merged);
        setShowDropdown(true);
        setLoadingSearch(false);
      } catch (err) {
        console.error("Search error:", err);
        if (lastQueryRef.current === query) {
          setSearchResults([]);
          setShowDropdown(true);
          setLoadingSearch(false);
        }
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, allCoins]); 

  return (
    <nav className="bg-black text-white px-8 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1
          onClick={() => navigate("/")}
          className="cursor-pointer text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
        >
          CryptoTracker
        </h1>

        <div className="hidden md:flex space-x-4 ml-8">
          <Link to="/dashboard" className="hover:text-blue-400">
            Cryptocurrencies
          </Link>
          <Link to="/portfolio" className="hover:text-blue-400" onClick={handlePortfolioClick}>
            Portfolio
          </Link>
          <Link
            to="/watchlist"
            className="hover:text-blue-400"
            onClick={handleWatchlistClick}
          >
            Watchlist
          </Link>
        </div>
      </div>

      <div ref={searchRef} className="hidden md:flex flex-grow max-w-lg ml-6 relative">
        <span className="absolute left-4 top-2.5 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
        </span>

        <input
          type="text"
          placeholder="Search crypto..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          className="w-full h-10 pl-12 pr-10 rounded-full border border-gray-700 bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
          >
            ✖
          </button>
        )}

        {showDropdown && (
          <div className="absolute top-12 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
            {loadingSearch ? (
              <div className="px-4 py-2 text-gray-400 text-sm">Loading...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((coin) => (
                <Link
                  key={coin.id}
                  to={`/coin/${coin.id}`}
                  className="flex justify-between items-center px-4 py-2 hover:bg-gray-800 transition border-b border-gray-700 last:border-b-0"
                  onClick={() => {
                    setShowDropdown(false);
                    setSearchTerm("");
                    setSearchResults([]);
                    lastQueryRef.current = "";
                  }}
                >
                  <div className="flex items-center">
                    <img
                      src={coin.thumb}
                      alt={coin.name}
                      className="w-5 h-5 mr-3"
                    />
                    <div>
                      <div className="text-white">{coin.name}</div>
                      <div className="text-gray-400 text-xs uppercase">{coin.symbol}</div>
                    </div>
                  </div>

                  <div className="text-sm">
                    {coin.current_price !== null ? (
                      <span className="text-gray-300">${coin.current_price.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-2 text-gray-400 text-sm">No results found</p>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <Link to="/" className="hover:text-blue-400">
          Home
        </Link>

        {!isLoggedIn ? (
          <>
            <Link to="/login" className="hover:text-blue-400">
              Login
            </Link>
            <Link to="/register" className="hover:text-blue-400">
              Sign in
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="group relative bg-gray-800 border border-gray-600 p-2 rounded-full hover:bg-red-600 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
            <span className="absolute top-10 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
              Logout
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}