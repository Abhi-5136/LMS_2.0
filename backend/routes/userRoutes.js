const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/users (Admin only)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').populate('borrowedBooks.bookId');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/users/:id/clear-dues (Admin only)
router.post('/:id/clear-dues', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.feeDueStatus = 0;
        await user.save();
        
        res.json({ message: 'Dues cleared successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
