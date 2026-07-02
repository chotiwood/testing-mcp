'use client';
/**
 * BTTagGroup — layout wrapper for a list of BTTag items.
 * Figma source: node 3050-6644.
 *
 * ## Usage:
 * ```tsx
 * const [tags, setTags] = useState([
 *   { id: '1', label: 'Flutter' },
 *   { id: '2', label: 'React' },
 * ]);
 *
 * <BTTagGroup
 *   items={tags}
 *   type="wrap"
 *   spacing="loose"
 *   onRemove={(item, index) =>
 *     setTags(t => t.filter((_, i) => i !== index))
 *   }
 * />
 * ```
 */
import * as React from 'react';
import type { BTTagGroupProps } from '@/components/ui/tag/BTTag.types';
import { BTTag } from '@/components/ui/tag/BTTag';

export const BTTagGroup = React.forwardRef<HTMLDivElement, BTTagGroupProps>(
  (
    {
      items,
      variant = 'default',
      spacing = 'default',
      type = 'scroll',
      onRemove,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'bt-tag-group',
      `bt-tag-group--${type}`,
      `bt-tag-group--gap-${spacing}`,
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} data-testid="bt-tag-group" {...rest}>
        {items.map((item, index) => (
          <BTTag
            key={item.id ?? item.label}
            label={item.label}
            variant={variant}
            onRemove={onRemove ? () => onRemove(item, index) : undefined}
          />
        ))}
      </div>
    );
  },
);

BTTagGroup.displayName = 'BTTagGroup';
