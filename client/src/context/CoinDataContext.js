import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

const CoinDataContext = createContext();

export function CoinDataProvider({ children }) {
  const [allCoins, setAllCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const infoCache = useRef({});
  const chartCache = useRef({});

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false");
        const data = await res.json();
        setAllCoins(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getCoinInfo = useCallback(async (coinId) => {
    if (infoCache.current[coinId]) {
      return infoCache.current[coinId];
    }
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
      const data = await res.json();
      infoCache.current[coinId] = data;
      return data;
    } catch (err) {
      console.error("Error fetching coin info:", err);
    }
  }, []);
  
  const getChartData = useCallback(async (coinId, days) => {
    const cacheKey = `${coinId}-${days}`;
    if (chartCache.current[cacheKey]) {
      return chartCache.current[cacheKey];
    }
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await res.json();
      chartCache.current[cacheKey] = data;
      return data;
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }, []);

  return (
    <CoinDataContext.Provider value={{ allCoins, loading, getCoinInfo, getChartData }}>
      {children}
    </CoinDataContext.Provider>
  );
}

export function useCoinData() {
  return useContext(CoinDataContext);
}