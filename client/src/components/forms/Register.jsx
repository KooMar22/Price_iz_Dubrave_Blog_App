import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "../../styles/Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Potrebno je unijeti korisničko ime";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = "Korisničko ime može sadržavati samo slova i brojeve.";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Potrebno je unijeti lozinku";
    } else if (formData.password.length < 6) {
      newErrors.password = "Lozinka mora sadržavati najmanje 6 znakova";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Lozinka mora sadržavati najmanje 1 slovo i 1 broj";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potvrdite lozinku";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Unesene lozinke se ne podudaraju";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.username, formData.password);

      if (result.success) {
        navigate("/posts");
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      console.error(`Registration error: ${error}`);
      setErrors({ submit: "Dogodila se neočekivana pogreška" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Kreirajte korisnički račun</h2>
          <p>Pridružite se Pričama iz Dubrave</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Korisničko ime
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? "error" : ""}`}
              placeholder="Odaberite korisničko ime"
              disabled={loading}
              required
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
            <span className="input-hint">Moguće je unijeti samo slova i brojeve</span>
          </div>


          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Lozinka
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Kreirajte lozinku"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
            <span className="input-hint">
              Mora sadržavati najmanje 6 znakova, od toga najmanje 1 slovo i 1 broj
            </span>
          </div>


          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Potvrdite lozinku
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${
                  errors.confirmPassword ? "error" : ""
                }`}
                placeholder="Potvrdite lozinku"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>


          {errors.submit && <div className="submit-error">{errors.submit}</div>}


          <button
            type="submit"
            className={`auth-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Kreiramo korisnički račun..." : "Kreirajte korisnički račun"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Već imate korisnički račun?{" "}
            <Link to="/login" className="auth-link">
              Prijavite se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;