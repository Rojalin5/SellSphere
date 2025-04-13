import { Router } from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";

import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  orderStatusUpdate,
  cancelOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.route("/product-order").post(verifyJWT, createOrder);
router.route("/get-orders").get(verifyJWT,getUserOrders);
router.route("/order-ByID/:id").get(verifyJWT,getOrderById)
router.route("/all-orders").get(verifyJWT,authorizedRole("Admin"),getAllOrders)
router.route("update-status").patch(verifyJWT,authorizedRole("Admin"),orderStatusUpdate)
router.route("/cancel-order").patch(verifyJWT,cancelOrder)
export default router;
