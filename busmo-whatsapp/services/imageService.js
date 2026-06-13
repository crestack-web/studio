const axios = require('axios');
const sharp = require('sharp');

async function checkQuality(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const meta = await sharp(buffer).metadata();
    if (meta.width >= 400 && meta.height >= 400) {
      return { isGood: true };
    }
    return { isGood: false };
  } catch (err) {
    return { isGood: false };
  }
}

async function findBetterImage(searchQuery) {
  try {
    const pexelsRes = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: searchQuery, per_page: 5, orientation: 'square' },
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    if (pexelsRes.data.photos && pexelsRes.data.photos.length > 0) {
      return pexelsRes.data.photos[0].src.large;
    }
  } catch (err) {}
  try {
    return `https://source.unsplash.com/400x400/?${encodeURIComponent(searchQuery)}`;
  } catch (err) {
    return null;
  }
}

module.exports = { checkQuality, findBetterImage };
