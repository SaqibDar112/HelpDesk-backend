import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import { seedAdmin } from "./controllers/auth.controller.js";
import { slaCronJob } from "./utils/sla.js";

dotenv.config({
  path:'./env',
});
const app = express();
connectDB();

app.use(express.json());

app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true,
}));
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("✅ HelpDesk API running..."));

app.get("/health", (req, res) => res.send("✅ HelpDesk API healthy"));


app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.statusCode || 500).json({
    error: { code: err.code || "INTERNAL_ERROR", message: err.message || "Something went wrong" },
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await seedAdmin();
  slaCronJob();
});
