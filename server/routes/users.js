const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, getUsers);

router.route('/:id')
    .get(protect, getUser)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
