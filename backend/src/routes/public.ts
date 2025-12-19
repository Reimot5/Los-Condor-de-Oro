import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Validate code
router.post("/validate-code", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Código requerido" });
    }

    const memberCode = await prisma.memberCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!memberCode) {
      return res.json({
        valid: false,
        error:
          "El código ingresado no existe. Verifica que esté escrito correctamente.",
      });
    }

    const eventState = await prisma.eventState.findFirst();

    if (!eventState) {
      return res
        .status(500)
        .json({ error: "Estado del evento no configurado" });
    }

    // Validar según el estado
    if (eventState.state === "NOMINATIONS" && memberCode.used_in_nomination) {
      return res.json({
        valid: false,
        error:
          "Este código ya fue utilizado para nominar. Cada código solo puede usarse una vez.",
      });
    }

    if (eventState.state === "VOTING" && memberCode.used_in_voting) {
      return res.json({
        valid: false,
        error:
          "Este código ya fue utilizado para votar. Cada código solo puede usarse una vez.",
      });
    }

    if (eventState.state === "SETUP") {
      return res.json({
        valid: false,
        error:
          "El evento aún no ha comenzado. Por favor, espera a que se abra la etapa de nominaciones.",
      });
    }

    if (eventState.state === "CLOSED") {
      return res.json({
        valid: false,
        error:
          "El evento ha finalizado. Ya no se pueden realizar nominaciones ni votos.",
      });
    }

    return res.json({
      valid: true,
      state: eventState.state,
    });
  } catch (error) {
    console.error("Error validating code:", error);
    return res.status(500).json({
      error:
        "Ocurrió un error al validar el código. Por favor, intenta nuevamente.",
    });
  }
});

// Nominate (ahora acepta múltiples nominaciones)
router.post("/nominate", async (req, res) => {
  try {
    const { code, category_id, candidate_id, nominations } = req.body;

    // Si viene nominations (array), es una llamada múltiple
    if (nominations && Array.isArray(nominations)) {
      if (!code || nominations.length === 0) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const eventState = await prisma.eventState.findFirst();

      if (!eventState || eventState.state !== "NOMINATIONS") {
        return res.status(400).json({
          error: "No se pueden realizar nominaciones en este momento",
        });
      }

      const memberCode = await prisma.memberCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!memberCode) {
        return res.status(400).json({
          error:
            "El código ingresado no es válido. Verifica que esté escrito correctamente.",
        });
      }

      if (memberCode.used_in_nomination) {
        return res.status(400).json({
          error:
            "Este código ya fue utilizado para nominar. Cada código solo puede usarse una vez.",
        });
      }

      // Obtener todas las categorías activas
      const activeCategories = await prisma.category.findMany({
        where: { is_active: true },
        select: { id: true },
      });

      // Validar que se nombre en todas las categorías
      if (nominations.length !== activeCategories.length) {
        return res.status(400).json({
          error: `Debes completar todas las categorías. Has nominado en ${nominations.length} de ${activeCategories.length} categorías.`,
        });
      }

      // Validar que todas las categorías estén presentes
      const nominatedCategoryIds = nominations.map((n: any) => n.category_id);
      const allCategoryIds = activeCategories.map((c) => c.id);
      const missingCategories = allCategoryIds.filter(
        (id) => !nominatedCategoryIds.includes(id)
      );

      if (missingCategories.length > 0) {
        return res.status(400).json({
          error: `Faltan ${missingCategories.length} categoría${
            missingCategories.length > 1 ? "s" : ""
          } por completar. Debes nominar en todas las categorías activas.`,
        });
      }

      // Validar todas las nominaciones
      for (const nom of nominations) {
        const category = await prisma.category.findUnique({
          where: { id: nom.category_id },
        });

        if (!category || !category.is_active) {
          return res.status(400).json({
            error:
              "Una de las categorías seleccionadas no es válida o está inactiva.",
          });
        }

        const candidate = await prisma.candidate.findUnique({
          where: { id: nom.candidate_id },
        });

        if (!candidate || !candidate.is_active) {
          return res.status(400).json({
            error:
              "Uno de los candidatos seleccionados no es válido o está inactivo.",
          });
        }
      }

      // Crear todas las nominaciones (permitir múltiples nominaciones del mismo candidato en la misma categoría)
      await prisma.nomination.createMany({
        data: nominations.map((nom: any) => ({
          category_id: nom.category_id,
          candidate_id: nom.candidate_id,
        })),
      });

      // Marcar código como usado
      await prisma.memberCode.update({
        where: { id: memberCode.id },
        data: { used_in_nomination: true },
      });

      return res.json({
        success: true,
        message: `${nominations.length} nominaciones registradas correctamente`,
      });
    }

    // Compatibilidad con llamada individual (deprecated pero mantenida)
    if (!code || !category_id || !candidate_id) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const eventState = await prisma.eventState.findFirst();

    if (!eventState || eventState.state !== "NOMINATIONS") {
      return res.status(400).json({
        error:
          "No se pueden realizar nominaciones en este momento. El evento no está en etapa de nominaciones.",
      });
    }

    const memberCode = await prisma.memberCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!memberCode) {
      return res.status(400).json({ error: "Código no válido" });
    }

    if (memberCode.used_in_nomination) {
      return res
        .status(400)
        .json({ error: "Este código ya fue usado para nominar" });
    }

    const category = await prisma.category.findUnique({
      where: { id: category_id },
    });

    if (!category || !category.is_active) {
      return res.status(400).json({ error: "Categoría no válida" });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
    });

    if (!candidate || !candidate.is_active) {
      return res.status(400).json({ error: "Candidato no válido" });
    }

    // Crear la nominación (permitir múltiples nominaciones del mismo candidato en la misma categoría)
    await prisma.nomination.create({
      data: {
        category_id,
        candidate_id,
      },
    });

    // Marcar código como usado
    await prisma.memberCode.update({
      where: { id: memberCode.id },
      data: { used_in_nomination: true },
    });

    return res.json({
      success: true,
      message: "Nominación registrada correctamente",
    });
  } catch (error: any) {
    console.error("Error creating nomination:", error);
    return res.status(500).json({
      error:
        "Ocurrió un error al registrar las nominaciones. Por favor, intenta nuevamente.",
    });
  }
});

// Vote
router.post("/vote", async (req, res) => {
  try {
    const { code, votes } = req.body;

    if (!code || !votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const eventState = await prisma.eventState.findFirst();

    if (!eventState || eventState.state !== "VOTING") {
      return res.status(400).json({
        error:
          "No se pueden realizar votos en este momento. El evento no está en etapa de votación.",
      });
    }

    const memberCode = await prisma.memberCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!memberCode) {
      return res.status(400).json({
        error:
          "El código ingresado no es válido. Verifica que esté escrito correctamente.",
      });
    }

    if (memberCode.used_in_voting) {
      return res.status(400).json({
        error:
          "Este código ya fue utilizado para votar. Cada código solo puede usarse una vez.",
      });
    }

    // Obtener todas las categorías activas
    const activeCategories = await prisma.category.findMany({
      where: { is_active: true },
      select: { id: true },
    });

    // Validar que se vote en todas las categorías
    if (votes.length !== activeCategories.length) {
      return res.status(400).json({
        error: `Debes completar todas las categorías. Has votado en ${votes.length} de ${activeCategories.length} categorías.`,
      });
    }

    // Validar que todas las categorías estén presentes
    const votedCategoryIds = votes.map((v: any) => v.category_id);
    const allCategoryIds = activeCategories.map((c) => c.id);
    const missingCategories = allCategoryIds.filter(
      (id) => !votedCategoryIds.includes(id)
    );

    if (missingCategories.length > 0) {
      return res.status(400).json({
        error: `Faltan ${missingCategories.length} categoría${
          missingCategories.length > 1 ? "s" : ""
        } por completar. Debes votar en todas las categorías activas.`,
      });
    }

    // Validar que todos los candidatos existen, están activos y están seleccionados para la categoría
    for (const vote of votes) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: vote.candidate_id },
      });

      if (!candidate || !candidate.is_active) {
        return res.status(400).json({
          error:
            "Uno de los candidatos seleccionados no es válido o está inactivo.",
        });
      }

      // Verificar que el candidato está seleccionado para esta categoría
      const categoryCandidate = await prisma.categoryCandidate.findUnique({
        where: {
          category_id_candidate_id: {
            category_id: vote.category_id,
            candidate_id: vote.candidate_id,
          },
        },
      });

      if (!categoryCandidate) {
        return res.status(400).json({
          error:
            "El candidato seleccionado no está disponible para esta categoría. Solo puedes votar por los candidatos preseleccionados.",
        });
      }
    }

    // Crear todos los votos
    await prisma.vote.createMany({
      data: votes.map((vote: any) => ({
        category_id: vote.category_id,
        candidate_id: vote.candidate_id,
      })),
    });

    // Marcar código como usado
    await prisma.memberCode.update({
      where: { id: memberCode.id },
      data: { used_in_voting: true },
    });

    return res.json({
      success: true,
      message: "Votos registrados correctamente",
    });
  } catch (error) {
    console.error("Error creating votes:", error);
    return res.status(500).json({
      error:
        "Ocurrió un error al registrar los votos. Por favor, intenta nuevamente.",
    });
  }
});

// Get categories
router.get("/categories", async (req, res) => {
  try {
    const active = req.query.active === "true";
    const withCandidates = req.query.withCandidates === "true";

    const where: any = {};
    if (active) {
      where.is_active = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { order: "asc" },
      include: withCandidates
        ? {
            category_candidates: {
              where: {
                candidate: { is_active: true },
              },
              include: {
                candidate: {
                  select: {
                    id: true,
                    display_name: true,
                    profile_image_url: true,
                  },
                },
              },
            },
          }
        : undefined,
    });

    // Transformar la respuesta para mantener compatibilidad
    const transformed = categories.map((cat: any) => ({
      ...cat,
      candidates: withCandidates
        ? cat.category_candidates?.map((cc: any) => ({
            id: cc.candidate.id,
            display_name: cc.candidate.display_name,
            profile_image_url: cc.candidate.profile_image_url,
          })) || []
        : undefined,
    }));

    return res.json(transformed);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// Get all candidates (members)
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { is_active: true },
      orderBy: { display_name: "asc" },
      select: {
        id: true,
        display_name: true,
        profile_image_url: true,
      },
    });

    return res.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ error: "Error al obtener candidatos" });
  }
});

// Get winners
router.get("/winners", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      include: {
        winner_candidate: {
          include: {
            votes: true,
          },
        },
        category_candidates: {
          include: {
            candidate: {
              include: {
                votes: true,
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const winners = categories.map((category: any) => {
      if (!category.winner_candidate_id) {
        // Calcular ganador por votos de los candidatos seleccionados
        const candidateVotes = category.category_candidates.map((cc: any) => {
          const votes = cc.candidate.votes.filter(
            (v: any) => v.category_id === category.id
          );
          return {
            candidate_id: cc.candidate.id,
            candidate_name: cc.candidate.display_name,
            votes: votes.length,
          };
        });

        const maxVotes = Math.max(
          ...candidateVotes.map((cv: any) => cv.votes),
          0
        );
        const winner = candidateVotes.find((cv: any) => cv.votes === maxVotes);

        return {
          category_id: category.id,
          category_name: category.name,
          category_description: category.short_description,
          candidate_id: winner?.candidate_id || null,
          candidate_name: winner?.candidate_name || null,
          votes: winner?.votes || 0,
          announced: category.winner_announced,
        };
      }

      const winnerVotes =
        category.winner_candidate?.votes.filter(
          (v: any) => v.category_id === category.id
        ) || [];

      return {
        category_id: category.id,
        category_name: category.name,
        category_description: category.short_description,
        candidate_id: category.winner_candidate_id,
        candidate_name: category.winner_candidate?.display_name || null,
        profile_image_url: category.winner_candidate?.profile_image_url || null,
        votes: winnerVotes.length,
        announced: category.winner_announced,
      };
    });

    return res.json(winners);
  } catch (error) {
    console.error("Error fetching winners:", error);
    return res.status(500).json({ error: "Error al obtener ganadores" });
  }
});

export default router;
