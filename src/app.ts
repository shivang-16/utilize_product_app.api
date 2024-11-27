import express, { urlencoded } from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "./middlewares/error";
import authRoutes from "./routes/auth";
import orderRoutes from './routes/order';
import ConnectToDB from "./db/db";

config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT || 4000;

ConnectToDB(); 

app.use(cookieParser());
app.use(express.json());
app.use(urlencoded({ extended: true }));

const allowedOrigins = [process.env.FRONTEND_URL!, "http://localhost:5173"];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      /\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/order", orderRoutes);

app.get("/api", (req, res) => {
  res.send("Hello, world!");
});

app.use(errorMiddleware);

app.listen(port, () => console.log(`Server is running on port ${port}`));
