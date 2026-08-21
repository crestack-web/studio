"use client";

import React from "react";

// Minimal Field component definition for this file
type FieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  autoComplete?: string;
};

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  autoComplete,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {prefix && (
          <span style={{ fontSize: 13, color: "#8888A0", padding: "0 8px" }}>{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            borderRadius: 11,
            padding: "11px 14px",
            fontSize: 13,
            color: "#0A0A0F",
            background: "white",
            outline: "none",
            lineHeight: 1.55,
            fontFamily: "'DM Sans', sans-serif",
            border: "1.5px solid #E8E8F0",
            transition: "all 0.2s",
          }}
          onFocus={e => {
            e.target.style.borderColor = "#6B3FE7";
            e.target.style.boxShadow = "0 0 0 3px rgba(107,63,231,0.12)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "#E8E8F0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}

// Minimal SelectField component definition for this file
type SelectFieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
};

function SelectField({
  label,
  id,
  value,
  onChange,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          borderRadius: 11,
          padding: "11px 14px",
          fontSize: 13,
          color: value ? "#0A0A0F" : "#8888A0",
          background: "white",
          outline: "none",
          lineHeight: 1.55,
          fontFamily: "'DM Sans', sans-serif",
          border: "1.5px solid #E8E8F0",
          transition: "all 0.2s",
        }}
        onFocus={e => {
          e.target.style.borderColor = "#6B3FE7";
          e.target.style.boxShadow = "0 0 0 3px rgba(107,63,231,0.12)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#E8E8F0";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="" disabled>
          {placeholder || "Select an option"}
        </option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type PrimaryBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

function PrimaryBtn({ children, ...props }: PrimaryBtnProps) {
  return (
    <button
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: props.disabled ? "#E8E8F0" : "#6B3FE7",
        color: "white",
        fontWeight: 700,
        fontSize: 14,
        border: "none",
        borderRadius: 12,
        padding: "11px 18px",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        fontFamily: "'Sora', sans-serif",
        boxShadow: props.disabled
          ? "none"
          : "0 2px 8px rgba(107,63,231,0.10)",
        transition: "background 0.2s, box-shadow 0.2s, opacity 0.2s",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export { Field, SelectField, PrimaryBtn };
