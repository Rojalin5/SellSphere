import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { userLogin, userRegister } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profilePicture",
      maxCount: 1,
    },
  ]),
  userRegister
);
router.route("/login").post(userLogin)
export default router
