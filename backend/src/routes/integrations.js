const { Router } = require('express');
const { body, param } = require('express-validator');
const {
  list, getById, create, update, remove, getHistory, getStats,
} = require('../controllers/integrationController');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// All integration routes require authentication
router.use(verifyToken);

const CATEGORIES = [
  'communication','storage','project_management',
  'crm','hr','finance','devtools','analytics','other',
];
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['detected', 'under_review', 'approved', 'blocked'];

router.get('/stats', getStats);

router.get('/', list);

router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  getById
);

router.post(
  '/',
  requireRole('admin', 'analyst'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').isIn(CATEGORIES).withMessage('Invalid category'),
    body('risk_level').optional().isIn(RISK_LEVELS),
    body('status').optional().isIn(STATUSES),
    body('users_count').optional().isInt({ min: 0 }),
    body('monthly_cost').optional().isFloat({ min: 0 }),
    body('url').optional().isURL(),
  ],
  validate,
  create
);

router.patch(
  '/:id',
  requireRole('admin', 'analyst'),
  [
    param('id').isUUID(),
    body('risk_level').optional().isIn(RISK_LEVELS),
    body('status').optional().isIn(STATUSES),
    body('users_count').optional().isInt({ min: 0 }),
    body('monthly_cost').optional().isFloat({ min: 0 }),
    body('url').optional().isURL(),
  ],
  validate,
  update
);

router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isUUID()],
  validate,
  remove
);

router.get(
  '/:id/history',
  [param('id').isUUID()],
  validate,
  getHistory
);

module.exports = router;
