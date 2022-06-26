const axios = require('axios');
const HttpError = require('../models/http-error');

const API_KEY = 'AIzaSyBokgrpK_8g-95JXtP5RXmv0oGETD3T448';

async function getCoordsForAddress(address) {
  
  // return {
  //   lat:35.8147105,
  //   lng:127.1526312
  // }
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
  const data = await response.data;

  if(!data || data.status === 'ZERO_RESULTS'){ 
    const error = new HttpError('Could not find location for the specified address', 422);
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates
} 


module.exports = getCoordsForAddress