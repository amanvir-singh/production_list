import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Login.scss";
import logo from "../assets/img/Ambienti-Moderne-NoBG.png";
import ErrorModal from "../Components/ErrorModal";
import { AuthContext } from "../Components/AuthContext";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/users/login`,
        {
          username,
          password,
        }
      );
      if (response.data.success) {
        // Store user data or token in local storage or context
        login(response.data.user);
        navigate("/"); // Redirect
        window.dispatchEvent(new Event("loginSuccess"));
      }
    } catch (error) {
      console.error("Error logging in:", error.response?.data || error.message);
      setBackendError(
        error.response?.data?.message || "An error occurred during login"
      );
    }
  };

  return (
    <div className="login-page">
      <ErrorModal message={backendError} onClose={() => setBackendError("")} />
      <div className="login-page__left">
        <img src={logo} alt="Warehouse Logo" className="login-page__logo" />
        <h2 className="login-page__slogan">
          Production Data at Your Fingertips!
        </h2>
      </div>
      <div className="login-page__right">
        <form onSubmit={handleSubmit} className="login-form">
          <h1>Login</h1>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Login
          </button>
          <div className="login-options">
            <Link to="/signup" className="signup-link">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
