import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coinId: { type: String, required: true }, // e.g. 'bitcoin'
  name: String,
  symbol: String,
  image: String,
  buyPrice: Number,
  quantity: Number,
  investment: Number,
}, { timestamps: true });

export default mongoose.model("Portfolio", portfolioSchema);
