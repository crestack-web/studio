const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

// Firebase Secret (already set by you)
const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET");

exports.initializePaystackTransaction = functions
  .runWith({ secrets: [PAYSTACK_SECRET] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { amount, email, reference, metadata } = data;

    if (!amount || !email || !reference) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          amount: amount * 100, // Paystack expects kobo
          email,
          reference,
          metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      console.error("Paystack init error:", error.response?.data || error.message);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to initialize payment"
      );
    }
  });

exports.verifyPaystackTransaction = functions
  .runWith({ secrets: [PAYSTACK_SECRET] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { reference } = data;

    if (!reference) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction reference is required"
      );
    }

    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Paystack verify error:", error.response?.data || error.message);
      throw new functions.https.HttpsError(
        "internal",
        "Payment verification failed"
      );
    }
  });