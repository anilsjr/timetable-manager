/**
 * Loading spinner
 */
export default function Loader({ size = 'md' }) {
  const sizeClass = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  }[size];

  return (
    <div
      className={`${sizeClass} border-blue-600 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
