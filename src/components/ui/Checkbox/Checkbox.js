export default function Checkbox({ checked, onChange, id, style = {}, ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      id={id}
      style={{
        width: 20,
        height: 20,
        accentColor: "#48c6ef",
        cursor: "pointer"
      }}
      {...props}
    />
  );
}
