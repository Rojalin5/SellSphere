import { Router } from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { createOrder } from "../controllers/order.controller.js";

const  router = Router()

router.route("/product-order").post(verifyJWT,createOrder)

export default router