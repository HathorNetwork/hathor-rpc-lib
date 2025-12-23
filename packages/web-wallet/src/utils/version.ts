/**
 * Compare semantic versions (major.minor.patch)
 * Returns:
 *  - negative if v1 < v2
 *  - 0 if v1 === v2
 *  - positive if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 !== part2) {
      return part1 - part2;
    }
  }

  return 0;
}

/**
 * Check if installed version meets the minimum required version
 */
export function isVersionSupported(installedVersion: string, minVersion: string): boolean {
  return compareVersions(installedVersion, minVersion) >= 0;
}
