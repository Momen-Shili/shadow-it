const { Router } = require('express');
const authRoutes        = require('./auth');
const integrationRoutes = require('./integrations');
const githubRoutes      = require('./github');
const trelloRoutes      = require('./trello');
const slackRoutes       = require('./slack');
const googleRoutes      = require('./google');
const adminRoutes       = require('./admin');
const apiKeysRoutes     = require('./apiKeys');

const router = Router();

router.use('/auth',         authRoutes);
router.use('/integrations', integrationRoutes);
router.use('/github',       githubRoutes);
router.use('/trello',       trelloRoutes);
router.use('/slack',        slackRoutes);
router.use('/google',       googleRoutes);
router.use('/admin',        adminRoutes);
router.use('/keys',         apiKeysRoutes);

module.exports = router;
