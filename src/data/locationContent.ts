import gastronomia from "../assets/miraflores/gastronomia.jpg";
import cultura from "../assets/miraflores/cultura.jpg";
import arquitectura from "../assets/miraflores/arquitectura.jpg";
import espacios from "../assets/miraflores/espacios.jpg";
import type { GalleryImage, Project } from "../types/project";

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
    "Descubre los espacios, lugares y experiencias que forman parte de Miraflores.",
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
    mapSrc: gallery?.images[0]?.src,
    position: project.mapProjectPosition ?? defaultProjectPosition,
  };
}
