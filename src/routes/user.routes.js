import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { userRegister } from "../controllers/user.controller.js";

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

export default router
