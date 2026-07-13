import { Link } from "react-router-dom";
import { getUser, logoutUser } from "../auth";

export default function Navbar() {
  const user = getUser();

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login";
  };

  return (
    <div className="navbar">
      <Link to="/">Home</Link>
      <span>Welcome {user && user.full_name} !</span>
      <button type="button" onClick={handleLogout}>Logout</button>
    </div>
  );
}