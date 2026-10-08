/** Zero-padded station number ("0042"). Plain module so server pages and client cards can share it. */
export function formatStationNumber(n: number): string {
  return String(n).padStart(4, '0');
}
