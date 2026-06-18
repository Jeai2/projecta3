import { Router } from "express";
import {
  getTodayFortuneAPI,
  getMookAFortuneAPI,
  getLukimAPI,
  getGreetingAPI,
  checkNudgeAPI,
  nudgeResponseAPI,
  getSessionAPI,
  linkAccountProfileCandidateAPI,
  getCheoneumDrawAPI,
  getWalletAPI,
  grantCreditsAPI,
  setSubscriptionAPI,
  devLoginAPI,
} from "../controllers/fortune.controller";


const router = Router();

router.post("/today", getTodayFortuneAPI);
router.post("/chat", getMookAFortuneAPI);
router.post("/lukim", getLukimAPI);
router.post("/cheoneum/draw", getCheoneumDrawAPI);
router.get("/greeting", getGreetingAPI);

router.get("/wallet", getWalletAPI);
router.post("/wallet/grant", grantCreditsAPI);
router.post("/wallet/subscribe", setSubscriptionAPI);
router.post("/dev-login", devLoginAPI);

router.get("/session", getSessionAPI);
router.post("/session/account-profile-candidate", linkAccountProfileCandidateAPI);
router.get("/session/nudge", checkNudgeAPI);
router.post("/session/nudge-response", nudgeResponseAPI);


export default router;
