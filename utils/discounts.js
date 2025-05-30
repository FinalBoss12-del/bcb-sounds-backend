// utils/discounts.js - Discount code logic
const DISCOUNT_CODES = {
  'BETA50': { type: 'percentage', value: 50, description: '50% off beta discount' },
  'SAVE20': { type: 'percentage', value: 20, description: '20% off' },
  'FIRST10': { type: 'percentage', value: 10, description: '10% off first order' },
  'PODCAST25': { type: 'percentage', value: 25, description: '25% off for podcasters' },
  // Add more discount codes as needed
};

function applyDiscount(originalPrice, discountCode) {
  const code = discountCode.toUpperCase().trim();
  const discount = DISCOUNT_CODES[code];
  
  if (!discount) {
    return {
      valid: false,
      finalPrice: originalPrice,
      discount: null
    };
  }
  
  let discountAmount = 0;
  let finalPrice = originalPrice;
  
  if (discount.type === 'percentage') {
    discountAmount = (originalPrice * discount.value) / 100;
    finalPrice = originalPrice - discountAmount;
  } else if (discount.type === 'fixed') {
    discountAmount = discount.value;
    finalPrice = Math.max(0, originalPrice - discountAmount);
  }
  
  return {
    valid: true,
    finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
    discount: {
      code: code,
      amount: Math.round(discountAmount * 100) / 100,
      description: discount.description
    }
  };
}

module.exports = {
  applyDiscount,
  DISCOUNT_CODES
};
