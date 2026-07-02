import * as React from 'react';

interface BTInputAnimatedLabelProps {
  label: string;
  required?: boolean;
  /** Override the root class. Defaults to 'bt-input__label'. */
  className?: string;
  /** Override the required-asterisk class. Defaults to 'bt-input__label-required'. */
  requiredClassName?: string;
}

export const BTInputAnimatedLabel: React.FC<BTInputAnimatedLabelProps> = ({
  label,
  required = false,
  className = 'bt-input__label',
  requiredClassName = 'bt-input__label-required',
}) => (
  <label className={className}>
    {label}
    {required && <span className={requiredClassName}>*</span>}
  </label>
);

BTInputAnimatedLabel.displayName = 'BTInputAnimatedLabel';
