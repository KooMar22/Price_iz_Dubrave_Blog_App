import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import authAPI from "../../api/authAPI";
import "../../styles/Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    // If no token in URL, redirect to forgot password
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Potrebno je unijeti lozinku";
    } else if (formData.password.length < 6) {
      newErrors.password = "Lozinka mora sadržavati najmanje 6 znakova";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Lozinka mora sadržavati najmanje 1 slovo i 1 broj";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potvrdite lozinku";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Unesene lozinke se ne podudaraju";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.resetPassword(
        token,
        formData.password,
        formData.confirmPassword
      );

      if (result.success) {
        setSuccess(true);
      } else {
        setErrors({
          submit: result.error || "Dogodila se greška pri resetiranju lozinke.",
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setErrors({ submit: "Link je istekao ili nije valjan. Zatražite novi." });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Lozinka uspješno resetirana! ✅</h2>
            <p>Vaša lozinka je uspješno promijenjena</p>
          </div>

          <div className="success-message">
            <p>Sada se možete prijaviti s vašom novom lozinkom.</p>
          </div>

          <Link
            to="/login"
            className="auth-button"
          >
            Idite na prijavu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Resetirajte lozinku</h2>
          <p>Unesite novu lozinku za Vaš korisnički račun</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Nova lozinka
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Unesite novu lozinku"
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
              Mora sadržavati najmanje 6 znakova, od toga najmanje 1 slovo i 1
              broj
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Potvrdite novu lozinku
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
                placeholder="Potvrdite novu lozinku"
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
            {loading ? "Resetiranje..." : "Resetirajte lozinku"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              Natrag na prijavu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;