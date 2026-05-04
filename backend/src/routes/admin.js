const { Router } = require('express');
const {
  getMembers,
  approveMember,
  rejectMember,
  getMemberDashboard,
  getTeamStats,
  getActivityLogs,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyToken, requireRole('admin'));

router.get('/members',                     getMembers);
router.patch('/members/:id/approve',       approveMember);
router.patch('/members/:id/reject',        rejectMember);
router.get('/members/:id/dashboard',       getMemberDashboard);
router.get('/stats',                       getTeamStats);
router.get('/logs',                        getActivityLogs);

module.exports = router;
