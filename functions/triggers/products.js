const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

const createProduct = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {
    name,
    sku,
    category,
    description,
    sellPrice,
    costPrice,
    openingStock,
    lowStockAlert,
    unit,
    hasExpiry,
    expiryDate,
    hasVariants,
    variantType,
    variantValues,
    useDefaultDelivery,
    selectedCountries,
    deliveryTime,
    shippingFeeOverride,
    manualSale,
    onlineStore,
  } = data;

  // Basic validation
  if (!name || !sellPrice || !costPrice || !openingStock) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required product fields."
    );
  }

  const uid = context.auth.uid;

  try {
    const productRef = await db.collection("users").doc(uid).collection("products").add({
      name,
      sku: sku || "",
      category: category || "Other",
      description: description || "",
      sellPrice: parseFloat(sellPrice),
      costPrice: parseFloat(costPrice),
      currentStock: parseInt(openingStock, 10),
      reorderThreshold: parseInt(lowStockAlert, 10) || 0,
      unit: unit || "piece",
      hasExpiry: !!hasExpiry,
      expiryDate: hasExpiry && expiryDate ? expiryDate : null,
      hasVariants: !!hasVariants,
      variantType: hasVariants ? variantType : null,
      variantValues: hasVariants ? variantValues : null,
      useDefaultDelivery: !!useDefaultDelivery,
      selectedCountries: selectedCountries || [],
      deliveryTime: deliveryTime || null,
      shippingFeeOverride: shippingFeeOverride || null,
      manualSale: !!manualSale,
      onlineStore: !!onlineStore,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, productId: productRef.id };
  } catch (error) {
    console.error("Error creating product:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while creating the product."
    );
  }
});

const getProducts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;

  try {
    const productsSnapshot = await db.collection("users").doc(uid).collection("products").get();
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, products };
  } catch (error) {
    console.error("Error getting products:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while getting the products."
    );
  }
});

module.exports = {
  createProduct,
  getProducts,
};
