import { useState } from "react";
import { useAuth } from "../../context/authContext";
import PostModal from "../modals/PostModal";
import "../../styles/PostCard.css";

const PostCard = ({ post, onUpdate, onDelete, showAdminActions = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

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

  // Truncate content for preview
  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Check if current user can edit this post
  const canEdit =
    isAuthenticated &&
    (user?.id === post.userId || user?.isAdmin || showAdminActions);

  const handleReadMore = () => {
    setShowModal(true);
  };

  return (
    <>
      <article className="post-card">
        <div className="post-card-header">
          <h3 className="post-title">{post.title}</h3>
          <div className="post-meta">
            <span className="post-author">od {post.user.username}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
            {!post.isPosted && <span className="post-status draft">Predložak</span>}
          </div>
        </div>

        <div className="post-card-body">
          <p className="post-preview">{truncateContent(post.content)}</p>

          <div className="post-stats">
            <span className="comment-count">
              💬 {post._count?.comments || 0} komentari
            </span>
          </div>
        </div>

        <div className="post-card-footer">
          <button onClick={handleReadMore} className="read-more-button">
            Pročitajte više
          </button>

          {canEdit && showAdminActions && (
            <div className="post-actions">
              <button
                onClick={() => onUpdate?.(post)}
                className="edit-button"
                title="Edit post"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete?.(post)}
                className="delete-button"
                title="Izbriši priču"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </article>

      {showModal && (
        <PostModal post={post} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default PostCard;