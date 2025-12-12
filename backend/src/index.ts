import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

// Import routes
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { requestLogger } from "./middleware/logger.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
// CORS configuration - permite localhost en desarrollo y cualquier origen en producción
const getCorsOrigin = (): boolean | string[] => {
  // En desarrollo, solo permitir localhost
  if (process.env.NODE_ENV === "development") {
    return ["http://localhost:3000", "http://localhost:3001"];
  }
  
  // En producción, permitir cualquier origen (o configurar específicos con variable de entorno)
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(",").map((o) => o.trim());
  }
  
  // Permitir todos si no se especifica
  return true;
};

app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
  })
);
app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
