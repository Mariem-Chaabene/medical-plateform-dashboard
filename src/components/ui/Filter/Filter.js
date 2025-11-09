import { useState } from "react";
import Input from '../Input/Input'; 


export default function Filter({
  placeholder = "Quick search...",
  onFilter,
  filterValue = ""
}) {
  const [value, setValue] = useState(filterValue);

  const handleInput = e => {
    setValue(e.target.value);
    if (onFilter) onFilter(e.target.value);
  };

  return (
      <Input
        type="text"
        style = {{ width:"100%" }}
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
      />
  );
}
