'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { movieApi } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  durationMinutes: number;
  rating: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieApi.findAll().then(setMovies).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">현재 상영작</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.id}`}
            className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="bg-zinc-800 h-48 flex items-center justify-center">
              <span className="text-4xl text-zinc-500">🎬</span>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-1">{movie.title}</h2>
              <p className="text-sm text-zinc-500 mb-2 line-clamp-2">
                {movie.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="bg-zinc-100 px-2 py-0.5 rounded">
                  {movie.genre}
                </span>
                <span>{movie.durationMinutes}분</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {movie.rating}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
