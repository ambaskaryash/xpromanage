const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'deleted', 'commented', 'assigned', 'completed', 'moved', 'uploaded', 'downloaded']
    },
    entity: {
        type: String,
        required: true,
        enum: ['task', 'project', 'user', 'comment', 'file']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    entityName: {
        type: String,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    changes: {
        type: mongoose.Schema.Types.Mixed
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entity: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });

// Static method to log activity
activitySchema.statics.logActivity = async function (data) {
    try {
        const activity = await this.create(data);
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
};

// Virtual for formatted time
activitySchema.virtual('timeAgo').get(function () {
    const seconds = Math.floor((new Date() - this.createdAt) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return Math.floor(seconds) + ' seconds ago';
});

activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Activity', activitySchema);
