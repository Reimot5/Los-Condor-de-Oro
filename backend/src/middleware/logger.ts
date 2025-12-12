import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// Función para verificar el estado de la base de datos
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

// Middleware de logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Log de petición entrante
  console.log(`[${new Date().toISOString()}] 📥 ${method} ${path} - IP: ${ip}`);

  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Verificar estado de la base de datos
    checkDatabaseHealth().then((dbOk) => {
      const dbStatus = dbOk ? "✅" : "❌";
      const statusEmoji = statusCode >= 200 && statusCode < 300 ? "✅" : statusCode >= 400 ? "❌" : "⚠️";
      
      console.log(
        `[${new Date().toISOString()}] ${statusEmoji} ${method} ${path} - ${statusCode} - ${duration}ms - DB: ${dbStatus}`
      );
    });

    return originalSend.call(this, body);
  };

  next();
}

