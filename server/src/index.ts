import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });
import express from "express";
import cors from "cors";
import fortuneRouter from "./routes/fortune.router";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use("/api", fortuneRouter);

app.listen(port, () => {
  console.log(
    `[Server] 오늘의점 백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`
  );
});
