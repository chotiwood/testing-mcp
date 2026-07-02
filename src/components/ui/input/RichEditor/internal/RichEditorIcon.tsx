/** Masked SVG icon — inherits `color` from parent (dark-mode safe). */
export interface RichEditorIconProps {
  src: string;
  alt?: string;
  size?: 16 | 24;
}

/** Normalize bundler asset imports and quote for CSS `url()`. */
function maskImageUrl(src: unknown): string | undefined {
  const url = typeof src === 'string' ? src : (src as { src?: string })?.src;
  if (!url) return undefined;
  // Data URLs contain commas; unquoted `url(data:image/svg+xml,...)` breaks parsing.
  return `url('${url.replace(/'/g, '%27')}')`;
}

export function RichEditorIcon({ src, alt, size = 16 }: RichEditorIconProps) {
  const mask = maskImageUrl(src);
  return (
    <span
      className={[
        'bt-input-rich-editor__masked-icon',
        size === 24 && 'bt-input-rich-editor__masked-icon--24',
      ].filter(Boolean).join(' ')}
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    />
  );
}
