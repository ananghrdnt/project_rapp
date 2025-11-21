import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and Password are required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/auth/login", {
        username,
        password,
      });

      // Simpan token
      localStorage.setItem("token", res.data.token);

      // Kirim user object ke parent
      onLogin(res.data.user);

      // Redirect ke dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans transition-all">
      <div className="flex w-[880px] h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-white">

        {/* Left: Welcome Section */}
        <div className="flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 text-white p-10 relative overflow-hidden">
          <div className="text-center max-w-sm animate-fadeIn -mt-6">
            <div className="relative w-40 h-40 mx-auto mb-5">
              <img
                src="/april.png"
                alt="WorkNest Logo"
                className="w-40 h-40 object-contain mx-auto drop-shadow-[0_4px_25px_rgba(255,255,255,0.6)] filter brightness-125 contrast-110 animate-float"
              />
              <div className="absolute inset-0 rounded-full bg-blue-200/20 blur-2xl animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Welcome!</h1>
            <p className="text-sm mb-6 opacity-95">
              To stay connected with us, please log in using your account.
            </p>
            <p className="text-xs italic opacity-90 font-light animate-pulse">
              “Accelerating Progress, One Sprint at a Time.”
            </p>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex justify-center items-center w-1/2 p-10 bg-white">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm bg-white p-8 rounded-2xl"
          >
            <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-6">
              SprintBPGA Login
            </h2>

            {/* Username */}
            <label className="block mb-1 text-[13px] font-medium text-gray-600">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border w-full px-3 py-2 rounded-lg mb-4 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              placeholder="Enter your username"
            />

            {/* Password */}
            <label className="block mb-1 text-[13px] font-medium text-gray-600">
              Password
            </label>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border w-full px-3 py-2 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                placeholder="Enter your password"
              />
              <span
                className="absolute right-3 top-2.5 cursor-pointer text-gray-500 hover:text-blue-500 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </span>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs mb-3 text-center font-medium">
                {error}
              </p>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 hover:brightness-110 active:scale-[0.98] shadow-md"
              }`}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              © {new Date().getFullYear()} APRIL. All rights reserved.
            </p>
          </form>
        </div>
      </div>

      {/* Animation Styles */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 1s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
