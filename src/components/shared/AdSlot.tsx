interface AdSlotProps {
  id: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
}

/**
 * AdSlot — Reserved space for future Google AdSense integration.
 * Uses max-height rather than fixed height so the slot collapses
 * gracefully when no ad is loaded, preventing giant blank voids.
 * To activate ads later, replace the placeholder content with the AdSense script.
 */
export default function AdSlot({ id, width, height, label = 'Advertisement', className }: AdSlotProps) {
  const clampedHeight = Math.min(height, 90); // Never taller than a leaderboard
  return (
    <div
      id={id}
      className={`ad-slot ${className ?? ''}`}
      style={{
        width: '100%',
        maxWidth: width,
        maxHeight: clampedHeight,
        height: clampedHeight,
        margin: '0 auto',
      }}
      aria-label={label}
      role="complementary"
    >
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
