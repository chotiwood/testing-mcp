/**
 * BTItem — generic list item / row display molecule.
 * Figma: node 2056-48.
 *
 * Three container variants (default / outline / muted) with optional
 * left media (icon slot, avatar, image) and optional right content
 * (label, button, icon slot).
 */
import type { BTAvatarItem } from '@/components/ui/avatar/BTAvatar.types';

export type BTItemType = 'default' | 'outline' | 'muted';

export interface BTItemProps {
  /** Main title text. Required. */
  title: string;
  /** Optional subtitle / description text below the title. */
  description?: string;
  /** Container style variant. @default 'default' */
  type?: BTItemType;
  /** Avatar payload — renders BTAvatar size="sm" (32px) on the left. */
  leftAvatar?: BTAvatarItem;
  /** Image URL — renders 32×32 rounded image on the left. */
  leftImage?: string;
  /** Right side text label (text-secondary, 12px). Ignored when rightButton is set. */
  rightLabel?: string;
  /** Right side button label — renders BTButton outline small. Takes precedence over rightLabel. */
  rightButton?: string;
  /** 16×16 icon element rendered on the left (lowest left media precedence). */
  leftIcon?: React.ReactNode;
  /** 16×16 icon element rendered on the right side. */
  rightIcon?: React.ReactNode;
  /** Called when the right button is clicked. */
  onButtonClick?: () => void;
}
