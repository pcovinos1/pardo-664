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
  pointsOfInterest: [
    { id: "poi-1", name: "Dolce Capriccio", category: "Gastronomía", x: 22, y: 43, visible: true, order: 1 },
    { id: "poi-2", name: "Xoma", category: "Gastronomía", x: 31, y: 38, visible: true, order: 2 },
    { id: "poi-3", name: "Cervecería del Valle", category: "Gastronomía", x: 58, y: 31, visible: true, order: 3 },
    { id: "poi-4", name: "Panchita", category: "Gastronomía", x: 72, y: 39, visible: true, order: 4 },
    { id: "poi-5", name: "Matsuei", category: "Gastronomía", x: 72, y: 46, visible: true, order: 5 },
    { id: "poi-6", name: "La Gloria", category: "Gastronomía", x: 76, y: 39, visible: true, order: 6 },
    { id: "poi-7", name: "La Cabrera", category: "Gastronomía", x: 80, y: 39, visible: true, order: 7 },
    { id: "poi-8", name: "La Lucha Sanguchería", category: "Gastronomía", x: 40, y: 35, visible: true, order: 8 },
    { id: "poi-9", name: "Tori", category: "Gastronomía", x: 22, y: 27, visible: true, order: 9 },
    { id: "poi-10", name: "Tomo Cocina Nikkei", category: "Gastronomía", x: 86, y: 41, visible: true, order: 10 },
    { id: "poi-11", name: "La Cantina di Epicuro", category: "Gastronomía", x: 50, y: 47, visible: true, order: 11 },
    { id: "poi-12", name: "La Mora", category: "Gastronomía", x: 67, y: 72, visible: true, order: 12 },
    { id: "poi-13", name: "Rutina Café", category: "Gastronomía", x: 76, y: 69, visible: true, order: 13 },
    { id: "poi-14", name: "Edo", category: "Gastronomía", x: 44, y: 52, visible: true, order: 14 },
    { id: "poi-15", name: "Punto Azul", category: "Gastronomía", x: 42, y: 58, visible: true, order: 15 },
    { id: "poi-16", name: "Mariaté", category: "Gastronomía", x: 55, y: 13, visible: true, order: 16 },
    { id: "poi-17", name: "La Porteña", category: "Gastronomía", x: 40, y: 29, visible: true, order: 17 },
    { id: "poi-18", name: "Latte Bakery", category: "Gastronomía", x: 42, y: 27, visible: true, order: 18 },
    { id: "poi-19", name: "Panadería Cultivo", category: "Gastronomía", x: 42, y: 34, visible: true, order: 19 },
    { id: "poi-20", name: "Mattoni", category: "Gastronomía", x: 16, y: 25, visible: true, order: 20 },
    { id: "poi-21", name: "Punto Café", category: "Gastronomía", x: 18, y: 25, visible: true, order: 21 },
    { id: "poi-22", name: "La Negra Panadería de Barrio", category: "Gastronomía", x: 16, y: 28, visible: true, order: 22 },
    { id: "poi-23", name: "La Caffetteria di Lonato", category: "Gastronomía", x: 17, y: 21, visible: true, order: 23 },
    { id: "poi-24", name: "Café de Lima", category: "Gastronomía", x: 27, y: 9, visible: true, order: 24 },
    { id: "poi-25", name: "Raw Café", category: "Gastronomía", x: 68, y: 9, visible: true, order: 25 },
    { id: "poi-26", name: "Colegio San Silvestre", category: "Educación", x: 18, y: 20, visible: true, order: 26 },
    { id: "poi-27", name: "Colegio Inmaculado Corazón", category: "Educación", x: 28, y: 9, visible: true, order: 27 },
    { id: "poi-28", name: "Colegio Mater Purissima", category: "Educación", x: 24, y: 55, visible: true, order: 28 },
    { id: "poi-29", name: "Universidad de Piura", category: "Educación", x: 73, y: 48, visible: true, order: 29 },
    { id: "poi-30", name: "Falabella", category: "Tiendas", x: 81, y: 43, visible: true, order: 30 },
    { id: "poi-31", name: "Wong", category: "Tiendas", x: 67, y: 55, visible: true, order: 31 },
    { id: "poi-32", name: "Metro", category: "Tiendas", x: 68, y: 55, visible: true, order: 32 },
    { id: "poi-33", name: "Kennedy", category: "Parques", x: 78, y: 55, visible: true, order: 33 },
    { id: "poi-34", name: "Malecón de Miraflores", category: "Parques", x: 41, y: 75, visible: true, order: 34 },
    { id: "poi-35", name: "El Principito", category: "Parques", x: 12, y: 67, visible: true, order: 35 },
    { id: "poi-36", name: "Manuel Solari Swayne", category: "Parques", x: 67, y: 14, visible: true, order: 36 }
  ],
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
