const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment
} = require('../controllers/tasks');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.route('/:id/comments')
    .post(protect, addComment);

module.exports = router;
