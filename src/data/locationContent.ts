import gastronomia from "../assets/miraflores/gastronomia.jpg";
import cultura from "../assets/miraflores/cultura.jpg";
import arquitectura from "../assets/miraflores/arquitectura.jpg";
import espacios from "../assets/miraflores/espacios.jpg";
import kennedy from "../assets/miraflores/kennedy.jpg";
import laLucha from "../assets/miraflores/la-lucha.jpg";
import mapaPardo from "../assets/pdf-pages/mapa-pardo664.svg";
import type { GalleryImage, LocationMapSettings, PointOfInterest, Project } from "../types/project";

const photos = [
  [
    "espacios",
    "Espacios abiertos",
    "Parque del Amor, malecón de Miraflores",
    espacios,
    "BBCLCD",
    "Parque_del_Amor2.jpg",
    "by-sa/4.0",
  ],
  [
    "gastronomia",
    "Gastronomía",
    "Maido, Miraflores",
    gastronomia,
    "Lindblom",
    "Maido,_Lima_-_8210534062.jpg",
    "by/2.0",
  ],
  [
    "cultura",
    "Arte y cultura",
    "Huaca Pucllana",
    cultura,
    "McKay Savage",
    "Huaca_Pucllana_Miraflores.jpg",
    "by/2.0",
  ],
  [
    "arquitectura",
    "Arquitectura",
    "Larcomar y el perfil urbano de Miraflores",
    arquitectura,
    "Juaniotolp",
    "Miraflores-Larcomar_Skyline_Lima,_Peru.jpg",
    "by-sa/3.0",
  ],
] as const;

const defaultPhotos: GalleryImage[] = photos.map(
  ([id, title, description, src, credit, source, license]) => ({
    id: `miraflores-${id}`,
    title,
    description,
    src,
    credit,
    category: "barrio",
    creditSource: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(source)}`,
    creditLicense: `https://creativecommons.org/licenses/${license}/`,
  }),
);

export const defaultMapCopy = {
  title: "Todo cerca de tu morada.",
  description:
    "Descubre Miraflores a través de su gastronomía, cultura, espacios verdes y lugares que forman parte del barrio.",
};

// Center at the foot of the building artwork in the original district map.
export const defaultProjectPosition = { x: 46.3, y: 36.5 };

export function getNeighborhood(project: Project) {
  const gallery = project.galleries.find((item) => item.id === "barrio");
  const legacyPhotos = gallery?.images.slice(1);
  return {
    story: project.locationStory ?? {
      title: "Miraflores es parte de nuestra esencia.",
      description:
        "Entre calles llenas de vida, propuestas gastronómicas y espacios frente al mar, descubre un distrito que siempre tiene algo nuevo por contar.",
      images: legacyPhotos?.length ? legacyPhotos : defaultPhotos,
    },
    mapCopy: project.locationMapCopy ?? defaultMapCopy,
    mapSrc: mapaPardo,
    settings: project.locationMap ?? defaultMapSettings,
    position: project.mapProjectPosition ?? defaultProjectPosition,
  };
}

export const locationCategories = [
  "Gastronomía", "Cafeterías", "Tiendas", "Espacios abiertos", "Otros",
] as const;

export const pointCategories: PointOfInterest["category"][] = [
  "Gastronomía", "Cafeterías", "Tiendas", "Cultura", "Parques",
  "Educación", "Entretenimiento", "Servicios",
];

const cafeIds = new Set([
  "poi-1", "poi-12", "poi-13", "poi-16", "poi-18", "poi-19", "poi-21", "poi-22",
  "poi-23", "poi-24", "poi-25", "570ee2e7-3aa9-41c2-a56e-54c4ae07c73f",
]);

export function placeCategory(point: PointOfInterest) {
  if (point.category === "Parques") return "Espacios abiertos";
  if (point.category === "Cultura") return "Arte y cultura";
  if (point.category === "Educación" || point.category === "Entretenimiento" || point.category === "Servicios") return "Otros";
  return point.category;
}

export function defaultPointCategory(point: PointOfInterest): PointOfInterest["category"] {
  return point.category === "Gastronomía" && cafeIds.has(point.id) ? "Cafeterías" : point.category;
}

const placePhotos: Record<string, Pick<GalleryImage, "src" | "credit" | "creditSource" | "creditLicense">> = {
  "poi-34": defaultPhotos[0],
  "poi-33": {
    src: kennedy,
    credit: "Municipalidad de Miraflores",
    creditSource: "https://commons.wikimedia.org/wiki/File:Parque_Kennedy.jpg",
    creditLicense: "https://creativecommons.org/licenses/by/2.0/",
  },
  "poi-8": {
    src: laLucha,
    credit: "Art DiNo",
    creditSource: "https://commons.wikimedia.org/wiki/File:La_Lucha_sangucher%C3%ADa_(2016).jpg",
    creditLicense: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
};

export function placePhoto(point: PointOfInterest): (typeof placePhotos)[string] | undefined {
  if (point.photoSrc === "") return undefined;
  if (point.photoSrc) return { src: point.photoSrc };
  return placePhotos[point.id];
}

export const defaultMapSettings: LocationMapSettings = {
  initialZoom: 1,
  floatingPhotos: [
    { pointId: "poi-34", x: 19, y: 82 },
    { pointId: "poi-33", x: 84, y: 70 },
    { pointId: "poi-8", x: 47, y: 69 },
  ],
};

const placeDescriptions: Record<string, string> = {
  "poi-1": "Cafetería y pastelería en Miraflores.",
  "poi-3": "Cervecería artesanal.",
  "poi-4": "Restaurante de cocina criolla peruana.",
  "poi-5": "Restaurante de cocina japonesa.",
  "poi-7": "Parrilla de tradición argentina.",
  "poi-8": "Sanguchería peruana en Miraflores.",
  "poi-10": "Restaurante de cocina nikkei.",
  "poi-12": "Cafetería y pastelería.",
  "poi-18": "Cafetería y panadería.",
  "poi-19": "Panadería de barrio.",
  "poi-22": "Panadería de barrio.",
  "poi-30": "Tienda por departamentos.",
  "poi-31": "Supermercado.",
  "poi-32": "Supermercado.",
  "poi-33": "Parque del centro de Miraflores, junto a la avenida Diagonal.",
  "poi-34": "Paseos y áreas verdes sobre los acantilados, con vistas al Pacífico.",
};

export function placeDescription(point: PointOfInterest) {
  return point.description ?? placeDescriptions[point.id] ?? "";
}
