// Points System Configuration
// For every $100 spent, user earns 150 points
// For every 500 points, user can redeem for $10

const POINTS_PER_100_DOLLARS = 150;
const DOLLARS_PER_500_POINTS = 10;
const POINTS_FOR_REDEMPTION = 500;

/**
 * Calculate points earned from a payment amount
 * @param {number} amountPaid - The payment amount in dollars
 * @returns {number} Points earned
 */
export function calculatePointsEarned(amountPaid) {
  return Math.floor((amountPaid / 100) * POINTS_PER_100_DOLLARS);
}

/**
 * Calculate dollar value of points being redeemed
 * @param {number} pointsToRedeem - Number of points to redeem
 * @returns {number} Dollar amount
 */
export function calculateRedemptionValue(pointsToRedeem) {
  return (pointsToRedeem / POINTS_FOR_REDEMPTION) * DOLLARS_PER_500_POINTS;
}

/**
 * Validate if points can be redeemed (must be in multiples of 500)
 * @param {number} points - Points to validate
 * @returns {boolean} Whether the points amount is valid for redemption
 */
export function isValidRedemptionAmount(points) {
  return points > 0 && points % POINTS_FOR_REDEMPTION === 0;
}

/**
 * Add points to user after payment
 * @param {Object} user - User document (Student or Staff)
 * @param {number} paymentAmount - Amount paid
 * @param {string} description - Description of the transaction
 * @param {string} registrationId - Related registration ID (optional)
 * @returns {Object} Updated user with new points
 */
export async function addPointsToUser(user, paymentAmount, description, registrationId = null) {
  const pointsEarned = calculatePointsEarned(paymentAmount);
  
  if (pointsEarned > 0) {
    user.points = (user.points || 0) + pointsEarned;
    user.pointsHistory.push({
      points: pointsEarned,
      action: 'earned',
      source: 'payment',
      description: description,
      relatedPaymentAmount: paymentAmount,
      registrationId: registrationId,
      createdAt: new Date()
    });
  }
  
  return user;
}

/**
 * Deduct points from user after payment cancellation
 * @param {Object} user - User document (Student or Staff)
 * @param {number} paymentAmount - Amount that was originally paid
 * @param {string} description - Description of the deduction
 * @param {string} registrationId - Related registration ID (optional)
 * @returns {Object} Updated user with deducted points
 */
export async function deductPointsFromUser(user, paymentAmount, description, registrationId = null) {
  const pointsToDeduct = calculatePointsEarned(paymentAmount);
  
  if (pointsToDeduct > 0) {
    user.points = Math.max(0, (user.points || 0) - pointsToDeduct);
    user.pointsHistory.push({
      points: -pointsToDeduct,
      action: 'deducted',
      source: 'cancellation',
      description: description,
      relatedPaymentAmount: paymentAmount,
      registrationId: registrationId,
      createdAt: new Date()
    });
  }
  
  return user;
}

/**
 * Redeem points for wallet credit
 * @param {Object} user - User document (Student or Staff)
 * @param {number} pointsToRedeem - Points to redeem
 * @returns {Object} Result with success status, new balances, and message
 */
export async function redeemPoints(user, pointsToRedeem) {
  // Validate redemption amount
  if (!isValidRedemptionAmount(pointsToRedeem)) {
    return {
      success: false,
      message: `Points must be redeemed in multiples of ${POINTS_FOR_REDEMPTION}`
    };
  }

  // Check if user has enough points
  if (user.points < pointsToRedeem) {
    return {
      success: false,
      message: 'Insufficient points balance'
    };
  }

  const dollarValue = calculateRedemptionValue(pointsToRedeem);

  // Deduct points and add to wallet
  user.points -= pointsToRedeem;
  user.walletBalance = (user.walletBalance || 0) + dollarValue;

  // Add to history
  user.pointsHistory.push({
    points: -pointsToRedeem,
    action: 'redeemed',
    source: 'redemption',
    description: `Redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)}`,
    createdAt: new Date()
  });

  await user.save();

  return {
    success: true,
    pointsRedeemed: pointsToRedeem,
    dollarValue: dollarValue,
    newPoints: user.points,
    newWalletBalance: user.walletBalance,
    message: `Successfully redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)}`
  };
}

export const POINTS_CONFIG = {
  POINTS_PER_100_DOLLARS,
  DOLLARS_PER_500_POINTS,
  POINTS_FOR_REDEMPTION
};
