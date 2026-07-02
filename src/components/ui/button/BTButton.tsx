/**
 * BTButton — interactive action atom.
 * Figma source: node 114:2645.
 *
 * @example
 * ```tsx
 * // Primary (default)
 * <BTButton label="Save" onClick={handleSave} />
 *
 * // With left icon
 * <BTButton label="Upload" variant="secondary-light" leftIcon={<UploadIcon />} />
 *
 * // Icon only
 * <BTButton iconOnly variant="ghost" onClick={handleClose}>
 *   <CloseIcon />
 * </BTButton>
 *
 * // Disabled
 * <BTButton label="Submit" disabled />
 * ```
 */
import { forwardRef } from 'react';
import '@/components/ui/button/BTButton.css';
import type { BTButtonProps } from '@/components/ui/button/BTButton.types';

const BTButton = forwardRef<HTMLButtonElement, BTButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      disabled = false,
      iconOnly = false,
      label,
      leftIcon,
      rightIcon,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const cls = [
      'bt-button',
      `bt-button--${variant}`,
      size === 'small' ? 'bt-button--small' : '',
      iconOnly ? 'bt-button--icon-only' : '',
      iconOnly && (leftIcon || rightIcon) ? 'bt-button--has-addon' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} type={rest.type ?? 'button'} className={cls} disabled={disabled} data-testid="bt-button" {...rest}>
        {iconOnly ? (
          <>
            {children}
            {rightIcon}
          </>
        ) : (
          <>
            {leftIcon}
            {label && <span className="bt-button__label">{label}</span>}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

BTButton.displayName = 'BTButton';

export { BTButton };
