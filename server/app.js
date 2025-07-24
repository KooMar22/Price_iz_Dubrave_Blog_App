import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

// Load environment variables from .env file
dotenv.config();


// Set up express application
const app = express();
const PORT = process.env.PORT;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_PORT,
      "https://price-iz-dubrave-blog-app.vercel.app", // Production frontend URL
      "http://localhost:5173", // Development frontend URL
    ].filter(Boolean);

    // Allow requests without origin (e.g. mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};


// MIDDLEWARE
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


// Routes
app.use("/api", routes);

// Error handling middleware 
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Trying to keep render alive
if (process.env.NODE_ENV === "production") {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });
};

// Run the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});