import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import authAPI from "../../api/authAPI";
import PostCard from "../post/PostCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import EditPostModal from "../modals/EditPostModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import "../../styles/Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch posts function (extracted so it can be reused)
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let allPosts = [];

      // If admin, get ALL posts (including all drafts)
      if (user?.isAdmin) {
        const adminResult = await authAPI.getAllPosts();
        if (adminResult.success) {
          allPosts = adminResult.data.posts;
        }
      } else {
        // For regular users: get published posts + their own drafts

        // First get all published posts
        const publishedResult = await authAPI.getPublishedPosts();
        if (publishedResult.success) {
          allPosts = [...publishedResult.data.posts];
        }

        // Then get all posts to find user's drafts
        try {
          const allPostsResult = await authAPI.getAllPosts();
          if (allPostsResult.success) {
            // Get user's own drafts only
            const userDrafts = allPostsResult.data.posts.filter(
              (post) => post.userId === user.id && !post.isPosted
            );

            // Add user's drafts to the list
            allPosts = [...allPosts, ...userDrafts];
          }
        } catch (err) {
          console.error(`Error fetching user drafts: ${err}`);
        }
      }

      setPosts(allPosts);
    } catch (err) {
      console.error(`Error fetching posts: ${err}`);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  // Filter posts based on selected filter
  const getFilteredPosts = () => {
    switch (filter) {
      case "published":
        return posts.filter((post) => post.isPosted);
      case "drafts":
        return posts.filter((post) => !post.isPosted);
      default:
        return posts;
    }
  };

  // Handle post update
  const handleUpdatePost = (post) => {
    setEditingPost(post);
  };

  // Handle post deletion request
  const handleDeletePost = (post) => {
    setDeletingPost(post);
  };

  // Confirm deletion
  const confirmDeletePost = async () => {
    if (!deletingPost) return;

    setIsDeleting(true);

    try {
      const result = await authAPI.deletePost(deletingPost.id);

      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
        setDeletingPost(null);
      } else {
        setError("Failed to delete post");
      }
    } catch (err) {
      console.error(`Error deleting post: ${err}`);
      setError("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeletingPost(null);
    }
  };

  // Handle post toggle status
  const handleToggleStatus = async (post) => {
    try {
      const result = await authAPI.togglePostStatus(post.id);

      if (result.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, isPosted: result.data.post.isPosted } : p
          )
        );
      } else {
        setError("Failed to update post status");
      }
    } catch (err) {
      console.error(`Error toggling post status: ${err}`);
      setError("Failed to update post status");
    }
  };

  // Handle post update from modal
  const handlePostUpdated = () => {
    setEditingPost(null);
    // Refresh the posts to ensure we have the latest data
    fetchPosts();
  };

  const filteredPosts = getFilteredPosts();

  if (loading) {
    return (
      <LoadingSpinner
        size="large"
        message="Učitavamo Vašu upravljačku ploču..."
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dobro došli, {user?.username}!</h1>
          <p>Ovdje možete upravljati vašim sadržajem!</p>
        </div>

        <div className="dashboard-actions">
          <Link to="/create-post" className="create-post-button">
            ✏️ Kreirajte novu priču
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError("")} className="dismiss-error">
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">
            {user?.isAdmin
              ? posts.length
              : posts.filter((p) => p.userId === user?.id).length}
          </div>
          <div className="stat-label">
            {user?.isAdmin ? "Ukupno priča" : "Moje priče"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {user?.isAdmin
              ? posts.filter((p) => p.isPosted).length
              : posts.filter((p) => p.isPosted && p.userId === user?.id).length}
          </div>
          <div className="stat-label">
            {user?.isAdmin ? "Sve objavljene priče" : "Moje objavljene priče"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {user?.isAdmin
              ? posts.filter((p) => !p.isPosted).length
              : posts.filter((p) => !p.isPosted && p.userId === user?.id)
                  .length}
          </div>
          <div className="stat-label">
            {user?.isAdmin ? "Svi predlošci" : "Moji predlošci"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {user?.isAdmin
              ? posts.reduce(
                  (total, post) => total + (post._count?.comments || 0),
                  0
                )
              : posts
                  .filter((p) => p.userId === user?.id)
                  .reduce(
                    (total, post) => total + (post._count?.comments || 0),
                    0
                  )}
          </div>
          <div className="stat-label">
            {user?.isAdmin ? "Svi komentari" : "Komentari na moje priče"}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Sve objave ({posts.length})
        </button>
        <button
          className={`filter-tab ${filter === "published" ? "active" : ""}`}
          onClick={() => setFilter("published")}
        >
          Objavljeno ({posts.filter((p) => p.isPosted).length})
        </button>
        <button
          className={`filter-tab ${filter === "drafts" ? "active" : ""}`}
          onClick={() => setFilter("drafts")}
        >
          Predlošci ({posts.filter((p) => !p.isPosted).length})
        </button>
      </div>

      {/* Posts List */}
      <div className="posts-section">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">
            <div className="no-posts-content">
              <h3>
                {filter === "all"
                  ? "Još nema objavljenih priča"
                  : filter === "published"
                  ? "Nema objavljenih priča"
                  : "Nema predložaka"}
              </h3>
              <p>
                {filter === "all"
                  ? "Počni pisati svoju priču!"
                  : filter === "published"
                  ? "Objavite svoje predloške kako biste ih vidjeli ovdje."
                  : "Kreirajte predloške i kasnije nastavite raditi na njima."}
              </p>
              {filter === "all" && (
                <Link to="/create-post" className="cta-button">
                  Kreirajte prvu priču
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => {
              // Check if current user can edit this specific post
              const canEditThisPost = user?.id === post.userId || user?.isAdmin;

              return (
                <div key={post.id} className="post-card-wrapper">
                  <PostCard
                    post={post}
                    onUpdate={canEditThisPost ? handleUpdatePost : undefined}
                    onDelete={canEditThisPost ? handleDeletePost : undefined}
                    showAdminActions={canEditThisPost}
                  />

                  {/* Additional admin actions */}
                  {canEditThisPost && (
                    <div className="post-admin-actions">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`toggle-button ${
                          post.isPosted ? "unpublish" : "publish"
                        }`}
                      >
                        {post.isPosted ? "📤 Vrati u predloške" : "📢 Objavi"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={confirmDeletePost}
        title="Izbrišite priču"
        message={`Jeste li sigurni da želite izbrisati "${deletingPost?.title}"? Kada izbrišete, nema više povratka.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Dashboard;