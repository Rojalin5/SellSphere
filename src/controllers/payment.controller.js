import { Payment } from "../models/payment.models.js";
import { Order } from "../models/order.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import stripe from "../utils/Stripe.js";

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency, paymentMethod, orderID } = req.body;
  if (!amount) {
    throw new ApiError(400, "Amount is Required.");
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, //Convert to paise
    currency,
    payment_method_types: [paymentMethod],
    metadata: {
      orderID,
    },
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
  if (paymentStatus === "Success") {
    await Order.findByIdAndUpdate(orderID, {
      isPaid: true,
      paidAt: new Date(),
      paymentResult: {
        transactionID: transactionID,
        status: paymentStatus,
      },
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          payment,
          "Payment confirmed and order marked as paid!"
        )
      );
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(200, payment, "Payment was unsuccessful Or Pending!")
      );
  }
});
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const rawbody = req.body;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawbody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json(new ApiResponse(400, {}, "Webhook signature verification failed."));
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const { orderID } = paymentIntent?.metadata;
      if (!orderID) {
        return res.status(400).json(new ApiResponse(400, {}, "Missing Metadata:: OrderID"));
      }

      // Check if the payment already exists
      const existingPayment = await Payment.findOne({ order: orderID });
      if (existingPayment) {
        return res.status(400).json(new ApiResponse(400, {}, "Payment already exists for this order."));
      }

      // Create payment record
      const payment = await Payment.create({
        order: orderID,
        user: req.user.id,
        amount: paymentIntent.amount / 100, // Convert cents to currency unit
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method_types?.[0] || "Card",
        gateway: "Stripe",
        transactionID: paymentIntent.id,
        paymentStatus: "Success",
        paymentResponse: paymentIntent,
      });

      // Update order status
      await Order.findByIdAndUpdate(orderID, {
        payment:"success",
        isPaid: true,
        paidAt: new Date(),
        paymentResult: {
          transactionID: paymentIntent.id,
          status: "Success",
        },
      });

      return res.status(200).json(new ApiResponse(200, payment, "Payment recorded and order updated."));

    case "payment_intent.payment_failed":
      return res.status(400).json(new ApiResponse(400, {}, "Payment Failed"));

    case "payment_intent.requires_action":
      return res.status(200).json(new ApiResponse(200, {}, "Payment requires further action."));

    case "payment_intent.canceled":
      return res.status(200).json(new ApiResponse(200, {}, "Payment was canceled."));

    default:
      return res.status(200).json(new ApiResponse(200, {}, "Unhandled event."));
  }
});

const getPaymentByID = asyncHandler(async (req, res) => {
  const { paymentID } = req.params;
  if (!paymentID) {
    throw new ApiError(400, "Payment ID is Required!");
  }
  const payment = await Payment.findById(paymentID);
  if (!payment) {
    throw new ApiError(404, "Payment Record Not Found With This ID.");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, payment, "Payment Detail Fetched Successfully.")
    );
});
const refundPayment = asyncHandler(async (req, res) => {
  const { paymentID } = req.body;
  if (!paymentID) {
    throw new ApiError(400, "Payment ID is Required!");
  }
  const payment = await Payment.findById(paymentID);
  if (!payment) {
    throw new ApiError(404, "Payment Record Not Found With This ID.");
  }
  const refund = await stripe.refunds.create({
    payment_intent: payment.transactionID,
  });
    payment.paymentStatus = "Refunded";
  await payment.save();
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Payment Refunded Successfully."));
});
const getUserPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user.id });
  if (payments.length === 0) {
    throw new ApiError(400, "No Payments Found!");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, payments, "All Payements Fetched Successfully.")
    );
});
const getallPayments = asyncHandler(async (req, res) => {
  const allPayments = await Payment.find();
  res
    .status(200)
    .json(
      new ApiResponse(200, allPayments, "All Payments Fetched Successfully.")
    );
});
export {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentByID,
  refundPayment,
  getUserPayments,
  getallPayments,
};
