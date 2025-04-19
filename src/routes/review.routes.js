import express from "express";
import { verifyJWT } from "../middlewares/Authentication.js";
import { authorizedRole } from "../middlewares/roleAuthentication.js";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getAllReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

router.route("/create-review/:productID").post(verifyJWT, createReview);
router
  .route("/get-product-review/:productID")
  .get(verifyJWT, getProductReviews);
router
  .route("/get-all-reviews")
  .get(verifyJWT, authorizedRole("Admin"), getAllReviews);
router.route("/update-review/:reviewID").patch(verifyJWT, updateReview);
router
  .route("/delete-review/:reviewID")
  .delete(verifyJWT, authorizedRole("Admin"), deleteReview);

export default router;
