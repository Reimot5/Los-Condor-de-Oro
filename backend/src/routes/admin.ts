import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { prisma } from "../lib/prisma.js";
import { verifyAdmin } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que el directorio de uploads existe
const uploadsDir = path.join(__dirname, "../../uploads/candidates");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
  }
} catch (error) {
  console.error("Error creating uploads directory:", error);
  // Continuar de todas formas, el directorio puede existir o crearse después
}

// Configurar multer para guardar imágenes de perfil
const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generar nombre único: timestamp-uuid.extensión
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar imágenes
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Solo se permiten archivos de imagen (JPG, PNG, WEBP, GIF)")
      );
    }
  },
});

// Multer para archivos Excel (mantener el original)
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

// Get selected candidates for categories
router.get("/categories/selected-candidates", async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined;

    const where: any = {};
    if (categoryId) {
      where.category_id = categoryId;
    }

    const categoryCandidates = await prisma.categoryCandidate.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        candidate: {
          select: {
            id: true,
            display_name: true,
            profile_image_url: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Agrupar por categoría
    const grouped = categoryCandidates.reduce((acc: any, cc: any) => {
      const catId = cc.category_id;
      if (!acc[catId]) {
        acc[catId] = {
          category_id: catId,
          category_name: cc.category.name,
          candidates: [],
        };
      }
      acc[catId].candidates.push({
        candidate_id: cc.candidate.id,
        candidate_name: cc.candidate.display_name,
        profile_image_url: cc.candidate.profile_image_url,
      });
      return acc;
    }, {});

    const result = Object.values(grouped);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching selected candidates:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener candidatos seleccionados" });
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
          profile_image_url: nom.candidate.profile_image_url,
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

// Votes
router.get("/votes", async (req, res) => {
  try {
    const categoryId = req.query.category_id as string | undefined;
    const onlySelected = req.query.only_selected === "true";

    const where: any = {};
    if (categoryId) {
      where.category_id = categoryId;
    }

    const votes = await prisma.vote.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            short_description: true,
            winner_candidate_id: true,
            winner_announced: true,
            category_candidates: {
              select: {
                candidate_id: true,
              },
            },
          },
        },
        candidate: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Agrupar por candidato y categoría, contar votos
    const grouped = votes.reduce((acc: any, vote) => {
      const key = `${vote.category_id}-${vote.candidate_id}`;

      // Si only_selected es true, filtrar solo candidatos seleccionados
      if (onlySelected) {
        const isSelected = vote.category.category_candidates.some(
          (cc: any) => cc.candidate_id === vote.candidate_id
        );
        if (!isSelected) {
          return acc;
        }
      }

      if (!acc[key]) {
        acc[key] = {
          category_id: vote.category_id,
          category_name: vote.category.name,
          category_description: vote.category.short_description,
          category_winner_candidate_id: vote.category.winner_candidate_id,
          category_winner_announced: vote.category.winner_announced,
          candidate_id: vote.candidate_id,
          candidate_name: vote.candidate.display_name,
          profile_image_url: vote.candidate.profile_image_url,
          count: 0,
          first_vote: vote.created_at,
        };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const result = Object.values(grouped);
    // Ordenar por cantidad de votos (descendente)
    result.sort((a: any, b: any) => b.count - a.count);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching votes:", error);
    return res.status(500).json({ error: "Error al obtener votos" });
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

router.post(
  "/candidates",
  profileImageUpload.single("profile_image"),
  async (req, res) => {
    try {
      const { display_name, is_active } = req.body;

      if (!display_name) {
        return res.status(400).json({ error: "Nombre es requerido" });
      }

      let profile_image_url: string | null = null;
      if (req.file) {
        profile_image_url = `/uploads/candidates/${req.file.filename}`;
      }

      // Convertir is_active de string a boolean si viene como string
      let isActiveBool: boolean = true;
      if (is_active !== undefined) {
        if (typeof is_active === "string") {
          isActiveBool = is_active.toLowerCase() === "true";
        } else {
          isActiveBool = Boolean(is_active);
        }
      }

      const candidate = await prisma.candidate.create({
        data: {
          display_name: display_name.trim(),
          profile_image_url,
          is_active: isActiveBool,
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
  }
);

router.put(
  "/candidates",
  profileImageUpload.single("profile_image"),
  async (req, res) => {
    try {
      const { id, display_name, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID es requerido" });
      }

      // Obtener candidato actual para eliminar imagen anterior si existe
      const currentCandidate = await prisma.candidate.findUnique({
        where: { id },
      });

      if (!currentCandidate) {
        return res.status(404).json({ error: "Candidato no encontrado" });
      }

      // Convertir is_active de string a boolean si viene como string
      let isActiveBool: boolean | undefined = undefined;
      if (is_active !== undefined) {
        if (typeof is_active === "string") {
          isActiveBool = is_active.toLowerCase() === "true";
        } else {
          isActiveBool = Boolean(is_active);
        }
      }

      const updateData: any = {
        ...(display_name && { display_name }),
        ...(isActiveBool !== undefined && { is_active: isActiveBool }),
      };

      // Si se subió una nueva imagen
      if (req.file) {
        // Eliminar imagen anterior si existe
        if (currentCandidate.profile_image_url) {
          const oldImagePath = path.join(
            __dirname,
            "../../",
            currentCandidate.profile_image_url.replace(
              /^\/uploads\//,
              "uploads/"
            )
          );
          try {
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (err) {
            console.error("Error eliminando imagen anterior:", err);
          }
        }
        updateData.profile_image_url = `/uploads/candidates/${req.file.filename}`;
      }

      const candidate = await prisma.candidate.update({
        where: { id },
        data: updateData,
      });

      return res.json(candidate);
    } catch (error) {
      console.error("Error updating candidate:", error);
      return res.status(500).json({ error: "Error al actualizar candidato" });
    }
  }
);

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
      return res.status(400).json({
        error:
          "No se puede eliminar el candidato debido a restricciones de la base de datos",
      });
    }

    return res.status(500).json({ error: "Error al eliminar candidato" });
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

    // Permitir establecer ganador (candidate_id) o removerlo (null)
    if (candidate_id !== undefined) {
      updateData.winner_candidate_id = candidate_id || null;
      // Si se remueve el ganador, también remover el estado de anunciado
      if (candidate_id === null) {
        updateData.winner_announced = false;
      }
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

// Get presentation data (categories with announced winners, nominees, and winners)
router.get("/presentation-data", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        is_active: true,
        winner_announced: true,
        winner_candidate_id: { not: null },
      },
      include: {
        winner_candidate: {
          select: {
            id: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        category_candidates: {
          include: {
            candidate: {
              select: {
                id: true,
                display_name: true,
                profile_image_url: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const presentationData = categories.map((category: any) => {
      const nominees = category.category_candidates.map((cc: any) => ({
        candidate_id: cc.candidate.id,
        candidate_name: cc.candidate.display_name,
        profile_image_url: cc.candidate.profile_image_url,
      }));

      return {
        category_id: category.id,
        category_name: category.name,
        category_description: category.short_description,
        nominees,
        winner: {
          candidate_id: category.winner_candidate?.id || null,
          candidate_name: category.winner_candidate?.display_name || null,
          profile_image_url:
            category.winner_candidate?.profile_image_url || null,
        },
      };
    });

    return res.json(presentationData);
  } catch (error) {
    console.error("Error fetching presentation data:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener datos de presentación" });
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

// Función helper para extraer el nombre después del prefijo " | "
function extractNameAfterPrefix(name: string): string {
  // Buscar el patrón " | " (espacio, pipe, espacio) y extraer lo que viene después
  const match = name.match(/\s+\|\s+(.+)$/);
  if (match && match[1]) {
    return match[1].trim().toLowerCase();
  }
  // Si no hay prefijo, devolver el nombre completo normalizado
  return name.trim().toLowerCase();
}

// Import candidates from Excel with images (ZIP file)
router.post("/candidates/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó archivo" });
    }

    let workbook: XLSX.WorkBook;
    let imageMap: Map<string, Buffer> = new Map();

    // Verificar si es un archivo ZIP
    const isZip =
      req.file.mimetype === "application/zip" ||
      req.file.mimetype === "application/x-zip-compressed" ||
      req.file.originalname.toLowerCase().endsWith(".zip");

    if (isZip) {
      try {
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        // Buscar el archivo Excel y las imágenes
        let excelEntry = null;
        for (const entry of zipEntries) {
          const entryName = entry.entryName.toLowerCase();

          // Buscar archivo Excel
          if (
            (entryName.endsWith(".xlsx") || entryName.endsWith(".xls")) &&
            !entry.isDirectory
          ) {
            excelEntry = entry;
          }

          // Buscar imágenes WEBP y GIF
          if (
            (entryName.endsWith(".webp") || entryName.endsWith(".gif")) &&
            !entry.isDirectory
          ) {
            const ext = entryName.endsWith(".webp") ? ".webp" : ".gif";
            const imageName = path.basename(entry.entryName, ext);
            // Normalizar el nombre del archivo (sin prefijo, ya viene limpio)
            const normalizedImageName = imageName.trim().toLowerCase();
            // Guardar el buffer de la imagen
            imageMap.set(normalizedImageName, entry.getData());
            // Guardar también la extensión para usarla al guardar el archivo
            imageMap.set(`${normalizedImageName}_ext`, Buffer.from(ext));
          }
        }

        if (!excelEntry) {
          return res.status(400).json({
            error: "No se encontró archivo Excel (.xlsx o .xls) en el ZIP",
          });
        }

        workbook = XLSX.read(excelEntry.getData(), { type: "buffer" });
      } catch (zipError: any) {
        return res.status(400).json({
          error: "Error al procesar archivo ZIP: " + zipError.message,
        });
      }
    } else {
      // Si no es ZIP, procesar como Excel normal
      workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    }

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

      const displayNameTrimmed = String(display_name).trim();
      // Extraer el nombre después del prefijo " | " para buscar la imagen
      const extractedName = extractNameAfterPrefix(displayNameTrimmed);

      // Buscar imagen (puede ser .webp o .gif)
      const imageBuffer = imageMap.get(extractedName) || null;

      candidates.push({
        display_name: displayNameTrimmed, // Mantener el nombre original completo para la BD
        is_active: Boolean(is_active),
        imageBuffer,
        extractedName, // Guardar para poder obtener la extensión después
      });
    }

    if (candidates.length === 0) {
      return res.status(400).json({
        error: "No se pudieron procesar candidatos",
        errors,
      });
    }

    // Crear candidatos y guardar imágenes
    const created = [];
    let imagesImported = 0;

    for (const candidate of candidates) {
      try {
        let profile_image_url: string | null = null;

        // Si hay imagen, guardarla
        if (candidate.imageBuffer) {
          const uniqueSuffix = `${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}`;
          // Obtener la extensión guardada o usar .webp por defecto
          const extBuffer = imageMap.get(`${candidate.extractedName}_ext`);
          const ext = extBuffer ? extBuffer.toString() : ".webp";
          const filename = `profile-${uniqueSuffix}${ext}`;
          const filePath = path.join(uploadsDir, filename);

          try {
            fs.writeFileSync(filePath, candidate.imageBuffer);
            profile_image_url = `/uploads/candidates/${filename}`;
            imagesImported++;
          } catch (fileError: any) {
            errors.push(
              `Error al guardar imagen para ${candidate.display_name}: ${fileError.message}`
            );
          }
        }

        const createdCandidate = await prisma.candidate.upsert({
          where: { display_name: candidate.display_name },
          update: {
            is_active: candidate.is_active,
            ...(profile_image_url && { profile_image_url }),
          },
          create: {
            display_name: candidate.display_name,
            is_active: candidate.is_active,
            profile_image_url,
          },
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
      images_imported: imagesImported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error importing candidates:", error);
    return res
      .status(500)
      .json({ error: "Error al importar candidatos: " + error.message });
  }
});

// Endpoint para subir/actualizar solo la imagen de perfil de un candidato
router.post(
  "/candidates/:id/image",
  profileImageUpload.single("profile_image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó imagen" });
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id },
      });

      if (!candidate) {
        // Eliminar archivo subido si el candidato no existe
        const filePath = path.join(uploadsDir, req.file.filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error eliminando archivo:", err);
        }
        return res.status(404).json({ error: "Candidato no encontrado" });
      }

      // Eliminar imagen anterior si existe
      if (candidate.profile_image_url) {
        const oldImagePath = path.join(
          __dirname,
          "../../",
          candidate.profile_image_url.replace(/^\/uploads\//, "uploads/")
        );
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error("Error eliminando imagen anterior:", err);
        }
      }

      const profile_image_url = `/uploads/candidates/${req.file.filename}`;

      const updatedCandidate = await prisma.candidate.update({
        where: { id },
        data: { profile_image_url },
      });

      return res.json(updatedCandidate);
    } catch (error: any) {
      console.error("Error updating candidate image:", error);
      return res.status(500).json({ error: "Error al actualizar imagen" });
    }
  }
);

export default router;
