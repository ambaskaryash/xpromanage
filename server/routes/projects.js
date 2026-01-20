const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addTeamMember,
    removeTeamMember
} = require('../controllers/projects');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, getProjects)
    .post(protect, authorize('admin', 'manager'), createProject);

router.route('/:id')
    .get(protect, getProject)
    .put(protect, authorize('admin', 'manager'), updateProject)
    .delete(protect, authorize('admin', 'manager'), deleteProject);

router.route('/:id/team')
    .post(protect, authorize('admin', 'manager'), addTeamMember)
    .delete(protect, authorize('admin', 'manager'), removeTeamMember);

module.exports = router;
