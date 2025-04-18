import express from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentByID,
  refundPayment,
  getUserPayments,
  getallPayments,
} from "../controllers/payment.controller.js";
const router = express.Router();

router.route("/create-paymentintent").post(verifyJWT, createPaymentIntent);
router.route("/confirm-payment").post(verifyJWT, confirmPayment);
router
  .route("/webhook", express.raw({ type: "application/json" }))
  .post(handleStripeWebhook);
router.route("/get-payment/:paymentID").get(verifyJWT, getPaymentByID);
router.route("/payment-refund").post(verifyJWT, refundPayment);
router.route("/user/all-payments").get(verifyJWT, getUserPayments);
router
  .route("/admin/allpayments")
  .get(verifyJWT, authorizedRole("Admin"), getallPayments);

export default router;
