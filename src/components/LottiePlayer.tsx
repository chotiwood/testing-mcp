import { useEffect, useRef, type CSSProperties } from 'react';
import lottie from 'lottie-web';

interface LottiePlayerProps {
  /** Parsed Lottie JSON animation data. */
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: CSSProperties;
  role?: string;
  'aria-label'?: string;
}

/**
 * Minimal Lottie renderer built directly on `lottie-web` (the engine that
 * `lottie-react` itself wraps). Bypasses `lottie-react`'s bundled UMD build,
 * which resolves incorrectly under Vite's dependency pre-bundling.
 */
export function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
  role,
  'aria-label': ariaLabel,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData,
    });

    return () => animation.destroy();
  }, [animationData, loop, autoplay]);

  return <div ref={containerRef} className={className} style={style} role={role} aria-label={ariaLabel} />;
}
