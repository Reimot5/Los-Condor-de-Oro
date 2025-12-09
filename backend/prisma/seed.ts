import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Crear estado inicial del evento
  let eventState = await prisma.eventState.findFirst();
  if (!eventState) {
    eventState = await prisma.eventState.create({
      data: {
        id: "1",
        state: "SETUP",
      },
    });
    console.log("✅ Estado del evento creado:", eventState.state);
  } else {
    console.log("ℹ️  Estado del evento ya existe:", eventState.state);
  }

  // Crear categorías
  const categories = [
    {
      name: "Mejor Comandante",
      short_description:
        "Liderazgo general, coordinación y toma de decisiones estratégicas.",
      order: 1,
      is_active: true,
    },
    {
      name: "Mejor Oficial",
      short_description:
        "Mejor líder de escuadra en comunicación, táctica y control del grupo.",
      order: 2,
      is_active: true,
    },
    {
      name: "Mejor Comandante de Tanques",
      short_description:
        "Coordinación de su unidad, posicionamiento estratégico y decisiones dentro del tanque.",
      order: 3,
      is_active: true,
    },
    {
      name: "Mejor Tripulante de Tanque",
      short_description:
        "Habilidad en conducción, artillería, apoyo a la infantería y efectividad general del tanque.",
      order: 4,
      is_active: true,
    },
    {
      name: "Mejor Oteador",
      short_description:
        "Mejor proveedor de información, spotting, visión del mapa y posicionamiento.",
      order: 5,
      is_active: true,
    },
    {
      name: "Mejor AT",
      short_description:
        "Jugador más efectivo en destrucción de blindados y control anti-tanque.",
      order: 6,
      is_active: true,
    },
    {
      name: "Mejor MG",
      short_description:
        "Dominio de líneas, supresión y apoyo a la infantería.",
      order: 7,
      is_active: true,
    },
    {
      name: "Mejor Infantería Común",
      short_description:
        "Jugador más completo en los roles estándar del núcleo de infantería.",
      order: 8,
      is_active: true,
    },
    {
      name: "Mejor Killer",
      short_description:
        "Mayor impacto letal, jugadas decisivas y consistencia ofensiva.",
      order: 9,
      is_active: true,
    },
    {
      name: "Mejor Artillería",
      short_description:
        "Precisión, eficiencia y aporte táctico desde artillería/morteros.",
      order: 10,
      is_active: true,
    },
    {
      name: "Revelación del Año (Enero-Junio)",
      short_description:
        "Jugador con mayor crecimiento y mejora notoria en ese periodo.",
      order: 11,
      is_active: true,
    },
    {
      name: "Revelación del Año (Junio-Diciembre)",
      short_description:
        "Jugador con mayor crecimiento en la segunda mitad del año.",
      order: 12,
      is_active: true,
    },
    {
      name: "Jugador Más Disciplinado",
      short_description:
        "Conducta ejemplar, orden, puntualidad y cumplimiento de roles.",
      order: 13,
      is_active: true,
    },
    {
      name: "Jugador Más Activo en Eventos",
      short_description:
        "Mayor asistencia, compromiso y constancia en actividades del clan.",
      order: 14,
      is_active: true,
    },
    {
      name: "Mejor Sniping",
      short_description:
        "Precisión, posicionamiento y efectividad como sniper/spotter.",
      order: 15,
      is_active: true,
    },
    {
      name: "Mejor Jugada del Año",
      short_description: "La acción más épica, decisiva o memorable del año.",
      order: 16,
      is_active: true,
    },
    {
      name: "Estratega del Año",
      short_description:
        "Mejor lectura del mapa, anticipación táctica y planificación estratégica.",
      order: 17,
      is_active: true,
    },
    {
      name: "Legionario del Año",
      short_description:
        "Máxima distinción: aporte global, actitud, compromiso y constancia.",
      order: 18,
      is_active: true,
    },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });
    if (!existing) {
      const category = await prisma.category.create({
        data: cat,
      });
      console.log("✅ Categoría creada:", category.name);
    } else {
      console.log("ℹ️  Categoría ya existe:", cat.name);
    }
  }

  // Crear códigos de ejemplo
  const codes = [
    "CONDOR001",
    "CONDOR002",
    "CONDOR003",
    "CONDOR004",
    "CONDOR005",
    "CONDOR006",
    "CONDOR007",
    "CONDOR008",
    "CONDOR009",
    "CONDOR010",
  ];

  let createdCodes = 0;
  for (const code of codes) {
    const existing = await prisma.memberCode.findUnique({
      where: { code },
    });
    if (!existing) {
      await prisma.memberCode.create({
        data: {
          code,
          used_in_nomination: false,
          used_in_voting: false,
        },
      });
      createdCodes++;
    }
  }
  console.log(
    `✅ ${createdCodes} códigos de ejemplo creados (${
      codes.length - createdCodes
    } ya existían)`
  );

  console.log("🎉 Seed completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
