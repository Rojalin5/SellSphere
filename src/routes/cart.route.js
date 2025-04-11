import { Router } from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { addToCart, getCartItems } from "../controllers/cart.controller.js";

const router = Router();

router.route("/add-to-cart").post(verifyJWT,addToCart)
router.route("/get-cart-items").get(verifyJWT,getCartItems)

export default router