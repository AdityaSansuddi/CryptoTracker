import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Portfolio from "./pages/Portfolio";
import CoinDetails from "./pages/CoinDetails.jsx";
import { CoinDataProvider } from "./context/CoinDataContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "linear-gradient(to bottom right, #111827, #1f2937, #000000)",
          color: "#ffffff",
          border: "1px solid #374151",
          borderRadius: "0.5rem",
          padding: "12px 16px",
          fontSize: "0.95rem",
        },
        success: {
          iconTheme: {
            primary: "#3b82f6", 
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", 
            secondary: "#ffffff",
          },
        },
      }}
    />
    
    <CoinDataProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/coin/:id" element={<CoinDetails />} />
        </Routes>
      </Router>
    </CoinDataProvider>
    </>
  );
}

export default App;
