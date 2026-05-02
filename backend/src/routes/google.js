const { Router } = require('express');
const { query } = require('express-validator');
const {
  getAuthUrl,
  handleCallback,
  getFiles,
  getStorageQuota,
} = require('../controllers/googleController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// Public — frontend redirects user here to start the OAuth flow.
// Expects ?userId=<uuid> so the callback can link tokens to the right account.
router.get(
  '/auth',
  [query('userId').optional().isUUID().withMessage('userId must be a valid UUID')],
  validate,
  getAuthUrl
);

// Public — Google redirects the browser here after user grants consent.
router.get('/callback', handleCallback);

// Protected — require a valid JWT for all data endpoints.
router.get('/files', verifyToken, getFiles);

router.get('/quota', verifyToken, getStorageQuota);

module.exports = router;
