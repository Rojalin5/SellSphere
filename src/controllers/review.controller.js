import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/review.models.js";

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productID } = req.params;
  if (!rating || !comment) {
    throw new ApiError(400, "Rating and Comment are Required");
  }
  if (!productID) {
    throw new ApiError(400, "Product ID Missing in Query.");
  }
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating should be between 1 to 5.");
  }
  const alreadyReviewed = await Review.findOne({
    user: req.user.id,
    product: productID,
  });
  if (alreadyReviewed) {
    throw new ApiError(400, "You Have Already Reviewed This Product.");
  }
  const review = await Review.create({
    user: req.user.id,
    product: productID,
    rating,
    comment,
  });
  await review.save();
  res
    .status(200)
    .json(new ApiResponse(200, review, "Review Added Successfully!"));
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { productID } = req.params;
  if (!productID) {
    throw new ApiError(400, "productID is Required!");
  }
  const review = await Review.find({ product: productID }).populate(
    "user",
    "name email"
  );
  if (review.length === 0) {
    throw new ApiError(404, "No Review Foound.");
  }
  const totalReviews = await Review.countDocuments({ product: productID });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        review,
        "All Review of this Product Fetched Successfully!",
        { totalReviews: totalReviews }
      )
    );
});
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "name ,email")
    .populate("product", "name ,price");
  res
    .status(200)
    .json(new ApiResponse(200, reviews, "All Reviews Fetched Successfully."));
});
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const {reviewID} = req.params;
  if (!rating && !comment) {
    throw new ApiError(400, "Atleast One Field Is Required To Update Review.");
  }
  if (!reviewID) {
    throw new ApiError(400, "Review ID Missing in Query.");
  }
  const review = await Review.findById(reviewID);
  if (!review) {
    throw new ApiError(404, "Review Not Found With This ID.");
  }
  if (rating) review.rating = rating;
  if (comment) review.comment = comment;
  await review.save();
  res
    .status(200)
    .json(new ApiResponse(200, review, "Review Updated Successfully."));
});
const deleteReview = asyncHandler(async (req, res) => {
  const {reviewID} = req.params;
  if (!reviewID) {
    throw new ApiError(400, "Review ID Missing in Query.");
  }
  const review = await Review.findByIdAndDelete(reviewID);
  if (!review) {
    throw new ApiError(404, "Review Not Found With This ID.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Review Deleted Successfully."));
});

export {
  createReview,
  getProductReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};