import './Button.css';

export default function Button({ children, loading, ...props }) {
  return (
    <button
      className="custom-btn"
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : null}
      {children}
    </button>
  );
}
