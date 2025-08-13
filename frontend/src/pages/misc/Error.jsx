import { Link } from 'react-router-dom';

export default function Error() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="mb-8 text-lg text-gray-600">An unexpected error occurred. Please try again later.</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Home</Link>
    </div>
  );
} 