import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
}

router.get("/watchlist", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ watchlist: user.watchlist });
});

router.post("/watchlist", authenticateToken, async (req, res) => {
  const { coinId } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const index = user.watchlist.indexOf(coinId);
  if (index === -1) {
    user.watchlist.push(coinId);
  } else {
    user.watchlist.splice(index, 1);
  }

  await user.save();
  res.json({ watchlist: user.watchlist });
});

export default router;
