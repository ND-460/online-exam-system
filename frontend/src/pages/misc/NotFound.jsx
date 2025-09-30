import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <h1 className="text-6xl font-bold text-blue-700 mb-4">404</h1>
      <p className="mb-8 text-lg text-gray-600">Page Not Found</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Home</Link>
    </div>
  );
} 