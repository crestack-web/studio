'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a 
          href="/welcome"
          className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
}
