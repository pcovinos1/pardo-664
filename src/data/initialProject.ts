import { defaultPointCategory } from "./locationContent";
import pardoLocations from "./pardoLocations.json";
import type { Gallery, Project, Typology } from "../types/project";
import heroFachada from "../assets/pdf-pages/hero-fachada.png";
import proyecto from "../assets/pdf-pages/proyecto.png";
import arquitecturaNomena from "../assets/pdf-pages/arquitectura-nomena.png";
import mapaBarrio from "../assets/pdf-pages/mapa-pardo664.svg";
import areasComunes from "../assets/pdf-pages/areas-comunes.png";
import interiores1 from "../assets/pdf-pages/interiores-1.png";
import interiores2 from "../assets/pdf-pages/interiores-2.png";
import interiores3 from "../assets/pdf-pages/interiores-3.png";
import fachadaDetalle from "../assets/pdf-pages/fachada-detalle.png";
import fichaProyecto from "../assets/pdf-pages/ficha-proyecto.png";
import pardoPlans from "./pardoPlans.json";

const today = "2026-06-02";
const planUrl = (path: string) => import.meta.env.BASE_URL + path;

const galleries: Gallery[] = [
  {
    id: "fachada",
    title: "Fachada",
    category: "fachada",
    images: [
      { id: "fachada-hero", title: "Pardo 664", src: heroFachada, category: "fachada" },
      { id: "fachada-detalle", title: "Frente urbano", src: fachadaDetalle, category: "fachada" },
      { id: "ficha-proyecto", title: "Ficha visual del proyecto", src: fichaProyecto, category: "fachada" }
    ]
  },
  {
    id: "proyecto-fachada",
    title: "Fachada y proyecto",
    category: "fachada",
    images: [
      { id: "proyecto-fachada-hero", title: "Fachada principal", src: heroFachada, category: "fachada" },
      { id: "proyecto-fachada-detalle", title: "Frente urbano", src: fachadaDetalle, category: "fachada" },
      { id: "proyecto-ficha", title: "Ficha visual del proyecto", src: fichaProyecto, category: "fachada" }
    ]
  },
  {
    id: "interiores",
    title: "Interiores",
    category: "interiores",
    images: [
      { id: "interior-1", title: "Interior referencial", src: interiores1, category: "interiores" },
      { id: "interior-2", title: "Ambientes del departamento", src: interiores2, category: "interiores" },
      { id: "interior-3", title: "Sala y comedor referencial", src: interiores3, category: "interiores" }
    ]
  },
  {
    id: "areas",
    title: "Áreas comunes",
    category: "areas",
    images: [{ id: "areas-1", title: "10 ambientes compartidos", src: areasComunes, category: "areas" }]
  },
  {
    id: "barrio",
    title: "Barrio",
    category: "barrio",
    images: [{ id: "barrio-1", title: "Mapa de puntos de interés", src: mapaBarrio, category: "barrio" }]
  },
  {
    id: "arquitectura",
    title: "Arquitectura",
    category: "arquitectura",
    images: [
      { id: "arquitectura-1", title: "Nómena Arquitectura", src: arquitecturaNomena, category: "arquitectura" },
      { id: "proyecto-1", title: "Pardo 664", src: proyecto, category: "arquitectura" }
    ]
  }
];

const aboutProjects = Array.from({ length: 13 }, (_, index) => {
  const districts = ["Miraflores", "San Isidro", "Barranco", "Surco"];
  const images = [heroFachada, fachadaDetalle, proyecto, arquitecturaNomena, fichaProyecto];
  return {
    id: `morada-project-${String(index + 1).padStart(2, "0")}`,
    name: `Proyecto ${String(index + 1).padStart(2, "0")}`,
    year: String(2020 + (index % 6)),
    district: districts[index % districts.length],
    imageSrc: images[index % images.length],
    order: index + 1
  };
});

const typologies: Typology[] = pardoPlans.typologies.map((typology) => ({
  ...typology,
  format: typology.format === "Duplex" ? "Duplex" : "Flat",
  planSrc: planUrl(typology.planSrc),
  thumbnailSrc: planUrl(typology.thumbnailSrc),
  floorThumbnailSrc: planUrl(typology.floorThumbnailSrc)
}));

export const initialProject: Project = {
  id: "pardo-664",
  name: "Pardo 664",
  developer: "Morada",
  logoText: "morada",
  logoSrc: "",
  tagline: "Un nuevo color llegó a Pardo.",
  shortDescription:
    "Proyecto diseñado por Nómena Arquitectura para Morada en la avenida José Pardo, Miraflores. Primer proyecto de Morada con certificación LEED.",
  district: "Miraflores",
  address: "Av. José Pardo 664",
  architect: "Nómena Arquitectura",
  certification: "LEED",
  status: "Lanzamiento",
  areaRange: pardoPlans.areaRange,
  typologySummary: "Flats y dúplex de 1, 2 y 3 dormitorios",
  sharedAreas: ["Lobby", "Sala de espera", "Coworking", "Gimnasio", "SUM", "Zona de parrillas", "Piscina", "Pet-wash", "Laundry-room", "Jardín"],
  leedAttributes: ["Paneles solares", "Luces con sensores de movimiento", "Estacionamientos para bicicletas", "Tratamiento y reutilización de aguas residuales"],
  about: {
    eyebrow: "Morada",
    title: "No hay lugar como tu Morada",
    subtitle: "Alta arquitectura peruana",
    coverImageSrc: "",
    slides: [
      {
        id: "about-01",
        number: "01",
        text: "Nacimos en el 2013 como una inmobiliaria boutique, comprometida con ofrecer el más alto estándar de arquitectura y servicio del sector inmobiliario en Lima.",
        keywords: ["boutique", "el más alto estándar de arquitectura y servicio del sector inmobiliario"],
        imageSrc: ""
      },
      {
        id: "about-02",
        number: "02",
        text: "Trabajamos con talentosos arquitectos, artistas urbanos, paisajistas y diseñadores para crear proyectos que transforman la ciudad. Hemos publicado un libro de arquitectura, renovado parques y veredas, y ganado dos premios nacionales de arquitectura.",
        keywords: ["arquitectos, artistas urbanos, paisajistas y diseñadores", "dos premios nacionales"],
        imageSrc: ""
      },
      {
        id: "about-03",
        number: "03",
        text: "El Perú, su gente, su historia, su legado y su arquitectura son nuestra continua fuente de inspiración.",
        keywords: ["arquitectura son nuestra continua fuente de inspiración"],
        imageSrc: ""
      }
    ],
    projects: aboutProjects
  },
  sections: [
    { id: "project", title: "El proyecto", summary: "Síntesis comercial del edificio y sus atributos.", order: 1, enabled: true },
    { id: "architecture", title: "Arquitectura", summary: "Diseño por Nómena Arquitectura.", order: 2, enabled: true },
    { id: "location", title: "Ubicación", summary: "Mapa ilustrado offline y puntos de interés.", order: 3, enabled: true },
    { id: "amenities", title: "Áreas comunes", summary: "Diez espacios compartidos.", order: 4, enabled: true },
    { id: "interiors", title: "Interiores", summary: "Renders y propuesta interior.", order: 5, enabled: true },
    { id: "departments", title: "Departamentos", summary: "Explorador, planta típica y planos.", order: 6, enabled: true },
    { id: "contact", title: "Contacto", summary: "Datos comerciales.", order: 7, enabled: true }
  ],
  galleries,
  floorPlan: {
    ...pardoPlans.floorPlan,
    imageSrc: planUrl(pardoPlans.floorPlan.imageSrc)
  },
  buildingPlans: pardoPlans.buildingPlans.map((plan) => ({
    ...plan,
    imageSrc: planUrl(plan.imageSrc)
  })),
  typologies,
  pointsOfInterest: (pardoLocations as Project["pointsOfInterest"]).map((point) => ({
    ...point, category: defaultPointCategory(point),
  })),
  version: {
    version: "1.0",
    publishedAt: today,
    changes: [
      { id: "c1", date: today, text: "Se cargó contenido inicial desde PARDO-SMART-JUNIO2026-v2.pdf." },
      { id: "planos-v10", date: pardoPlans.floorPlan.updatedAt, text: "Se incorporaron los planos finales V10 de Pardo 664." }
    ]
  },
  adminPin: "6640"
};
