import { Router } from "express";
import {
  getTodayFortuneAPI,
  getMookAFortuneAPI,
  getLukimAPI,
  getGreetingAPI,
} from "../controllers/fortune.controller";


const router = Router();

router.post("/today", getTodayFortuneAPI);
router.post("/chat", getMookAFortuneAPI);
router.post("/lukim", getLukimAPI);
router.get("/greeting", getGreetingAPI);


export default router;
