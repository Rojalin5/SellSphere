import { Router } from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { addToCart, clearCart, deleteCartItem, getCartItems, updateCartItem } from "../controllers/cart.controller.js";

const router = Router();

router.route("/add-to-cart").post(verifyJWT,addToCart)
router.route("/get-cart-items").get(verifyJWT,getCartItems)
router.route("/update-cart").patch(verifyJWT,updateCartItem)
router.route("/delete-cart-items/:id").delete(verifyJWT,deleteCartItem)
router.route("/clear-cart").delete(verifyJWT,clearCart)

export default router