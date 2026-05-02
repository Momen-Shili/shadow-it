const { Router } = require('express');
const authRoutes = require('./auth');
const integrationRoutes = require('./integrations');
const githubRoutes = require('./github');
const trelloRoutes = require('./trello');
const slackRoutes = require('./slack');
const googleRoutes = require('./google');

const router = Router();

router.use('/auth', authRoutes);
router.use('/integrations', integrationRoutes);
router.use('/github', githubRoutes);
router.use('/trello', trelloRoutes);
router.use('/slack', slackRoutes);
router.use('/google', googleRoutes);

module.exports = router;
