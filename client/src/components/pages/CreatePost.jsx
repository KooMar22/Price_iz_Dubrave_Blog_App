import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authAPI from "../../api/authAPI";
import "../../styles/CreatePost.css";

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPosted: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const result = await authAPI.createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPosted: formData.isPosted,
      });

      if (result.success) {
        navigate("/posts");
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error("Create post error:", error);
      setErrors({ submit: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      setErrors({ submit: "Please add a title or content before saving" });
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.createPost({
        title: formData.title.trim() || "Untitled Draft",
        content: formData.content.trim() || "No content yet...",
        isPosted: false,
      });

      if (result.success) {
        navigate("/posts");
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error("Save draft error:", error);
      setErrors({ submit: "Failed to save draft" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <h1>Kreirajte novu priču</h1>
        <p>Podijelite svoju priču s drugima.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        {/* Title Field */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Naslov priče
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-input ${errors.title ? "error" : ""}`}
            placeholder="Unesite zanimljivi naslov..."
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
          <label htmlFor="content" className="form-label">
            Sadržaj priče
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className={`form-textarea ${errors.content ? "error" : ""}`}
            placeholder="Unesite sadržaj vaše priče..."
            disabled={loading}
            rows={15}
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
            <span className="checkbox-text">Odmah objavi</span>
          </label>
          <p className="checkbox-help">
            {formData.isPosted
              ? "Priča će biti vidljiva svim posjetiteljima"
              : "Priča će biti spremljena kao predložak"}
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && <div className="submit-error">{errors.submit}</div>}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/posts")}
            className="cancel-button"
            disabled={loading}
          >
            Odustani
          </button>

          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="draft-button"
            disabled={loading}
          >
            {loading ? "Spremanje..." : "Spremi kao predložak"}
          </button>

          <button
            type="submit"
            className={`submit-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading
              ? formData.isPosted
                ? "Objavljujem..."
                : "Kreiram..."
              : formData.isPosted
              ? "Objavi priču"
              : "Kreiraj priču"}
          </button>
        </div>
      </form>

      {/* Writing Tips */}
      <div className="writing-tips">
        <h3>Savjeti za pisanje</h3>
        <ul>
          <li>Započni naslovom koji će očarati posjetitelje</li>
          <li>
            Koristi kratke odlomke za bolju čitljivost - nemoj biti poput mene i
            pisati mail-ove od tisuću znakova 😎
          </li>
          <li>Uključi osobna iskustva i primjere</li>
          <li>Završi komentarom kako bi potaknuo raspravu</li>
          <li>Dvaput je dvaput - provjeri prije objave</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePost;