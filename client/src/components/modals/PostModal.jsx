import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import authAPI from "../../api/authAPI";
import LoadingSpinner from "../ui/LoadingSpinner";
import "../../styles/PostModal.css";

const PostModal = ({ post, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [fullPost, setFullPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        // Fetch full post data
        const postResult = await authAPI.getPost(post.id);
        if (postResult.success) {
          setFullPost(postResult.data.post);
          setComments(postResult.data.post.comments || []);
        } else {
          setError("Failed to load post");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [post.id]);

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      setError("You must be logged in to comment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await authAPI.createComment(post.id, newComment.trim());

      if (result.success) {
        setComments((prev) => [result.data.comment, ...prev]);
        setNewComment("");
      } else {
        setError(result.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Jeste li sigurni da želite izbrisati komentar?")) {
      return;
    }

    try {
      const result = await authAPI.deleteComment(commentId);

      if (result.success) {
        setComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );
      } else {
        setError("Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  // Handle comment edit start
  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Handle comment edit cancel
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  // Handle comment edit submit
  const handleEditSubmit = async (commentId) => {
    if (!editContent.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      const result = await authAPI.updateComment(commentId, editContent.trim());

      if (result.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, content: result.data.comment.content }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent("");
        setError(""); // Clear any previous errors
      } else {
        setError("Failed to update comment");
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle modal background click
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (editingComment) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, editingComment]);

  return (
    <div className="modal-overlay" onClick={handleBackgroundClick}>
      <div className="modal-content">
        <div className="modal-header">
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError("")} className="dismiss-error">
              ✕
            </button>
          </div>
        ) : (
          <div className="modal-body">
            {/* Post Content */}
            <article className="post-content">
              <header className="post-header">
                <h1 className="post-title">{fullPost.title}</h1>
                <div className="post-meta">
                  <span className="post-author">
                    od {fullPost.user.username}
                  </span>
                  <span className="post-date">
                    {formatDate(fullPost.createdAt)}
                  </span>
                </div>
              </header>

              <div className="post-body">
                <p className="post-text">{fullPost.content}</p>
              </div>
            </article>

            {/* Comments Section */}
            <section className="comments-section">
              <h3 className="comments-title">Komentari ({comments.length})</h3>

              {/* Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <div className="comment-input-group">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Podijelite svoja razmišljanja..."
                      className="comment-input"
                      rows={3}
                      disabled={submitting}
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="comment-submit"
                    >
                      {submitting ? "Objavljujem..." : "Objavi komentar"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="comment-login-prompt">
                  <p>Prijavite se da biste ostavili komentar.</p>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="no-comments">
                    <p>Na ovu priču nema komentara. Podijelite prvi svoja razmišljanja!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <div className="comment-info">
                          <span className="comment-author">
                            od {comment.user.username}
                          </span>
                          <span className="comment-date">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>

                        {/* Edit/Delete buttons for comment author, post author, or admin */}
                        {isAuthenticated &&
                          (comment.userId === user?.id ||
                            fullPost.userId === user?.id ||
                            user?.isAdmin) && (
                            <div className="comment-actions">
                              {/* Edit button - only for comment author */}
                              {comment.userId === user?.id && (
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="comment-edit"
                                  title="Uredite komentar"
                                  disabled={editingComment === comment.id}
                                >
                                  ✏️
                                </button>
                              )}

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="comment-delete"
                                title="Izbrišite komentar"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                      </div>

                      <div className="comment-body">
                        {editingComment === comment.id ? (
                          /* Edit form */
                          <div className="comment-edit-form">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="comment-edit-input"
                              rows={3}
                              maxLength={1000}
                              autoFocus
                            />
                            <div className="comment-edit-actions">
                              <button
                                onClick={handleCancelEdit}
                                className="comment-edit-cancel"
                                type="button"
                              >
                                Odustanite
                              </button>
                              <button
                                onClick={() => handleEditSubmit(comment.id)}
                                className="comment-edit-save"
                                disabled={!editContent.trim()}
                                type="button"
                              >
                                Spremite
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display comment */
                          <p className="comment-text">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostModal;