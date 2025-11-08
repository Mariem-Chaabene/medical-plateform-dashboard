import './Input.css';

export default function Input({ type = "text", ...props }) {
  return (
    <input
      className="custom-input"
      type={type}
      {...props}
    />
  );
}
