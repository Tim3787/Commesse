import React from "react";

function DateInput({ label, value, onChange }) {
  return (
    <div>
      <label>{label}:</label>
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default DateInput;
