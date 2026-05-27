import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });
import express from "express";
import cors from "cors";
import fortuneRouter from "./routes/fortune.router";
import authRouter from "./routes/auth.router";
import { authenticateRequest } from "./middleware/authentication.middleware";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(authenticateRequest);

app.use("/api/auth", authRouter);
app.use("/api", fortuneRouter);

app.listen(port, () => {
  console.log(
    `[Server] 오늘의점 백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`
  );
});
