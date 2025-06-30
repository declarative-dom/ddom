/**
 * Enhanced HTMLElementSpec with shadow DOM support
 */
declare module '../../../types/src' {
  interface HTMLElementSpec {
    shadowRootMode?: 'open' | 'closed';
  }
}