import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SellCoinModal from "../components/SellCoinModal";
import { API_BASE_URL } from "../api"; 



ChartJS.register(ArcElement, Tooltip, Legend);

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [activeTab, setActiveTab] = useState('gainers'); 
  const [overallPercentage, setOverallPercentage] = useState(0); 
  const navigate = useNavigate();

 
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to view your portfolio");
      navigate("/login");
    } else {
      fetchPortfolio();
    }
  }, [navigate]);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

     
      const processedPortfolio = (data.portfolio || []).map(coin => ({
        ...coin,
        profitLossPercentage: coin.investment > 0 ? (coin.profitLoss / coin.investment) * 100 : 0
      }));

      setPortfolio(processedPortfolio);
      setTotalInvestment(data.totalInvestment || 0);
      setCurrentValue(data.currentValue || 0);

      
      const investment = data.totalInvestment || 0;
      const currentVal = data.currentValue || 0;
      if (investment > 0) {
        const percentage = ((currentVal - investment) / investment) * 100;
        setOverallPercentage(percentage);
      }
    } catch (err) {
      toast.error("Error fetching portfolio");
    }
  };

  const handleOpenSellModal = (coin) => {
    setSelectedCoin(coin);
    setIsSellModalOpen(true);
  };

  const handleConfirmSale = async (coinId, quantity) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/portfolio/sell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ coinId, quantity })
        });

        if (res.ok) {
            toast.success("Sale recorded successfully!");
            setIsSellModalOpen(false);
            fetchPortfolio(); 
        } else {
            const data = await res.json();
            throw new Error(data.message || "Failed to record sale.");
        }
    } catch (err) {
        toast.error(err.message);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableStyles = {
        headStyles: { fillColor: [37, 99, 235] }, 
        
    };

    const formatCurrency = (num) => {
        if (num >= 0) {
            return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            return `-$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    const top2Gainers = [...portfolio].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage).slice(0, 2);
    const top2Losers = [...portfolio].sort((a, b) => a.profitLossPercentage - b.profitLossPercentage).slice(0, 2);

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Portfolio Details", pageWidth / 2, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const totalPnlValue = currentValue - totalInvestment;
    doc.text(`Total Investment: ${formatCurrency(totalInvestment)}`, 14, 35);
    doc.text(`Current Value: ${formatCurrency(currentValue)}`, 14, 42);
    doc.text(`Total Profit/Loss Value: ${formatCurrency(totalPnlValue)}`, 14, 49);
    doc.text(`Total Profit/Loss Percentage: ${overallPercentage.toFixed(2)}%`, 14, 56);
    
    autoTable(doc, {
      ...tableStyles,
      startY: 70,
      head: [['Name', 'Price(USD)', 'Investment(USD)', 'Coins Purchased', 'Current Value(USD)', 'P/L Value(USD)', 'P/L %']],
      body: portfolio.map(coin => [
        coin.name,
        formatCurrency(coin.price),
        formatCurrency(coin.investment),
        coin.coinsPurchased,
        formatCurrency(coin.currentValue),
        formatCurrency(coin.profitLoss),
        `${coin.profitLossPercentage.toFixed(2)}%`
      ]),
    });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Top Gainers", 14, doc.lastAutoTable.finalY + 15);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        ...tableStyles,
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Name', 'P/L Value(USD)', 'P/L %']],
        body: top2Gainers.map(coin => [
            coin.name,
            formatCurrency(coin.profitLoss),
            `${coin.profitLossPercentage.toFixed(2)}%`
        ]),
    });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Top Losers", 14, doc.lastAutoTable.finalY + 15);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        ...tableStyles,
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Name', 'P/L Value(USD)', 'P/L %']],
        body: top2Losers.map(coin => [
            coin.name,
            formatCurrency(coin.profitLoss),
            `${coin.profitLossPercentage.toFixed(2)}%`
        ]),
    });

    doc.save('portfolio-details.pdf');
  };

  const allocationData = {
    labels: portfolio.map(coin => coin.name),
    datasets: [{
      data: portfolio.map(coin => coin.currentValue),
      backgroundColor: ['#F7931A', '#627EEA', '#8A4D76', '#C2A633', '#669073', '#64748B'],
      borderColor: '#1f2937', 
      borderWidth: 2,
    }],
  };

  const allocationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#d1d5db', 
          boxWidth: 12,
          padding: 20,
        }
      }
    }
  };
  
  const topGainers = [...portfolio].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage).slice(0, 5);
  const topLosers = [...portfolio].sort((a, b) => a.profitLossPercentage - b.profitLossPercentage).slice(0, 5);

  return (
    <div className="bg-gray-800 text-white min-h-screen p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <p className="text-gray-400">Current Value</p>
          <h2 className="text-3xl font-semibold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className={`flex items-center text-sm mt-2 font-medium ${overallPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {overallPercentage >= 0 ? '▲' : '▼'}
            <span className="ml-1">{overallPercentage.toFixed(2)}%</span>
          </p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <p className="text-gray-400">Total Investment</p>
          <h2 className="text-3xl font-semibold">${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <h3 className="text-xl font-bold mb-4">Portfolio Allocation</h3>
          {portfolio.length > 0 ? (
            <div className="relative flex-grow">
              <Doughnut data={allocationData} options={allocationOptions} />
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">No coins in portfolio to display.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg h-96 flex flex-col">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('gainers')}
              className={`py-2 px-4 font-medium ${activeTab === 'gainers' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className={`py-2 px-4 font-medium ${activeTab === 'losers' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}
            >
              Top Losers
            </button>
          </div>
          <div className="mt-4 space-y-4 overflow-y-auto flex-grow">
            {(activeTab === 'gainers' ? topGainers : topLosers).map(coin => (
              <div key={coin.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={coin.image} alt={coin.name} className="w-8 h-8"/>
                  <div>
                    <p className="font-semibold">{coin.name}</p>
                    <p className="text-xs text-gray-400">{coin.symbol?.toUpperCase()}</p>
                  </div>
                </div>
                <p className={`font-semibold ${coin.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.profitLossPercentage >= 0 ? '+' : ''}{coin.profitLossPercentage.toFixed(2)}%
                </p>
              </div>
            ))}
             {portfolio.length === 0 && (
                <div className="flex-grow flex items-center justify-center h-full">
                    <p className="text-gray-500">No coins to display.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow-lg mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Portfolio Details</h2>
          <button
            onClick={exportPDF}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Export PDF
          </button>
        </div>

        {portfolio.length === 0 ? (
          <p className="text-center text-gray-400 py-4">
            No Coins Added To Portfolio
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Coin</th>
                  <th className="px-4 py-2">Price (USD)</th>
                  <th className="px-4 py-2">Investment</th>
                  <th className="px-4 py-2">Coins Purchased</th>
                  <th className="px-4 py-2">Current Value</th>
                  <th className="px-4 py-2">Profit / Loss</th>
                  <th className="px-4 py-2 text-center">Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((coin, index) => (
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
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <span className="text-white">{coin.name}</span>
                    </td>
                    <td className="px-4 py-2">${coin.price.toLocaleString()}</td>
                    <td className="px-4 py-2">${coin.investment.toLocaleString()}</td>
                    <td className="px-4 py-2">{coin.coinsPurchased}</td>
                    <td className="px-4 py-2">${coin.currentValue.toLocaleString()}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        coin.profitLoss >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {coin.profitLoss >= 0 ? `+${coin.profitLoss}` : coin.profitLoss}
                    
                    
                    </td>
                    <td className="px-4 py-2 text-center"> 
                        <button 
                            onClick={() => handleOpenSellModal(coin)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded"
                        >
                            Remove
                        </button>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {isSellModalOpen && (
        <SellCoinModal
          coin={selectedCoin}
          onClose={() => setIsSellModalOpen(false)}
          onConfirmSale={handleConfirmSale}
        />
      )}
    </div>
  );
}
