import { useState } from "react";
import { API_BASE_URL } from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        toast.success("Account created successfully!");
        window.dispatchEvent(new Event("storage"));
        navigate("/");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error during registration");
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white p-8 flex items-center justify-center h-screen">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 rounded-xl shadow-lg w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <form className="flex flex-col" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Name"
            className="mb-4 p-3 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="mb-4 p-3 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="mb-4 p-3 rounded bg-gray-900 border border-gray-600 focus:outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-center">
            <button
              type="submit"
              className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-6 py-2 rounded-full text-sm font-medium shadow-md transition transform hover:scale-105"
            >
              Register
            </button>
          </div>
        </form>
        {message && <p className="text-center mt-4">{message}</p>}
      </div>
    </div>
  );
}
