import { Router } from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";

import {
    createOrder,
    getUserOrders,
    getMyOrders,
    getOrderById,
    getAllOrders,
    orderStatusUpdate,
    cancelOrder,
    deleteOrder,
    restoreOrder
  }
 from "../controllers/order.controller.js";

const router = Router();

router.route("/product-order").post(verifyJWT, createOrder);
router.route("/get-orders").get(verifyJWT,getUserOrders);
router.route("/getmyorders").get(verifyJWT,getMyOrders)
router.route("/order-ByID/:id").get(verifyJWT,getOrderById)
router.route("/all-orders").get(verifyJWT,authorizedRole("Admin"),getAllOrders)
router.route("/update-status").patch(verifyJWT,authorizedRole("Admin"),orderStatusUpdate)
router.route("/cancel-order/:id").patch(verifyJWT,cancelOrder)
router.route("/delete-order/:id").patch(verifyJWT,authorizedRole("Admin"),deleteOrder)
router.route("/restore-order/:id").patch(verifyJWT,authorizedRole("Admin"),restoreOrder)
export default router;
