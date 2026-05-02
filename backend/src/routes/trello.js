const { Router } = require('express');
const { param } = require('express-validator');
const { getBoards, getBoardLists, getBoardCards } = require('../controllers/trelloController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

router.use(verifyToken);

router.get('/boards', getBoards);

router.get(
  '/boards/:id/lists',
  [param('id').notEmpty().withMessage('Board id is required')],
  validate,
  getBoardLists
);

router.get(
  '/boards/:id/cards',
  [param('id').notEmpty().withMessage('Board id is required')],
  validate,
  getBoardCards
);

module.exports = router;
