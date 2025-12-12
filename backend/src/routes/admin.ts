import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { prisma } from "../lib/prisma.js";
import { verifyAdmin } from "../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// All admin routes require authentication
router.use(verifyAdmin);

// Login (just verify)
router.post("/login", (req, res) => {
  res.json({ success: true });
});

// Event state
router.get("/event-state", async (req, res) => {
  try {
    const eventState = await prisma.eventState.findFirst();
    return res.json(eventState || { state: "SETUP" });
  } catch (error) {
    console.error("Error fetching event state:", error);
    return res.status(500).json({ error: "Error al obtener estado" });
  }
});

router.put("/event-state", async (req, res) => {
  try {
    const { state } = req.body;

    if (!["SETUP", "NOMINATIONS", "VOTING", "CLOSED"].includes(state)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    let eventState = await prisma.eventState.findFirst();

    if (eventState) {
      eventState = await prisma.eventState.update({
        where: { id: eventState.id },
        data: { state },
      });
    } else {
      eventState = await prisma.eventState.create({
        data: { state },
      });
    }

    return res.json(eventState);
  } catch (error) {
    console.error("Error updating event state:", error);
    return res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// Categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            nominations: true,
            category_candidates: true,
            votes: true,
          },
        },
      },
    });

    return res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ error: "Error al obtener categorías" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const { name, short_description, order, is_active } = req.body;

    if (!name || !short_description) {
      return res
        .status(400)
        .json({ error: "Nombre y descripción son requeridos" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        short_description,
        order: order || 0,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return res.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ error: "Error al crear categoría" });
  }
});

router.put("/categories", async (req, res) => {
  try {
    const { id, name, short_description, order, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(short_description && { short_description }),
        ...(order !== undefined && { order }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    return res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Error al actualizar categoría" });
  }
});

router.delete("/categories", async (req, res) => {
  try {
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Error al eliminar categoría" });
  }
});

// Nominations
router.get("/nominations", async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined;

    const where: any = {};
    if (categoryId) {
      where.category_id = categoryId;
    }

    const nominations = await prisma.nomination.findMany({
      where,
      include: {
        category: true,
        candidate: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Agrupar por candidato y categoría, contar nominaciones
    const grouped = nominations.reduce((acc: any, nom) => {
      const key = `${nom.category_id}-${nom.candidate_id}`;
      if (!acc[key]) {
        acc[key] = {
          category_id: nom.category_id,
          category_name: nom.category.name,
          candidate_id: nom.candidate_id,
          candidate_name: nom.candidate.display_name,
          count: 0,
          first_nomination: nom.created_at,
        };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const result = Object.values(grouped);
    // Ordenar por cantidad de nominaciones (descendente)
    result.sort((a: any, b: any) => b.count - a.count);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching nominations:", error);
    return res.status(500).json({ error: "Error al obtener nominaciones" });
  }
});

// Candidates
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        _count: {
          select: {
            votes: true,
            nominations: true,
          },
        },
        category_candidates: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { display_name: "asc" },
    });

    return res.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return res.status(500).json({ error: "Error al obtener candidatos" });
  }
});

router.post("/candidates", async (req, res) => {
  try {
    const { display_name, is_active } = req.body;

    if (!display_name) {
      return res.status(400).json({ error: "Nombre es requerido" });
    }

    const candidate = await prisma.candidate.create({
      data: {
        display_name: display_name.trim(),
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return res.json(candidate);
  } catch (error: any) {
    console.error("Error creating candidate:", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Ya existe un candidato con ese nombre" });
    }
    return res.status(500).json({ error: "Error al crear candidato" });
  }
});

router.put("/candidates", async (req, res) => {
  try {
    const { id, display_name, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(display_name && { display_name }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    return res.json(candidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return res.status(500).json({ error: "Error al actualizar candidato" });
  }
});

router.delete("/candidates", async (req, res) => {
  try {
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }

    // Verificar que el candidato existe antes de intentar eliminarlo
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return res
        .status(404)
        .json({ error: "El candidato no existe o ya fue eliminado" });
    }

    await prisma.candidate.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting candidate:", error);

    // Manejar error específico de Prisma cuando el registro no existe
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "El candidato no existe o ya fue eliminado" });
    }

    // Manejar otros errores de Prisma
    if (error.code && error.code.startsWith("P")) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar el candidato debido a restricciones de la base de datos",
        });
    }

    return res.status(500).json({ error: "Error al eliminar candidato" });
  }
});

// Results
router.get("/results", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      include: {
        category_candidates: {
          include: {
            candidate: {
              include: {
                _count: {
                  select: {
                    votes: {
                      where: {
                        category_id: undefined, // Will be filtered in map
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const results = categories.map((category) => {
      const candidates = category.category_candidates
        .map((cc: any) => {
          const votes = cc.candidate.votes.filter(
            (v: any) => v.category_id === category.id
          );
          return {
            candidate_id: cc.candidate.id,
            candidate_name: cc.candidate.display_name,
            votes: votes.length,
          };
        })
        .sort((a: any, b: any) => b.votes - a.votes);

      return {
        category_id: category.id,
        category_name: category.name,
        category_description: category.short_description,
        candidates,
        winner_candidate_id: category.winner_candidate_id,
        winner_announced: category.winner_announced,
      };
    });

    return res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return res.status(500).json({ error: "Error al obtener resultados" });
  }
});

// Select candidates for category (from top nominations)
router.post("/categories/select-candidates", async (req, res) => {
  try {
    const { category_id, candidate_ids, max_candidates } = req.body;

    if (!category_id || !candidate_ids || !Array.isArray(candidate_ids)) {
      return res.status(400).json({ error: "Datos requeridos inválidos" });
    }

    const max = max_candidates || 5;
    if (candidate_ids.length > max) {
      return res.status(400).json({
        error: `Solo se pueden seleccionar hasta ${max} candidatos por categoría`,
      });
    }

    // Eliminar selecciones anteriores para esta categoría
    await prisma.categoryCandidate.deleteMany({
      where: { category_id },
    });

    // Crear nuevas selecciones
    const categoryCandidates = await prisma.categoryCandidate.createMany({
      data: candidate_ids.map((candidate_id: string) => ({
        category_id,
        candidate_id,
      })),
    });

    return res.json({
      success: true,
      selected: categoryCandidates.count,
    });
  } catch (error) {
    console.error("Error selecting candidates:", error);
    return res.status(500).json({ error: "Error al seleccionar candidatos" });
  }
});

// Publish winner
router.post("/publish-winner", async (req, res) => {
  try {
    const { category_id, candidate_id, announce } = req.body;

    if (!category_id) {
      return res.status(400).json({ error: "Categoría es requerida" });
    }

    const updateData: any = {};

    if (candidate_id) {
      updateData.winner_candidate_id = candidate_id;
    }

    if (announce !== undefined) {
      updateData.winner_announced = announce;
    }

    const category = await prisma.category.update({
      where: { id: category_id },
      data: updateData,
    });

    return res.json(category);
  } catch (error) {
    console.error("Error publishing winner:", error);
    return res.status(500).json({ error: "Error al publicar ganador" });
  }
});

// Import codes
router.post("/import-codes", async (req, res) => {
  try {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes)) {
      return res.status(400).json({ error: "Códigos deben ser un array" });
    }

    const codesToCreate = codes
      .map((code: string) => code.trim().toUpperCase())
      .filter((code: string) => code.length > 0)
      .map((code: string) => ({
        code,
        used_in_nomination: false,
        used_in_voting: false,
      }));

    if (codesToCreate.length === 0) {
      return res.status(400).json({ error: "No hay códigos válidos" });
    }

    const result = await prisma.memberCode.createMany({
      data: codesToCreate,
      skipDuplicates: true,
    });

    return res.json({
      success: true,
      imported: result.count,
      total: codesToCreate.length,
    });
  } catch (error) {
    console.error("Error importing codes:", error);
    return res.status(500).json({ error: "Error al importar códigos" });
  }
});

// List codes with censored view
router.get("/codes", async (req, res) => {
  try {
    const codes = await prisma.memberCode.findMany({
      orderBy: { code: "asc" },
    });

    const censoredCodes = codes.map((code) => {
      const codeStr = code.code;
      const length = codeStr.length;
      const visibleStart = Math.floor(length * 0.3); // Mostrar primeros 30%
      const visibleEnd = Math.floor(length * 0.2); // Mostrar últimos 20%
      const censored = "*".repeat(length - visibleStart - visibleEnd);

      const censoredCode =
        codeStr.substring(0, visibleStart) +
        censored +
        codeStr.substring(length - visibleEnd);

      return {
        id: code.id,
        code: censoredCode,
        used_in_nomination: code.used_in_nomination,
        used_in_voting: code.used_in_voting,
        created_at: code.created_at,
      };
    });

    return res.json(censoredCodes);
  } catch (error) {
    console.error("Error fetching codes:", error);
    return res.status(500).json({ error: "Error al obtener códigos" });
  }
});

// Code statistics
router.get("/codes/stats", async (req, res) => {
  try {
    const total = await prisma.memberCode.count();
    const usedInNomination = await prisma.memberCode.count({
      where: { used_in_nomination: true },
    });
    const usedInVoting = await prisma.memberCode.count({
      where: { used_in_voting: true },
    });
    const unused = await prisma.memberCode.count({
      where: {
        used_in_nomination: false,
        used_in_voting: false,
      },
    });

    return res.json({
      total,
      used_in_nomination: usedInNomination,
      used_in_voting: usedInVoting,
      unused,
    });
  } catch (error) {
    console.error("Error fetching code stats:", error);
    return res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// Import candidates from Excel
router.post("/candidates/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ error: "El archivo está vacío o no es válido" });
    }

    // Esperamos columnas: display_name, is_active (opcional)
    const candidates = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const display_name =
        row.display_name ||
        row["Nombre"] ||
        row["display_name"] ||
        row["Nombre del Candidato"] ||
        row["Miembro"];
      const is_active =
        row.is_active !== undefined
          ? row.is_active
          : row["Activo"] !== undefined
          ? row["Activo"]
          : true;

      if (!display_name) {
        errors.push(`Fila ${i + 2}: Falta el nombre del candidato`);
        continue;
      }

      candidates.push({
        display_name: String(display_name).trim(),
        is_active: Boolean(is_active),
      });
    }

    if (candidates.length === 0) {
      return res.status(400).json({
        error: "No se pudieron procesar candidatos",
        errors,
      });
    }

    // Crear candidatos (usar upsert para evitar duplicados)
    const created = [];
    for (const candidate of candidates) {
      try {
        const createdCandidate = await prisma.candidate.upsert({
          where: { display_name: candidate.display_name },
          update: { is_active: candidate.is_active },
          create: candidate,
        });
        created.push(createdCandidate);
      } catch (error: any) {
        errors.push(
          `Error al crear candidato ${candidate.display_name}: ${error.message}`
        );
      }
    }

    return res.json({
      success: true,
      imported: created.length,
      total: candidates.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error importing candidates:", error);
    return res
      .status(500)
      .json({ error: "Error al importar candidatos: " + error.message });
  }
});

export default router;
