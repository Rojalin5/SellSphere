import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    uploadProductImage,
    updateProductImage,
    deleteProductImage,
    deleteProduct,
    filterProductBySearch,
    getProductByCategory,
    getReleatedProducts,
    getLatestProducts,
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
  .route("/upload-product_img/:id")
  .patch(
    verifyJWT,
    authorizedRole("Admin"),
    upload.fields([{ name: "productImages", maxCount: 5 }]),
    uploadProductImage
  );
router
  .route("/update-product_img/:id")
  .patch(
    verifyJWT,
    authorizedRole("Admin"),
    upload.fields([{ name: "productImages", maxCount: 5 }]),
    updateProductImage
  );
router
  .route("/delete-product_img/:id")
  .delete(verifyJWT, authorizedRole("Admin"), deleteProductImage);
router
  .route("/delete-product/:id")
  .delete(verifyJWT, authorizedRole("Admin"), deleteProduct);

router.route("/filter-product").get(verifyJWT, filterProductBySearch);
router.route("/products/category/:category").get(verifyJWT,getProductByCategory);
router.route("/releated-products/:id").get(verifyJWT, getReleatedProducts);
router.route("/latest-products").get(verifyJWT, getLatestProducts);
export default router;
