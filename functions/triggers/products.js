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
    // Get user's businessId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found."
      );
    }

    const businessId = userDoc.data().businessId;
    if (!businessId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User is not associated with a business."
      );
    }

    // Create product in businesses/{businessId}/products collection
    const productRef = await db
      .collection("businesses")
      .doc(businessId)
      .collection("products")
      .add({
        name,
        sku: sku || "",
        category: category || "Other",
        description: description || "",
        price: parseFloat(sellPrice), // Map to 'price' field to match existing structure
        cost: parseFloat(costPrice), // Map to 'cost' field
        stock: parseInt(openingStock, 10),
        lowStockThreshold: parseInt(lowStockAlert, 10) || 10,
        unit: unit || "piece",
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Optional fields for future features
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
      });

    return { success: true, productId: productRef.id };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "An error occurred while creating the product."
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
    // First, get the user's businessId from the users collection
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found."
      );
    }

    const businessId = userDoc.data().businessId;
    if (!businessId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User is not associated with a business."
      );
    }

    // Fetch products from businesses/{businessId}/products collection
    const productsSnapshot = await db
      .collection("businesses")
      .doc(businessId)
      .collection("products")
      .get();

    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.productName || 'Unnamed Product',
        sku: data.sku || data.attributes?.sku || '',
        category: data.category || 'Other',
        emoji: data.emoji || data.attributes?.emoji || '📦',
        stock: data.stock ?? data.currentStock ?? 0,
        currentStock: data.stock ?? data.currentStock ?? 0,
        costPrice: data.costPrice ?? data.cost ?? 0,
        sellingPrice: data.sellingPrice ?? data.price ?? data.sellPrice ?? 0,
        reorderThreshold: data.lowStockThreshold ?? data.reorderThreshold ?? 10,
        active: data.active ?? true,
        lastSaleDate: data.lastSaleDate || '',
        unitsSold30d: data.unitsSold30d || 0,
      };
    });

    return { success: true, products };
  } catch (error) {
    console.error("Error getting products:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "An error occurred while getting the products."
    );
  }
});

module.exports = {
  createProduct,
  getProducts,
};
