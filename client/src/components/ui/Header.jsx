import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "../../styles/Header.css";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="title">
          <Link to="/">Priče iz Dubrave</Link>
        </h1>

        <nav className="navbar">
          <ul className="navbar-list">
            <li>
              <Link to="/">Početna</Link>
            </li>

            {!isAuthenticated ? (
              <>
                <li>
                  <Link to="/register">Registracija</Link>
                </li>
                <li>
                  <Link to="/login">Prijava</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/posts">Upravljačka ploča</Link>
                </li>
                <li>
                  <Link to="/create-post">Kreirajte priču</Link>
                </li>
                <li
                  className="user-menu"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <span className="username">{user?.username}</span>
                  {showDropdown && (
                    <div className="dropdown">
                      <button className="logout-button" onClick={handleLogout}>
                        Odjava
                      </button>
                    </div>
                  )}
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;