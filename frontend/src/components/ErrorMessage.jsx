import React from 'react';

// Simple inline error message with icon + explicit label
export default function ErrorMessage({ children, message, variant = '', dataTestId }) {
  const text = message || children;
  const className = `inline-error ${variant}`.trim();

  return (
    <div role="alert" className={className} {...(dataTestId ? { ['data-testid']: dataTestId } : {})}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
        <path fill="none" d="M0 0h24v24H0z" />
      </svg>
      <span className="error-label">Error:</span>
      <span>{text}</span>
    </div>
  );
}
