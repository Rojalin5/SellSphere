import { Payment } from "../models/payment.models.js";
import { Order } from "../models/order.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import stripe from "../utils/Stripe.js";

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency, paymentMethod } = req.body;
  if (!amount) {
    throw new ApiError(400, "Amount is Required.");
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, //Convert to paise
    currency,
    payment_method_types: [paymentMethod],
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      "Payment Intent successfully created."
    )
  );
});
const confirmPayment = asyncHandler(async (req, res) => {
  const {
    orderID,
    amount,
    currency,
    paymentMethod = "Card",
    transactionID,
    paymentStatus = "Success",
    paymentResponse = {},
  } = req.body;
  if (!amount || !transactionID || !orderID) {
    throw new ApiError(
      400,
      "Missing required fields: orderId, transactionID, and amount"
    );
  }
  const payment = await Payment.create({
    order: orderID,
    user: req.user.id,
    amount,
    currency,
    paymentMethod,
    gateway: "Stripe",
    transactionID,
    paymentStatus,
    paymentResponse,
  });
  if(paymentStatus === "Success"){
  await Order.findByIdAndUpdate(orderID, {
    isPaid: true,
    paidAt: new Date(),
    paymentResult: {
      transactionID: transactionID,
      status: paymentStatus,
    },
  });
  res.status(200).json(
    new ApiResponse(200,payment,"Payment confirmed and order marked as paid!")
  )
}
else{
    res.status(200).json(
    new ApiResponse(200,payment,"Payment was unsuccessful Or Pending!")
    )
}
});
export { createPaymentIntent ,confirmPayment};
