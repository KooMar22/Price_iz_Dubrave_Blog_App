import { useState } from "react";
import { Link } from "react-router-dom";
import authAPI from "../../api/authAPI";
import "../../styles/Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Molimo unesite email adresu");
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.forgotPassword(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Dogodila se greška. Pokušajte ponovno.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Dogodila se neočekivana greška. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Email poslan! ✉️</h2>
            <p>Provjerite svoj email za link za resetiranje lozinke</p>
          </div>

          <div className="success-message">
            <p>
              Ako postoji korisnički račun povezan s email adresom{" "}
              <strong>{email}</strong>, poslali smo vam upute za resetiranje
              lozinke.
            </p>
            <p>Link će isteći za 15 minuta iz sigurnosnih razloga.</p>
          </div>

          <div className="auth-footer">
            <p>
              Niste primili email?{" "}
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="auth-link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Pokušajte ponovno
              </button>
            </p>
            <p>
              <Link to="/login" className="auth-link">
                Natrag na prijavu
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Zaboravili ste lozinku?</h2>
          <p>
            Nema problema! Unesite svoju email adresu i poslat ćemo vam link za
            resetiranje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email adresa
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${error ? "error" : ""}`}
              placeholder="Unesite vašu email adresu"
              disabled={loading}
              required
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className={`auth-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Šalje se..." : "Pošaljite link za resetiranje"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Sjetili ste se lozinke?{" "}
            <Link to="/login" className="auth-link">
              Prijavite se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;