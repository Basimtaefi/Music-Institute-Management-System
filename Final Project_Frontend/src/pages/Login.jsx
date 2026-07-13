import { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../api";
import { loginUser } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // for try catch

  const handleEmailChange = (event) => {
    const newEmail = event.target.value;
    setEmail(newEmail);
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);
  };

  const handleLogin = async (event) => {
    event.preventDefault(); // pervents refreshing suddenly used for <form> (AI)
    try {
      const data = await post("/login", {email, password});
      loginUser(data.token, data.user);
      window.location.href = "/"; // for home
    } catch (error) {
      setError(error.message);
    }
  }; 

  return (
    <div className="auth-page">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <p className="error-text">{error}</p>}
        <input type="email" placeholder="email" value={email} onChange={handleEmailChange} />
        <br />
        <input type="password" placeholder="password" value={password} onChange={handlePasswordChange} />
        <br />
        <button type="submit">Login</button>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
        <br />
      </form>
    </div>
  );
}
