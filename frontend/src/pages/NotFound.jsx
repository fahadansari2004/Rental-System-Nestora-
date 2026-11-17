import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-8xl font-black text-indigo-600/30">404</span>
      <h1 className="text-3xl font-black text-slate-900 -mt-6 mb-2">
        Stay or Page Not Found
      </h1>
      <p className="text-slate-500 text-sm max-w-md mb-8">
        The destination you are looking for might have been moved, renamed, or is temporarily unavailable.
      </p>

      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline" size="md" icon={Home}>
            Home
          </Button>
        </Link>
        <Link to="/explore">
          <Button variant="primary" size="md" icon={Compass}>
            Explore Stays
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

