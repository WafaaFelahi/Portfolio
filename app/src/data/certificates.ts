export type Certificate = {
  name: string
  issuer: string
  year?: string
  url: string // verification link (Credly, Coursera, AWS, etc.)
}

/**
 * Shown beneath the bloomed lotus in Stage 3. While this list is empty the
 * row is hidden, so nothing unfinished ever reaches the live site.
 *
 * Example:
 * { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2025', url: 'https://www.credly.com/badges/…' },
 */
export const certificates: Certificate[] = []
