'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { screeningApi, reservationApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Seat {
  id: string;
  row: string;
  number: number;
  isReserved: boolean;
}

export default function SeatSelectionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    screeningApi
      .getSeats(id)
      .then(setSeats)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!selectedSeatId) return;

    setBooking(true);
    setError('');

    try {
      await reservationApi.create({ screeningId: id, seatId: selectedSeatId });
      router.push('/my-reservations');
    } catch (err: any) {
      setError(err.message || '예매에 실패했습니다.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">로딩 중...</p>
      </div>
    );
  }

  // 행별 그룹핑
  const rows = seats.reduce(
    (acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    },
    {} as Record<string, Seat[]>,
  );

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">좌석 선택</h1>
      <p className="text-sm text-zinc-500 mb-6">
        원하는 좌석을 선택 후 예매 버튼을 눌러주세요.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* 스크린 */}
      <div className="text-center mb-8">
        <div className="bg-zinc-300 text-zinc-600 text-xs py-1 rounded-sm mx-auto max-w-xs">
          SCREEN
        </div>
      </div>

      {/* 좌석 그리드 */}
      <div className="flex flex-col items-center gap-1 mb-8">
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-6 text-xs text-zinc-400 text-right mr-1">
              {row}
            </span>
            {rowSeats.map((seat) => (
              <button
                key={seat.id}
                disabled={seat.isReserved}
                onClick={() =>
                  setSelectedSeatId(
                    selectedSeatId === seat.id ? null : seat.id,
                  )
                }
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  seat.isReserved
                    ? 'bg-zinc-300 text-zinc-400 cursor-not-allowed'
                    : selectedSeatId === seat.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {seat.number}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 text-xs text-zinc-500 mb-8">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-zinc-100 rounded" />
          <span>선택 가능</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-zinc-900 rounded" />
          <span>선택됨</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-zinc-300 rounded" />
          <span>예매됨</span>
        </div>
      </div>

      {/* 예매 버튼 */}
      <div className="text-center">
        <button
          onClick={handleBook}
          disabled={!selectedSeatId || booking}
          className="bg-zinc-900 text-white px-8 py-3 rounded-md font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {booking
            ? '예매 중...'
            : selectedSeat
              ? `${selectedSeat.row}${selectedSeat.number} 예매하기`
              : '좌석을 선택해주세요'}
        </button>
      </div>
    </div>
  );
}
