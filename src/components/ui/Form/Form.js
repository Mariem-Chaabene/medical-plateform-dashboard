
import Input from '../Input/Input';
import './Form.css';

export default function Form({
  fields,         // array des champs [{name, label, type, defaultValue, ...}]
  values,         // data des valeurs du formulaire
  onChange,       // handler de modification
  onSubmit,       // handler submit final
  errors = {},    // {name: "message"}
  submitLabel = "Valider"
}) {
  return (
    <form className="form" onSubmit={e => {e.preventDefault(); onSubmit();}}>
      {fields.map(field => (
        <div className="form-group" key={field.name}>
          <label htmlFor={field.name} className="form-label">{field.label}</label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type || "text"}
            value={values[field.name] || ""}
            onChange={e => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || ""}
            {...(field.inputProps || {})}
          />
          {errors[field.name] && (
            <div className="form-error">{errors[field.name]}</div>
          )}
        </div>
      ))}
      <button type="submit" className="form-btn">{submitLabel}</button>
    </form>
  );
}
