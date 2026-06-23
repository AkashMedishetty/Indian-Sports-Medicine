/**
 * Device type breakpoint detection utility.
 *
 * Mobile:  width < 768
 * Laptop:  768 <= width <= 1366
 * Desktop: width > 1366
 */
export type DeviceType = 'mobile' | 'laptop' | 'desktop';

export function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width <= 1366) return 'laptop';
  return 'desktop';
}
