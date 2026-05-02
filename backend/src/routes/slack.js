const { Router } = require('express');
const { param } = require('express-validator');
const { getWorkspaceInfo, getChannels, getChannelMessages } = require('../controllers/slackController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

router.use(verifyToken);

router.get('/workspace', getWorkspaceInfo);

router.get('/channels', getChannels);

router.get(
  '/channels/:id/messages',
  [param('id').notEmpty().withMessage('Channel id is required')],
  validate,
  getChannelMessages
);

module.exports = router;
