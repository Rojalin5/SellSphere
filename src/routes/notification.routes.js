import express from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";
import {
  createNotification,
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification,
  deleteAnyNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router
  .route("/create-notification")
  .post(verifyJWT, authorizedRole("Admin"), createNotification);
router.route("/get-my-notifications").get(verifyJWT, getUserNotifications);
router
  .route("/get-all-notifications")
  .get(verifyJWT, authorizedRole("Admin"), getAllNotifications);
router.route("/mark-as-read/:notificationID").patch(verifyJWT, markAsRead);
router
  .route("/delete-my-notification/:notificationID")
  .delete(verifyJWT, deleteNotification);
router
  .route("/delete-notifications/:notificationID")
  .delete(verifyJWT, authorizedRole("Admin"), deleteAnyNotification);

export default router;
