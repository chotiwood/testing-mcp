/**
 * BTLoading — multi-type loading indicator atom.
 * Mirrors @btech/ui-vue BTLoading one-to-one (same props, same logic).
 * Figma: node 3227:400.
 *
 * ## Usage:
 * ```tsx
 * // Default spinner
 * <BTLoading />
 *
 * // Pulse animation
 * <BTLoading type="pulse" />
 *
 * // Skeleton shimmer block
 * <BTLoading type="skeleton" width={200} />
 *
 * // Skeleton with custom height
 * <BTLoading type="skeleton" width={200} height={80} />
 *
 * // Indeterminate progress bar
 * <BTLoading type="progressbar" />
 *
 * // Determinate 60%
 * <BTLoading type="progressbar" value={0.6} />
 *
 * // BTech logo animation
 * <BTLoading type="logo" size={64} />
 * ```
 */
import * as React from "react";
import { LottiePlayer } from "@/components/LottiePlayer";
import "./BTLoading.css";
import type { BTLoadingProps } from "./BTLoading.types";
import spinnerData from "@btech/assets/anim/load-spin-anim.json";
import spinnerDataDark from "@btech/assets/anim/load-spin-anim-dark.json";
import pulseData from "@btech/assets/anim/load-pulse-anim.json";
import pulseDataDark from "@btech/assets/anim/load-pulse-anim-dark.json";
import logoData from "@btech/assets/anim/load-btech-anim.json";

/** Multi-type loading indicator. See file header for usage. */
export const BTLoading = React.forwardRef<HTMLDivElement, BTLoadingProps>(
  (
    {
      type = "spinner",
      color,
      value,
      size = 48,
      width = "100%",
      height = "40px",
      ...rest
    },
    ref,
  ) => {
    const isLottie = type === "spinner" || type === "pulse" || type === "logo";
    const isThemedLottie = type === "spinner" || type === "pulse";
    const isSkeleton = type === "skeleton";
    const isProgressbar = type === "progressbar";
    const isIndeterminate = isProgressbar && value === undefined;

    // Clamp value to [0, 1] to keep aria-valuenow valid
    const clampedValue =
      value !== undefined ? Math.min(1, Math.max(0, value)) : undefined;

    const themedLottieLight =
      type === "spinner" ? spinnerData :
      type === "pulse"   ? pulseData :
      null;

    const themedLottieDark =
      type === "spinner" ? spinnerDataDark :
      type === "pulse"   ? pulseDataDark :
      null;

    const animationData = type === "logo" ? logoData : null;

    // Lottie: spinner & pulse (theme-aware), logo
    if (isLottie && isThemedLottie && themedLottieLight && themedLottieDark) {
      return (
        <div
          role="status"
          aria-label="Loading"
          className="bt-loading--lottie-themed"
          style={{ width: size, height: size }}
        >
          <LottiePlayer
            animationData={themedLottieLight}
            className="bt-loading--lottie bt-loading--lottie--light"
            style={{ width: size, height: size }}
            loop
            autoplay
          />
          <LottiePlayer
            animationData={themedLottieDark}
            className="bt-loading--lottie bt-loading--lottie--dark"
            style={{ width: size, height: size }}
            loop
            autoplay
          />
        </div>
      );
    }

    if (isLottie && animationData) {
      return (
        <LottiePlayer
          role="status"
          aria-label="Loading"
          animationData={animationData}
          className="bt-loading--lottie"
          style={{ width: size, height: size }}
          loop
          autoplay
        />
      );
    }

    // Skeleton shimmer block
    if (isSkeleton) {
      return (
        <div
          role="status"
          aria-label="Loading"
          {...rest}
          ref={ref}
          className={["bt-loading--skeleton", rest.className]
            .filter(Boolean)
            .join(" ")}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            ...rest.style,
          }}
        />
      );
    }

    // Progress bar
    if (isProgressbar) {
      const colorStyle = color
        ? ({ "--bt-loading-color": color } as React.CSSProperties)
        : undefined;

      return (
        <div
          role="progressbar"
          aria-valuenow={
            clampedValue !== undefined
              ? Math.round(clampedValue * 100)
              : undefined
          }
          aria-valuemin={0}
          aria-valuemax={100}
          {...rest}
          ref={ref}
          className={["bt-loading--progressbar", rest.className]
            .filter(Boolean)
            .join(" ")}
          style={colorStyle ? { ...colorStyle, ...rest.style } : rest.style}
        >
          <div
            className={
              "bt-loading__progressbar-bar" +
              (isIndeterminate
                ? " bt-loading__progressbar-bar--indeterminate"
                : "")
            }
            style={
              !isIndeterminate && clampedValue !== undefined
                ? { width: `${clampedValue * 100}%` }
                : undefined
            }
          />
        </div>
      );
    }

    return null;
  },
);

BTLoading.displayName = "BTLoading";
