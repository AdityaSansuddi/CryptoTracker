import { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api"; 


export default function AddInvestmentModal({ coin, onClose, onAdd }) {
  const [quantity, setQuantity] = useState("");
  const buyPrice = coin?.current_price || 0;

  const totalInvestment =
    quantity && buyPrice ? (quantity * buyPrice).toFixed(2) : "0.00";

  const handleAdd = async () => {
  if (!quantity || quantity <= 0) return;

  const token = localStorage.getItem("token");
  if (!token) return toast.error("Please login first");

  try {
    await fetch(`${API_BASE_URL}/portfolio/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        coinId: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        buyPrice,
        quantity: parseFloat(quantity),
      }),
    });

    toast.success("Added to portfolio!");
    onClose();
  } catch (err) {
    toast.error("Failed to add coin");
  }
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-xl shadow-lg w-96 border border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-400 transition"
        >
          ✕
        </button>
        <div className="flex items-center mb-6">
          <img
            src={coin?.image}
            alt={coin?.name}
            className="w-12 h-12 mr-4 rounded-full"
          />
          <div>
            <h2 className="text-xl font-bold">
              {coin?.name} ({coin?.symbol?.toUpperCase()})
            </h2>
            <p className="text-gray-400">
              Current Price: ${buyPrice.toLocaleString()}
            </p>
          </div>
        </div>

        <label className="block text-gray-300 mb-1">Amount</label>
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"  
          className="mb-4 p-3 w-full rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <label className="block text-gray-300 mb-1">Buy Price</label>
        <div className="mb-4 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            type="number"
            value={buyPrice}
            readOnly
            className="p-3 w-full rounded bg-gray-900 border border-gray-600 text-gray-400 cursor-not-allowed pl-8"
          />
        </div>

        <p className="text-gray-300 mb-4 text-center">
          Total Investment: <span className="font-semibold">${totalInvestment}</span>
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleAdd}
            className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-6 py-2 rounded-full text-sm font-medium shadow-md transition transform hover:scale-105"
          >
            Add To The portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
