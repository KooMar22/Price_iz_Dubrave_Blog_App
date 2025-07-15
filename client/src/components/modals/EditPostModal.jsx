import { useState, useEffect } from "react";
import authAPI from "../../api/authAPI";
import "../../styles/EditPostModal.css";

const EditPostModal = ({ post, onClose, onPostUpdated }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPosted: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        isPosted: post.isPosted,
      });
    }
  }, [post]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length > 5000) {
      newErrors.content = "Content must be 5000 characters or less";
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
      const result = await authAPI.updatePost(post.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPosted: formData.isPosted,
      });

      if (result.success) {
        onPostUpdated(result.data.post);
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error("Update post error:", error);
      setErrors({ submit: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
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
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={handleBackgroundClick}>
      <div className="edit-modal-content">
        <div className="edit-modal-header">
          <h2>Uredite priču</h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-post-form">
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="edit-title" className="form-label">
              Naslov priče
            </label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? "error" : ""}`}
              placeholder="Unesite naslov priče"
              disabled={loading}
              maxLength={200}
              required
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
            <div className="character-count">
              {formData.title.length}/200 znakova
            </div>
          </div>

          {/* Content Field */}
          <div className="form-group">
            <label htmlFor="edit-content" className="form-label">
              Sadržaj priče
            </label>
            <textarea
              id="edit-content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={`form-textarea ${errors.content ? "error" : ""}`}
              placeholder="Upišite sadržaj vaše priče..."
              disabled={loading}
              rows={12}
              maxLength={5000}
              required
            />
            {errors.content && (
              <span className="error-message">{errors.content}</span>
            )}
            <div className="character-count">
              {formData.content.length}/5000 znakova
            </div>
          </div>

          {/* Publish Option */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPosted"
                checked={formData.isPosted}
                onChange={handleChange}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkbox-text">Objavljeno</span>
            </label>
            <p className="checkbox-help">
              {formData.isPosted
                ? "Priča je vidljiva svim posjetiteljima"
                : "Priča je spremljena u predloške"}
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && <div className="submit-error">{errors.submit}</div>}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Odustanite
            </button>

            <button
              type="submit"
              className={`submit-button ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Ažuriram..." : "Ažuriraj pričut"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;