const { Router } = require('express');
const { getProfile, getRepos, getRecentCommits } = require('../controllers/githubController');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/profile', getProfile);
router.get('/repos', getRepos);
router.get('/commits', getRecentCommits);

module.exports = router;
