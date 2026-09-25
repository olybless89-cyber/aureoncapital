import path from "path";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: [
    /\.netlify\.app$/,
    /\.vercel\.app$/,
    /\.onrender\.com$/,
    /\.all-hands\.dev$/,
    /localhost/,
    "https://aureoncapital.com",
    "https://www.aureoncapital.com",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built frontend (Vite) so a single Railway service hosts both the
// API and the web app — no separate Vercel/Netlify deploy needed. Static
// assets first, then an SPA fallback for client-side routes (anything that
// isn't /api/*). process.cwd() is the repo root when started via
// `node artifacts/api-server/dist/index.mjs` from the root (see railpack.json).
const FRONTEND_DIST = path.resolve(process.cwd(), "artifacts/tesla-pro/dist/public");
app.use(express.static(FRONTEND_DIST));
app.get(/^\/(?!api\/).*/, (_req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Global error handler — exposes underlying DB/runtime errors in response
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: err.message ?? "Internal Server Error",
    cause: err.cause?.message ?? String(err.cause ?? ""),
  });
});

export default app;
