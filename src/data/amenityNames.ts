import type { GalleryImage } from "../types/project";

// The published gallery has two photos named Lobby. The second is the lounge.
export function amenityName(image: GalleryImage): string {
  if (
    image.title === "Lobby" &&
    image.id === "f59399d0-336a-4f15-94bd-1a290df8342c"
  )
    return "Sala de espera";
  const names: Record<string, string> = {
    Gym: "Gimnasio",
    "Laundry Room": "Laundry room",
    "Jardin interior": "Jardín",
    "Pet-wash": "Pet wash",
  };
  return Object.prototype.hasOwnProperty.call(names, image.title)
    ? names[image.title]
    : image.title;
}

export function sameAmenity(a: string, b: string) {
  const key = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f\s-]/g, "")
      .toLowerCase();
  return key(a) === key(b);
}
