// Re-export the real implementation (explicit .tsx) to avoid circular aliasing
export { LoadingProvider, useLoading } from './LoadingContext.tsx';
export { default } from './LoadingContext.tsx';
