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
        "Comandante que destaca por coordinación, toma de decisiones estratégicas, manejo de logística, buena lectura de mapa y capacidad de sostener la defensa durante las partidas.",
      order: 1,
      is_active: true,
    },
    {
      name: "Mejor Oficial",
      short_description:
        "Líder de escuadra que destacó por comunicación clara, colocación eficiente de OPs y lectura del mapa. Aquel que supo cuándo atacar, cuándo frenar y cuándo rotar. Capaz de adaptarse a circunstancias difíciles durante la partida.",
      order: 2,
      is_active: true,
    },
    {
      name: "Mejor Infantería",
      short_description:
        "Soldado mas completo. Sigue ordenes, sabe cuando cambiar de rol y los utiliza con efectividad, sabe posicionarse y tiene lectura de mapa.",
      order: 3,
      is_active: true,
    },
    {
      name: "Mejor MG",
      short_description:
        "Jugador con domino en supresión y control de líneas, aquel capaz de posicionarse en lugares clave con gran impacto en las partidas.",
      order: 4,
      is_active: true,
    },
    {
      name: "Mejor AT",
      short_description:
        "Jugador más efectivo en la destrucción de tanques, garrys y OPs con armas antitanque. Activo en la planificación de AT sniping.",
      order: 5,
      is_active: true,
    },
    {
      name: "Mejor Oficial de Reconocimiento",
      short_description:
        "Mejor proveedor de información a través de bengalas. Sabe cuando y donde lanzar bengalas, capaz de mantener y dar soporte a las combinas y defensa.",
      order: 6,
      is_active: true,
    },
    {
      name: "Mejor Artillero",
      short_description:
        "Precisión, eficiencia y aporte táctico desde artillería.",
      order: 7,
      is_active: true,
    },
    {
      name: "Mejor Comandante de Tanque",
      short_description:
        "Comandante que destaco por buena lectura del terreno y mapa, elección de tácticas adecuadas, coordinación con infantería y decisiones que mantuvieron el tanque vivo y con gran impacto durante las partidas.",
      order: 8,
      is_active: true,
    },
    {
      name: "Mejor Tripulante de Tanque",
      short_description:
        "Tripulante con dominio en conducción, disparos, reacción, seguimiento de ordenes y efectividad general del tanque.",
      order: 9,
      is_active: true,
    },
    {
      name: "Mejor Estratega",
      short_description:
        "Reconocimiento a quien entiende la partida antes de que empiece. Jugador que analiza el mapa, anticipa escenarios y define el plan general del equipo.",
      order: 10,
      is_active: true,
    },
    {
      name: "Revelación del Año (Enero-Junio)",
      short_description:
        "Jugador que nadie tenia en el radar pero termino siendo imposible de ignorar. Aquel con crecimiento acelerado en la primera mitad del año.",
      order: 11,
      is_active: true,
    },
    {
      name: "Revelación del Año (Junio-Diciembre)",
      short_description:
        "Jugador que nadie tenia en el radar pero termino siendo imposible de ignorar. Aquel con crecimiento acelerado en la segunda mitad del año.",
      order: 12,
      is_active: true,
    },
    {
      name: "Recluta eterno",
      short_description:
        "Homenaje a la persona que desafía o desafió los ascensos partida tras partida de manera eterna. Jugador que esta o estuvo mas tiempo como recluta.",
      order: 13,
      is_active: true,
    },
    {
      name: "Jugador Más Disciplinado",
      short_description:
        "Conducta ejemplar, orden, puntualidad y cumplimiento de roles.",
      order: 14,
      is_active: true,
    },
    {
      name: "Jugador Más Activo en Eventos",
      short_description:
        "Mayor asistencia, compromiso y constancia en actividades del clan.",
      order: 15,
      is_active: true,
    },
    {
      name: "Killer del Año",
      short_description:
        "Jugador mas letal del año con gran impacto en las partidas a través de eliminación constante y decisiva del enemigo.",
      order: 16,
      is_active: true,
    },
    {
      name: "Legionario del Año",
      short_description:
        "Legionario mas completo, aquel que representa el espíritu de Legión Condor. Gran dominio de los roles, activo, constante, comprometido a lo largo del año.",
      order: 17,
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
