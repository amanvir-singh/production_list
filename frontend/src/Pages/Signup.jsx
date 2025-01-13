import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Signup.scss";
import logo from "../assets/img/Ambienti-Moderne-NoBG.png";
import ErrorModal from "../Components/ErrorModal";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Reader");

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    let isValid = true;

    setUsernameError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (username.length < 3 || username.includes("@")) {
      setUsernameError(
        "Username must be at least 3 characters and should not contain '@'."
      );
      isValid = false;
    }

    if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters long.");
      isValid = false;
    } else {
      //   const hasNumber = [...password].some(
      //     (char) => char >= "0" && char <= "9"
      //   );
      //   const specialCharacters = "!@#$%^&*";
      //   const hasSpecialChar = [...password].some((char) =>
      //     specialCharacters.includes(char)
      //   );
      //   if (!hasNumber) {
      //     setPasswordError(
      //       (prev) => prev + " Password must include at least one number."
      //     );
      //     isValid = false;
      //   }
      //   if (!hasSpecialChar) {
      //     setPasswordError(
      //       (prev) =>
      //         prev + " Password must include at least one special character."
      //     );
      //     isValid = false;
      //   }
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match!");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/users/add`,
        {
          username,
          email,
          password,
          role,
        }
      );

      console.log("User created successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error signing up:", error.response.data);
      setBackendError(error.response.data.message);
    }
  };

  return (
    <div className="signup-page">
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="signup-page__left">
        <img src={logo} alt="Warehouse Logo" className="signup-page__logo" />
        <h2 className="signup-page__slogan">
          Production Data at Your Fingertips!
        </h2>
      </div>
      <div className="signup-page__right">
        <form onSubmit={handleSubmit} className="signup-form">
          <h1>Sign Up</h1>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <p className="error-message">{usernameError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {passwordError && <p className="error-message">{passwordError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPasswordError && (
              <p className="error-message">{confirmPasswordError}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              type="text"
              id="role"
              value={role}
              readOnly
              disabled
              className="disabled-input"
            />
          </div>
          <button type="submit" className="submit-btn">
            Sign Up
          </button>
          <div className="login-options">
            <Link to="/login" className="login-link">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
