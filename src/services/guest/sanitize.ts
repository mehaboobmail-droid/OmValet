import type { Car, GuestCar } from "@/types/domain";

/**
 * Strip everything a guest must not see (OTP, phone, valet identifiers,
 * internal notes) before a car record leaves the server.
 */
export function toGuestCar(car: Car): GuestCar {
  return {
    id: car.id,
    plate: car.plate,
    make: car.make,
    model: car.model,
    color: car.color,
    guest: car.guest,
    room: car.room,
    slot: car.slot,
    time: car.time,
    status: car.status,
    scheduledTime: car.scheduledTime,
  };
}
