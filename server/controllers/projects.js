const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find()
            .populate('createdBy', 'name email')
            .populate('teamMembers.user', 'name email avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('teamMembers.user', 'name email avatar department position');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin, Manager)
exports.createProject = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        const project = await Project.create(req.body);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Manager)
exports.updateProject = async (req, res, next) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, Manager)
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        await project.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private (Admin, Manager)
exports.addTeamMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const { userId, role } = req.body;

        // Check if user is already a team member
        const isMember = project.teamMembers.some(
            member => member.user.toString() === userId
        );

        if (isMember) {
            return res.status(400).json({
                success: false,
                message: 'User is already a team member'
            });
        }

        project.teamMembers.push({ user: userId, role });
        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team
// @access  Private (Admin, Manager)
exports.removeTeamMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const { userId } = req.body;

        project.teamMembers = project.teamMembers.filter(
            member => member.user.toString() !== userId
        );

        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};
