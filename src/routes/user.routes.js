import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/Authentication.js";
import {
  userRegister,
  userLogin,
  userLogout,
  userDetailUpdate,
  userProfilePictureUpdate,
  userProfilePictureDelete,
  currentUserDetail,
  userPasswordChange,
  userProfileDelete,
  refreshAccessToken,
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
router.route("/details-update").patch(verifyJWT,userDetailUpdate)
router.route("/profile-picture-update").patch(verifyJWT,upload.single("profilePicture"),userProfilePictureUpdate)
router.route("/delete-profile-picture").delete(verifyJWT,userProfilePictureDelete)
router.route("/current-user").get(verifyJWT,currentUserDetail)
router.route("/password-change").patch(verifyJWT,userPasswordChange)
router.route("/refresh-token").post(verifyJWT,refreshAccessToken)
router.route("/delete-profile").delete(verifyJWT,userProfileDelete)

export default router;
