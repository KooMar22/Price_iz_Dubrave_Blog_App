import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import authAPI from "../../api/authAPI";
import PostCard from "../post/PostCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import "../../styles/Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const result = await authAPI.getPublishedPosts();

        if (result.success) {
          setPosts(result.data.posts);
        } else {
          setError("Nismo uspjeli dohvatiti priče. Pokušajte ponovno kasnije.");
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Nismo usjeli dohvatiti priče. Pokušajte ponovno kasnije.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Dobro došli u Priče iz Dubrave</h1>
        <p>
          Ovaj blog nastao je kao projektni zadatak u sklopu TheOdinProject-a
          (dio: autentifikacija i APIs), uz mala proširenja u smislu dodavanja
          nekih funkcionalnosti
        </p>
        <p>
          Ne morate brinuti za svoje lozinke i tokene - oni su sigurno hashirani
          i pohranjeni u bazi. Za razliku od nekih državnih kompanija u
          energetskom sektoru, ja kao entuzijast ipak brinem o sigurnosti svojih
          korisnika 😎
        </p>
        <p>Otkrijte i podijelite vaše priče, razmišljanja i iskustva...</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Pokušajte ponovno
          </button>
        </div>
      )}

      {!error && (
        <>
          {posts.length === 0 ? (
            <div className="no-posts">
              <div className="no-posts-content">
                <h2>Još nema objavljenih priča.</h2>
                <p>Budite među prvima i podijelite vašu priču!</p>
                <Link to="/register" className="cta-button">
                  Pridružite se zajednici
                </Link>
              </div>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="home-cta">
            <div className="cta-content">
              <h2>Podijelite priču</h2>
              <p>Pridružite se našoj zajednici i podijelite svoju priču</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-button" id="btn-primary">
                  Započnite putovanje
                </Link>
                <Link to="/login" className="cta-button" id="btn-secondary">
                  Prijavite se
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;