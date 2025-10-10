import { Router } from 'express';
import { requireAdmin } from '../../src/middleware/auth';
import { AdminAnalyticsController } from '../controllers/adminAnalyticsController';
import { asyncHandler } from '../../src/errors';
import { validate } from '../../src/middleware/validate';
import { 
  dateRangeSchema, 
  paginationSchema, 
  productFilterSchema,
  detailedReportSchema 
} from './schemas/admin.schema';

/**
 * Admin Routes
 * 
 * Protected admin-only endpoints for analytics and monitoring.
 * All routes require admin authorization via email whitelist.
 */
export const adminRouter = Router();

// Apply admin middleware to ALL routes in this router
adminRouter.use(requireAdmin);

/**
 * @swagger
 * /protected/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview
 *     description: Returns comprehensive dashboard with revenue, user, product, and system health metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/dashboard', 
  validate(dateRangeSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getDashboard)
);

/**
 * @swagger
 * /protected/admin/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     description: Returns detailed revenue metrics including total revenue, breakdown by status, and top products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7d, 30d, 90d, all]
 *         description: Time period shortcut
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/analytics/revenue',
  validate(dateRangeSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getRevenueAnalytics)
);

/**
 * @swagger
 * /protected/admin/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     description: Returns user activity metrics including total users, new signups, active creators, and growth rates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7d, 30d, 90d, all]
 *         description: Time period shortcut
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/analytics/users',
  validate(dateRangeSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getUserAnalytics)
);

/**
 * @swagger
 * /protected/admin/analytics/products:
 *   get:
 *     summary: Get product analytics
 *     description: Returns product performance statistics including top products, status distribution, and health scores
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of top products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         description: Filter by product status
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/analytics/products',
  validate(productFilterSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getProductAnalytics)
);

/**
 * @swagger
 * /protected/admin/analytics/system-health:
 *   get:
 *     summary: Get system health metrics
 *     description: Returns system health indicators including payment success rates, failure analysis, and recent errors
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of recent failures to return
 *     responses:
 *       200:
 *         description: System health metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/analytics/system-health',
  validate(paginationSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getSystemHealth)
);

/**
 * @swagger
 * /protected/admin/analytics/detailed:
 *   get:
 *     summary: Get detailed analytics report
 *     description: Returns comprehensive analytics report combining all metrics with custom filtering options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7d, 30d, 90d, all]
 *         description: Time period shortcut
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Pagination limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         description: Filter by product status
 *     responses:
 *       200:
 *         description: Detailed report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       422:
 *         description: Validation error - Invalid parameters
 */
adminRouter.get(
  '/analytics/detailed',
  validate(detailedReportSchema, 'query'),
  asyncHandler(AdminAnalyticsController.getDetailedReport)
);

export default adminRouter;

