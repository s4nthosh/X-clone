import express from "express"
import protectRoute from "../middleware/protectRoute.js";
import { followUnfollowUser, getProfile  , getsuggestedUser , updateUser } from "../controllers/user.controller.js";


const router = express.Router()

router.get("/profile/:username" , protectRoute , getProfile)
router.post("/follow/:id" , protectRoute , followUnfollowUser)
router.get("/suggested" , protectRoute , getsuggestedUser)
router.post("/update" , protectRoute , updateUser )



export default router;