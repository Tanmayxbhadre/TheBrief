interface AdSlotProps {
  id: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
}

/**
 * AdSlot — Reserved space for future Google AdSense integration.
 * Dimensions are fixed to prevent CLS (Cumulative Layout Shift).
 * To activate ads later, replace the placeholder content with the AdSense script.
 */
export default function AdSlot({ id, width, height, label = 'Advertisement', className }: AdSlotProps) {
  return (
    <div
      id={id}
      className={`ad-slot ${className ?? ''}`}
      style={{ width: '100%', maxWidth: width, height, margin: '0 auto' }}
      aria-label={label}
      role="complementary"
    >
      <span>{label}</span>
    </div>
  );
}
