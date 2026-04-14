'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reservationApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Reservation {
  id: string;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
  screening: {
    startTime: string;
    endTime: string;
    price: string;
    movie: { title: string };
    screen: { name: string };
  };
  seat: { row: string; number: number };
}

export default function MyReservationsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    reservationApi
      .findMine()
      .then(setReservations)
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  const handleCancel = async (id: string) => {
    if (!confirm('예매를 취소하시겠습니까?')) return;
    setCancelling(id);
    try {
      const updated = await reservationApi.cancel(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
    } catch (err: any) {
      alert(err.message || '취소에 실패했습니다.');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">내 예매 내역</h1>
      {reservations.length === 0 ? (
        <p className="text-zinc-500">예매 내역이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-lg shadow-sm border p-4 ${
                r.status === 'CANCELLED'
                  ? 'border-zinc-200 opacity-60'
                  : 'border-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {r.screening.movie.title}
                  </h3>
                  <div className="text-sm text-zinc-500 mt-1 space-y-0.5">
                    <p>
                      {new Date(r.screening.startTime).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p>
                      {r.screening.screen.name} | {r.seat.row}
                      {r.seat.number}번 좌석
                    </p>
                    <p>{Number(r.screening.price).toLocaleString()}원</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      r.status === 'CONFIRMED'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {r.status === 'CONFIRMED' ? '예매완료' : '취소됨'}
                  </span>
                  {r.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelling === r.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancelling === r.id ? '취소 중...' : '예매 취소'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
