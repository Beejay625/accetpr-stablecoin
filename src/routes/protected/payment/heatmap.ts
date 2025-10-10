import { Router } from 'express';
import { HeatmapController } from '../../../controllers/payment/heatmapController';
import { asyncHandler } from '../../../errors';

const router = Router();

/**
 * @swagger
 * /protected/payment/sales-heatmap:
 *   get:
 *     summary: Get sales activity heatmap (last 365 days)
 *     description: |
 *       Returns daily sales activity for the last 12 months (365 days) organized as a GitHub-style heatmap grid.
 *       
 *       **Grid Structure:**
 *       - Data is organized into ~52-53 weeks, each containing 7 days (Sun-Sat)
 *       - Each day includes amount (in dollars) and count of succeeded payment intents
 *       - Days with no sales show amount "0.00" and count 0
 *       - Days are ordered chronologically from 365 days ago to today
 *       
 *       **Frontend Rendering Guide:**
 *       ```javascript
 *       // Render the heatmap grid
 *       weeks.forEach((week, weekIndex) => {
 *         week.days.forEach((day) => {
 *           // day.dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, etc.
 *           // weekIndex: column position (0-52)
 *           // day.amount: dollar amount for color intensity
 *           // day.count: number of sales for tooltip
 *           
 *           const intensity = getColorIntensity(day.amount);
 *           renderSquare(weekIndex, day.dayOfWeek, intensity, day);
 *         });
 *       });
 *       
 *       // Helper function to determine color intensity
 *       function getColorIntensity(amount) {
 *         const value = parseFloat(amount);
 *         if (value === 0) return 0;      // No sales
 *         if (value < 50) return 1;       // Low sales
 *         if (value < 200) return 2;      // Medium sales
 *         if (value < 500) return 3;      // High sales
 *         return 4;                       // Very high sales
 *       }
 *       ```
 *       
 *       **Summary Statistics:**
 *       - totalSales: Sum of all succeeded payment amounts (in dollars)
 *       - avgDailySales: Average daily sales across 365 days
 *       - bestDay: Day with highest sales amount (tiebreaker: count)
 *       
 *       **Data Scope:**
 *       - Returns sales data for ALL products created by the authenticated user
 *       - Aggregates succeeded payment intents across all user's products
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales heatmap data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sales heatmap retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     weeks:
 *                       type: array
 *                       description: Array of ~52-53 weeks covering 365 days
 *                       items:
 *                         type: object
 *                         properties:
 *                           weekStartDate:
 *                             type: string
 *                             format: date
 *                             example: "2024-10-06"
 *                             description: Sunday date that starts this week
 *                           days:
 *                             type: array
 *                             description: 7 days of the week (Sun-Sat)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 date:
 *                                   type: string
 *                                   format: date
 *                                   example: "2024-10-07"
 *                                 dayOfWeek:
 *                                   type: integer
 *                                   minimum: 0
 *                                   maximum: 6
 *                                   example: 1
 *                                   description: "0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday"
 *                                 dayName:
 *                                   type: string
 *                                   example: "Mon"
 *                                   enum: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
 *                                 amount:
 *                                   type: string
 *                                   example: "299.99"
 *                                   description: "Sales amount in dollars (2 decimal places)"
 *                                 count:
 *                                   type: integer
 *                                   example: 5
 *                                   description: "Number of succeeded payment intents"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSales:
 *                           type: string
 *                           example: "12450.00"
 *                           description: "Total sales amount across all 365 days (dollars)"
 *                         avgDailySales:
 *                           type: string
 *                           example: "34.11"
 *                           description: "Average daily sales amount (dollars)"
 *                         bestDay:
 *                           type: object
 *                           properties:
 *                             date:
 *                               type: string
 *                               format: date
 *                               example: "2024-12-25"
 *                             dayOfWeek:
 *                               type: integer
 *                               example: 3
 *                             dayName:
 *                               type: string
 *                               example: "Wed"
 *                             amount:
 *                               type: string
 *                               example: "1250.00"
 *                             count:
 *                               type: integer
 *                               example: 15
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-10-10"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2025-10-09"
 *                         totalDays:
 *                           type: integer
 *                           example: 365
 *                         totalWeeks:
 *                           type: integer
 *                           example: 53
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *     examples:
 *       user_products:
 *         summary: Get heatmap for all user's products
 *         value:
 *           url: "/api/v1/protected/payment/sales-heatmap"
 *           description: "Returns sales data aggregated across all products owned by the authenticated user"
 */
router.get('/sales-heatmap', asyncHandler(HeatmapController.getSalesHeatmap));

export default router;
