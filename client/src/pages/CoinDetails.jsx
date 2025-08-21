import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler, Legend, TimeScale } from "chart.js";
import { Line } from "react-chartjs-2";
import { useCoinData } from "../context/CoinDataContext";
import toast from "react-hot-toast";
import AddInvestmentModal from "../components/AddToPortfolioModal"; 


ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler, Legend, TimeScale);

export default function CoinDetails() {
  const { id } = useParams();
  const { getCoinInfo, getChartData } = useCoinData();

  const [coinInfo, setCoinInfo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState("1");
  const [watchlist, setWatchlist] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [selectedCoin, setSelectedCoin] = useState(null); 

  const fetchCoinInfo = useCallback(async () => {
    try {
      const data = await getCoinInfo(id);
      setCoinInfo({
        id:data.id,
        name: data.name,
        symbol: data.symbol,
        image: data.image.large,
        current_price: data.market_data.current_price.usd,
      });
    } catch (err) {
      console.error("Error fetching coin info:", err);
    }
  }, [id, getCoinInfo]);

  const fetchChartData = useCallback(async () => {
    try {
      const data = await getChartData(id, timeRange);
      if (!data.prices) return;

      const formatted = [];
      const seen = new Set();

      for (let i = 0; i < data.prices.length; i++) {
        const timestamp = data.prices[i][0];
        const price = data.prices[i][1];
        const date = new Date(timestamp);

        if (timeRange === "1") {
          const hour = date.getHours();
          if (hour % 2 === 0 && !seen.has(hour)) {
            seen.add(hour);
            formatted.push({ time: `${hour}:00`, price });
          }
        } else if (timeRange === "7") {
          const day = date.toLocaleDateString(undefined, { weekday: "short" });
          if (!seen.has(day)) {
            seen.add(day);
            formatted.push({ time: day, price });
          }
        } else if (timeRange === "30") {
          const day = date.toLocaleDateString();
          if (!seen.has(day)) {
            seen.add(day);
            formatted.push({ time: day, price });
          }
        }
      }
      setChartData(formatted);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  }, [id, timeRange, getChartData]);

  const fetchUserWatchlist = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCoinInfo();
    fetchChartData();
    fetchUserWatchlist();
  }, [fetchCoinInfo, fetchChartData, fetchUserWatchlist]);

  const handleWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to use the watchlist!");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coinId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setWatchlist(data.watchlist);
        if (data.watchlist.includes(id)) {
          toast.success(`${coinInfo?.name} added to watchlist`);
        } else {
          toast.success(`${coinInfo?.name} removed from watchlist`);
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const isInWatchlist = watchlist.includes(id);

  const handleAddToPortfolio = (coin) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add coins to your portfolio!");
      return;
    }

    

    setSelectedCoin(coin); 
    setShowModal(true); 
  };

  

  const data = {
    labels: chartData.map((d) => d.time),
    datasets: [
      {
        label: "Price (USD)",
        data: chartData.map((d) => d.price),
        borderColor: "#3b82f6",
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#111",
        borderColor: "#3b82f6",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#ccc",
        caretSize: 6,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Price: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
      legend: { display: false },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: { callback: (value) => "$" + value.toLocaleString() },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            {coinInfo?.name} ({coinInfo?.symbol?.toUpperCase()})
          </h1>
          <p className="text-lg text-gray-300 mt-1">
            Current Price: ${coinInfo?.current_price?.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleWatchlist}
            className={`text-lg ${isInWatchlist ? "text-yellow-400" : "text-gray-400"} hover:text-yellow-400`}
            title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            ★
          </button>
          <button
            onClick={() => handleAddToPortfolio(coinInfo)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        {["1", "7", "30"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              timeRange === range
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {range === "1" ? "1 Day" : range === "7" ? "7 Days" : "30 Days"}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 p-4 rounded-lg">
        <Line data={data} options={options} />
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
