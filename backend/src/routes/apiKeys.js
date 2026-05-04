const { Router } = require('express');
const { getMyKeys, saveKeys, deleteKey } = require('../controllers/apiKeysController');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/',               getMyKeys);
router.post('/',              saveKeys);
router.delete('/:service',    deleteKey);

module.exports = router;
