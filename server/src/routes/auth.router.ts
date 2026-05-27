import { Router } from "express";
import {
  getAuthSessionAPI,
  logoutAPI,
  naverLoginCallbackAPI,
  startNaverLoginAPI,
} from "../controllers/auth.controller";

const router = Router();

router.get("/naver/start", startNaverLoginAPI);
router.get("/naver/callback", naverLoginCallbackAPI);
router.get("/session", getAuthSessionAPI);
router.post("/logout", logoutAPI);

export default router;
