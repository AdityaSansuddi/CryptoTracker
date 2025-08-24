import express from "express";
import Portfolio from "../models/Portfolio.js";
import { protect} from "../middleware/authMiddleware.js";
import axios from "axios";

const router = express.Router();

router.post("/add", protect , async (req, res) => {
  try {
    const { coinId, name, symbol, image, buyPrice, quantity } = req.body;

    const investment = buyPrice * quantity;

    const entry = new Portfolio({
      userId: req.user.id,
      coinId,
      name,
      symbol,
      image,
      buyPrice,
      quantity,
      investment,
    });

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error adding portfolio entry" });
  }
});

router.post("/sell", protect, async (req, res) => {
  try {
    const { coinId, quantity } = req.body;
    const userId = req.user.id;

    if (!coinId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid data provided." });
    }

    const entry = await Portfolio.findOne({ userId, coinId });

    if (!entry) {
      return res.status(404).json({ message: "Coin not found in portfolio." });
    }

    if (entry.quantity < quantity) {
      return res.status(400).json({ message: "Cannot sell more than you own." });
    }

    const averageBuyPrice = entry.investment / entry.quantity;
    const saleValue = averageBuyPrice * quantity;

    entry.quantity -= quantity;
    entry.investment -= saleValue;

    if (entry.quantity <= 0.000001) { 
      await entry.deleteOne();
      res.json({ message: "Coin sold and removed from portfolio." });
    } else {
      await entry.save();
      res.json(entry);
    }

  } catch (err) {
    console.error("Error during sell transaction:", err);
    res.status(500).json({ message: "Server error while processing sale." });
  }
});

router.get("/", protect , async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user.id });

    if (!portfolio.length) return res.json([]);

    const ids = portfolio.map(p => p.coinId).join(",");
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );

    let totalInvestment = 0;
    let currentValue = 0;

    const detailed = portfolio.map(p => {
      const currentPrice = data[p.coinId]?.usd || 0;
      const currentVal = currentPrice * p.quantity;
      const profitLoss = currentVal - p.investment;

      totalInvestment += p.investment;
      currentValue += currentVal;

      return {
        id: p.coinId,
        name: p.name,
        symbol: p.symbol,
        image: p.image,
        price: currentPrice,
        investment: p.investment,
        coinsPurchased: p.quantity,
        currentValue: currentVal,
        profitLoss,
      };
    });

    const sortedByPL = [...detailed].sort((a, b) => b.profitLoss - a.profitLoss);

    res.json({
      portfolio: detailed,
      totalInvestment,
      currentValue,
      allocation: detailed.map(c => ({
        name: c.name,
        percent: ((c.investment / totalInvestment) * 100).toFixed(2),
      })),
      topGainers: sortedByPL.slice(0, 3),
      topLosers: sortedByPL.slice(-3),
    });
  } catch (err) {
    // --- THIS LOG IS THE MOST IMPORTANT PART ---
    // It will print the exact error to your Render logs
    console.error("!!! ERROR in GET /api/portfolio:", err); 
    res.status(500).json({ error: "Error fetching portfolio" });
    
  }
});

router.delete("/:coinId", protect, async (req, res) => {
  try {
    const coinId = req.params.coinId;
    const userId = req.user.id;

    const deletedEntry = await Portfolio.findOneAndDelete({ userId: userId, coinId: coinId });

    if (!deletedEntry) {
      return res.status(404).json({ error: "Portfolio entry not found" });
    }

    res.json({ message: "Portfolio entry deleted successfully" });
  } catch (err) {
    console.error("Error deleting portfolio entry:", err);
    res.status(500).json({ error: "Server error while deleting portfolio entry" });
  }
});


export default router;


