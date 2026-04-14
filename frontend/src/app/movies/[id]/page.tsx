'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { movieApi, screeningApi } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  durationMinutes: number;
  rating: string;
}

interface Screening {
  id: string;
  startTime: string;
  endTime: string;
  price: string;
  screen: { id: string; name: string };
}

export default function MovieDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([movieApi.findOne(id), screeningApi.findByMovie(id)])
      .then(([m, s]) => {
        setMovie(m);
        setScreenings(s);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">로딩 중...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-zinc-500">영화를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 날짜별 그룹핑
  const grouped = screenings.reduce(
    (acc, s) => {
      const date = new Date(s.startTime).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(s);
      return acc;
    },
    {} as Record<string, Screening[]>,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-8">
        <div className="flex gap-6">
          <div className="bg-zinc-800 w-32 h-44 rounded-md flex items-center justify-center shrink-0">
            <span className="text-4xl">🎬</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
            <p className="text-zinc-600 mb-3">{movie.description}</p>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <span className="bg-zinc-100 px-2 py-0.5 rounded">
                {movie.genre}
              </span>
              <span>{movie.durationMinutes}분</span>
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                {movie.rating}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">상영 시간표</h2>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-zinc-500">등록된 상영 시간이 없습니다.</p>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">
              {date}
            </h3>
            <div className="flex flex-wrap gap-3">
              {items.map((s) => (
                <Link
                  key={s.id}
                  href={`/screenings/${s.id}`}
                  className="bg-white border border-zinc-200 rounded-md px-4 py-3 hover:border-zinc-400 transition-colors"
                >
                  <p className="font-semibold">
                    {new Date(s.startTime).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {s.screen.name} |{' '}
                    {Number(s.price).toLocaleString()}원
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
