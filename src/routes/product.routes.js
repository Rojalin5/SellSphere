import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
} from "../controllers/product.controller.js";

const router = Router();
router.route("/create-product").post(
  verifyJWT,
  authorizedRole("Admin"),
  upload.fields([
    {
      name: "productImages",
      maxCount: 5,
    },
  ]),
  createProduct
);
router
  .route("/all-products")
  .get(verifyJWT, authorizedRole("Admin"), getAllProducts);
router
  .route("/product/:id")
  .get(verifyJWT, authorizedRole("Admin"), getProductById);
router
  .route("/update-product/:id")
  .patch(verifyJWT, authorizedRole("Admin"), updateProduct);
router
  .route("/delete-product/:id")
  .delete(verifyJWT, authorizedRole("Admin"), deleteProduct);
  router
  .route("/upload-product_img/:id")
  .patch(verifyJWT, authorizedRole("Admin"), uploadProductImage);
  router
  .route("/update-product_img/:id")
  .patch(verifyJWT, authorizedRole("Admin"), updateProductImage); 
  router
  .route("/delete-product_img/:id")
  .delete(verifyJWT, authorizedRole("Admin"), deleteProductImage);
export default router;
