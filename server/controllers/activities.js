const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Get all activities (with filters)
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
    try {
        const { project, user, entity, limit = 20, page = 1 } = req.query;
        const query = {};

        // If filtering by project, ensure user is a member
        if (project) {
            const projectDoc = await Project.findById(project);
            if (!projectDoc) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }

            const isMember = projectDoc.teamMembers.some(member => member.user.toString() === req.user.id);
            const isCreator = projectDoc.createdBy.toString() === req.user.id;

            if (!isMember && !isCreator) {
                return res.status(403).json({ success: false, error: 'Not authorized to view this project activities' });
            }
            query.project = project;
        } else {
            // If no project specified, filtering by projects user is member of
            const projects = await Project.find({
                $or: [{ createdBy: req.user.id }, { 'teamMembers.user': req.user.id }]
            }).select('_id');
            query.project = { $in: projects.map(p => p._id) };
        }

        if (user) query.user = user;
        if (entity) query.entity = entity;

        const skip = (page - 1) * limit;

        const activities = await Activity.find(query)
            .populate('user', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(query);

        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: activities
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activities for a specific project
// @route   GET /api/projects/:id/activities
// @access  Private
exports.getProjectActivities = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Check if user is member
        const isMember = project.teamMembers.some(member => member.user.toString() === req.user.id);
        const isCreator = project.createdBy.toString() === req.user.id;

        if (!isMember && !isCreator) {
            return res.status(403).json({ success: false, error: 'Not authorized to access this project' });
        }

        const { limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ project: req.params.id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments({ project: req.params.id });

        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: activities
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activities for a specific user
// @route   GET /api/users/:id/activities
// @access  Private
exports.getUserActivities = async (req, res, next) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Find projects user has access to
        const projects = await Project.find({
            $or: [{ createdBy: req.user.id }, { 'teamMembers.user': req.user.id }]
        }).select('_id');

        const projectIds = projects.map(p => p._id);

        const activities = await Activity.find({
            user: req.params.id,
            project: { $in: projectIds }
        })
            .populate('user', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments({
            user: req.params.id,
            project: { $in: projectIds }
        });

        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: activities
        });
    } catch (error) {
        next(error);
    }
};
