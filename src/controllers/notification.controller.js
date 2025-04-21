import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.models.js";

const createNotification = asyncHandler(async (req, res) => {
  const { user, message, type } = req.body;
  if (!user || !message || !type) {
    throw new ApiError(400, "Field Missing: All Fiels Are Required.");
  }
  const notification = await Notification.create({
    user,
    message,
    type,
  });
  res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification Created Successfully!")
    );
});
const getUserNotifications = asyncHandler(async (req, res) => {
  const userID = req.user.id;
  const notification = await Notification.find({ user: userID });
  if (notification.length === 0) {
    throw new ApiError(404, "No Notification Found.");
  }
  const totalNotifications = await Notification.countDocuments({
    user: userID,
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        notification,
        "All notifications Fetched Successfully.",
        { Total_Notifications: totalNotifications }
      )
    );
});
const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate(
    "user",
    "name email"
  );
  if (notifications.length === 0) {
    throw new ApiError(404, "No Notification Found.");
  }
  const totalNotifications = await Notification.countDocuments();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        notifications,
        "All Notifications Fetched Successfully.",
        { Total_Notifications: totalNotifications }
      )
    );
});
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationID } = req.params;
  if (!notificationID) {
    throw new ApiError(400, "Notification ID Missing In Query.");
  }
  const notification = await Notification.findById(notificationID);
  if (!notification) {
    throw new ApiError(404, "Notification Not Found With THis ID.");
  }
  notification.isread = true;
  await notification.save();
  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notifications Marked As Read!"));
});
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationID } = req.params;
  const userID = req.user.id;
  if (!notificationID) {
    throw new ApiError(400, "Notification ID Missing In Query.");
  }
  const notification = await Notification.findByIdAndDelete({
    _id: notificationID,
    user: userID,
  });
  if (!notification) {
    throw new ApiError(404, "Notification Not Found With This ID.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification Deleted Successfully."));
});
const deleteAnyNotification = asyncHandler(async (req, res) => {
  const { notificationID } = req.params;
  if (!notificationID) {
    throw new ApiError(400, "Notification ID Missing In Query.");
  }
  const notification = await Notification.findByIdAndDelete(notificationID);
  if (!notification) {
    throw new ApiError(404, "Notification Not Found With THis ID.");
  }
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification Deleted Successfully."));
});

export {
  createNotification,
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification,
  deleteAnyNotification,
};
