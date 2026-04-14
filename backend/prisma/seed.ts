import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 이미 시드 데이터가 있으면 중복 실행 방지
  const movieCount = await prisma.movie.count();
  if (movieCount > 0) {
    console.log('시드 데이터가 이미 존재합니다. 건너뜁니다.');
    return;
  }

  // 영화 데이터
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: '인터스텔라',
        description: '우주 탐험을 통해 인류의 생존을 모색하는 과학자들의 이야기',
        genre: 'SF',
        durationMinutes: 169,
        rating: '12세',
      },
    }),
    prisma.movie.create({
      data: {
        title: '범죄도시 4',
        description: '괴물형사 마석도의 신종 사이버 범죄 소탕 작전',
        genre: '액션',
        durationMinutes: 109,
        rating: '15세',
      },
    }),
    prisma.movie.create({
      data: {
        title: '인사이드 아웃 2',
        description: '라일리의 새로운 감정들과 함께하는 성장 이야기',
        genre: '애니메이션',
        durationMinutes: 96,
        rating: '전체',
      },
    }),
    prisma.movie.create({
      data: {
        title: '파묘',
        description: '미국 LA의 한 한인 가정에서 벌어지는 미스터리한 사건',
        genre: '미스터리',
        durationMinutes: 134,
        rating: '15세',
      },
    }),
    prisma.movie.create({
      data: {
        title: '듄: 파트 2',
        description: '아라키스 행성에서 펼쳐지는 폴 아트레이데스의 운명',
        genre: 'SF',
        durationMinutes: 166,
        rating: '12세',
      },
    }),
    prisma.movie.create({
      data: {
        title: '소년시절의 너',
        description: '학교 폭력에 맞서는 두 소년의 우정과 성장 이야기',
        genre: '드라마',
        durationMinutes: 135,
        rating: '15세',
      },
    }),
    prisma.movie.create({
      data: {
        title: '위키드',
        description: '오즈의 마법사 세계를 배경으로 한 뮤지컬 영화',
        genre: '뮤지컬',
        durationMinutes: 160,
        rating: '전체',
      },
    }),
  ]);

  // 상영관 데이터
  const screens = await Promise.all([
    prisma.screen.create({
      data: { name: '1관', totalSeats: 80 },
    }),
    prisma.screen.create({
      data: { name: '2관', totalSeats: 60 },
    }),
    prisma.screen.create({
      data: { name: '3관', totalSeats: 40 },
    }),
  ]);

  // 좌석 생성 함수
  const createSeats = async (screenId: string, rows: string[], seatsPerRow: number) => {
    const seatData: Prisma.SeatCreateManyInput[] = [];
    for (const row of rows) {
      for (let num = 1; num <= seatsPerRow; num++) {
        seatData.push({ screenId, row, number: num });
      }
    }
    await prisma.seat.createMany({ data: seatData });
  };

  // 1관: A~H행, 10석씩 = 80석
  await createSeats(screens[0].id, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], 10);
  // 2관: A~F행, 10석씩 = 60석
  await createSeats(screens[1].id, ['A', 'B', 'C', 'D', 'E', 'F'], 10);
  // 3관: A~D행, 10석씩 = 40석
  await createSeats(screens[2].id, ['A', 'B', 'C', 'D'], 10);

  // 상영 시간표 생성 (내일부터 3일간)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const screeningData: Prisma.ScreeningCreateManyInput[] = [];

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const day = new Date(tomorrow);
    day.setDate(day.getDate() + dayOffset);

    // 1관: 인터스텔라 (10:00, 14:00, 18:00)
    for (const hour of [10, 14, 18]) {
      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[0].durationMinutes);
      screeningData.push({
        movieId: movies[0].id,
        screenId: screens[0].id,
        startTime: start,
        endTime: end,
        price: 15000,
      });
    }

    // 2관: 범죄도시 4 (11:00, 15:00, 19:00)
    for (const hour of [11, 15, 19]) {
      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[1].durationMinutes);
      screeningData.push({
        movieId: movies[1].id,
        screenId: screens[1].id,
        startTime: start,
        endTime: end,
        price: 13000,
      });
    }

    // 3관: 인사이드 아웃 2 (10:30, 13:30, 16:30, 19:30)
    for (const hour of [10.5, 13.5, 16.5, 19.5]) {
      const start = new Date(day);
      start.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[2].durationMinutes);
      screeningData.push({
        movieId: movies[2].id,
        screenId: screens[2].id,
        startTime: start,
        endTime: end,
        price: 12000,
      });
    }

    // 1관 추가: 듄 파트2 (21:30)
    {
      const start = new Date(day);
      start.setHours(21, 30, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[4].durationMinutes);
      screeningData.push({
        movieId: movies[4].id,
        screenId: screens[0].id,
        startTime: start,
        endTime: end,
        price: 15000,
      });
    }

    // 2관 추가: 파묘 (21:30)
    {
      const start = new Date(day);
      start.setHours(21, 30, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[3].durationMinutes);
      screeningData.push({
        movieId: movies[3].id,
        screenId: screens[1].id,
        startTime: start,
        endTime: end,
        price: 14000,
      });
    }

    // 3관 추가: 소년시절의 너 (22:00)
    {
      const start = new Date(day);
      start.setHours(22, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[5].durationMinutes);
      screeningData.push({
        movieId: movies[5].id,
        screenId: screens[2].id,
        startTime: start,
        endTime: end,
        price: 13000,
      });
    }

    // 1관 추가: 위키드 (09:00 조조)
    {
      const start = new Date(day);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + movies[6].durationMinutes);
      screeningData.push({
        movieId: movies[6].id,
        screenId: screens[0].id,
        startTime: start,
        endTime: end,
        price: 10000,
      });
    }
  }

  await prisma.screening.createMany({ data: screeningData });

  console.log('시드 데이터 생성 완료!');
  console.log(`영화: ${movies.length}편`);
  console.log(`상영관: ${screens.length}개`);
  console.log(`상영 시간표: ${screeningData.length}개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
