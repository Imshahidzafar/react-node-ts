import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { errorResponse } from "./utils/errorHandler";

const app = express();

// Enable CORS for cross-origin requests
app.use(cors());

// Apply JSON parsing for all other routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Define routes for user and authentication management
app.use("/uploads", express.static("uploads"));
const v1Router = express.Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);

app.use("/api/v1", v1Router);

app.get("/api/v1/", (req: Request, res: Response) => {
  res.send({ Hello: "World" });
});

// 404 handler - must be after all routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).statusCode = 404;
  next(error);
});

// Global error handler - must be last middleware
app.use(((error: any, _req: Request, res: Response, next: NextFunction) => {
  errorResponse(res, error);
}) as ErrorRequestHandler);

export default app;
