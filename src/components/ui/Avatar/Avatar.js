import "./Avatar.css";

export default function Avatar({ src, size = 34, alt = "Avatar", onClick }) {
  return (
    <button
      className="avatar-btn"
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label="Ouvrir le menu profil"
      type="button"
    >
      <img
        src={src}
        alt={alt}
        className="avatar-img"
        style={{ width: size, height: size }}
      />
    </button>
  );
}
