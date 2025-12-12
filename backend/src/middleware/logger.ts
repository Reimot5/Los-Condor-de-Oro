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
  const fullPath = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const origin = req.headers.origin || "no-origin";

  // Log de petición entrante con más detalles
  console.log(`[${new Date().toISOString()}] 📥 ${method} ${fullPath} - IP: ${ip} - Origin: ${origin}`);

  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Verificar estado de la base de datos
    checkDatabaseHealth().then((dbOk) => {
      const dbStatus = dbOk ? "✅" : "❌";
      const statusEmoji = statusCode >= 200 && statusCode < 300 ? "✅" : statusCode >= 400 ? "❌" : "⚠️";
      
      // Log más detallado para errores
      if (statusCode >= 400) {
        console.error(
          `[${new Date().toISOString()}] ${statusEmoji} ${method} ${fullPath} - ${statusCode} - ${duration}ms - DB: ${dbStatus} - Origin: ${origin}`
        );
        // Si es un error 4xx o 5xx, también loguear el body si es pequeño
        if (typeof body === 'string' && body.length < 500) {
          console.error(`  Error response: ${body}`);
        }
      } else {
        console.log(
          `[${new Date().toISOString()}] ${statusEmoji} ${method} ${fullPath} - ${statusCode} - ${duration}ms - DB: ${dbStatus}`
        );
      }
    });

    return originalSend.call(this, body);
  };

  // Capturar errores no manejados
  res.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] ❌ Error en respuesta ${method} ${fullPath}:`, error);
  });

  next();
}

