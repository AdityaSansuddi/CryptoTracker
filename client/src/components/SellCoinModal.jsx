import { useState } from "react";
import toast from "react-hot-toast";

export default function SellCoinModal({ coin, onClose, onConfirmSale }) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const salePrice = coin?.price || 0;

  const totalSaleValue =
    quantity && salePrice ? (quantity * salePrice).toFixed(2) : "0.00";

  const handleQuantityChange = (e) => {
    const newQuantity = e.target.value;
    if (newQuantity > coin.coinsPurchased) {
      setError(`You can only sell up to ${coin.coinsPurchased} coins.`);
    } else {
      setError("");
    }
    setQuantity(newQuantity);
  };
  
  const handleConfirm = () => {
    if (error || !quantity || quantity <= 0) {
        toast.error("Please enter a valid quantity.");
        return;
    }
    onConfirmSale(coin.id, parseFloat(quantity));
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
              Sell {coin?.name} ({coin?.symbol?.toUpperCase()})
            </h2>
            <p className="text-gray-400">
              Current Holdings: {coin?.coinsPurchased}
            </p>
          </div>
        </div>

        <label className="block text-gray-300 mb-1">Quantity to Sell</label>
        <input
          type="number"
          placeholder="0.00"
          value={quantity}
          onChange={handleQuantityChange}
          min="0"
          max={coin.coinsPurchased} 
          className={`mb-2 p-3 w-full rounded bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-blue-500`}
        />
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}


        <p className="text-gray-300 mb-6 text-center">
          Estimated Value: <span className="font-semibold">${totalSaleValue}</span>
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-6 py-2 rounded-full text-sm font-medium shadow-md transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error || !quantity || quantity <= 0}
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}