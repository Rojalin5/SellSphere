import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/Authentication.js";
import {
  userLogin,
  userRegister,
  userLogout,
} from "../controllers/user.controller.js";

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
router.route("/login").post(userLogin);
router.route("/logout").post(verifyJWT, userLogout);

export default router;
