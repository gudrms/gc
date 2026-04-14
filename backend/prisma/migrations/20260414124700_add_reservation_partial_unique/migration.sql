-- CreateIndex
CREATE UNIQUE INDEX "reservation_screening_seat_confirmed"
ON "reservations" ("screening_id", "seat_id")
WHERE "status" = 'CONFIRMED';
