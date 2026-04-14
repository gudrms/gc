'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-zinc-900 text-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          MovieBook
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link
                href="/my-reservations"
                className="hover:text-zinc-300 transition-colors"
              >
                내 예매
              </Link>
              <span className="text-zinc-400">{user?.name}님</span>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-zinc-300 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="bg-white text-zinc-900 px-3 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
