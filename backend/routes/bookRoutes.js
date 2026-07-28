const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/books (Public or Protected depending on preference, making it protected here)
router.get('/', protect, async (req, res) => {
    try {
        const books = await Book.find({});
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/books (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { title, author, isbn, inventoryCount } = req.body;

        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res.status(400).json({ message: 'Book with this ISBN already exists' });
        }

        const book = await Book.create({
            title,
            author,
            isbn,
            inventoryCount: inventoryCount || 1,
            isAvailable: (inventoryCount || 1) > 0
        });

        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/books/:id/issue (User)
router.post('/:id/issue', protect, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.inventoryCount <= 0 || !book.isAvailable) {
            return res.status(400).json({ message: 'Book is currently not available' });
        }

        const user = await User.findById(userId);
        
        // Check if user already borrowed this book and hasn't returned it
        // For simplicity, we just allow issuing. You could add logic here.
        const alreadyBorrowed = user.borrowedBooks.find(b => b.bookId.toString() === bookId);
        if (alreadyBorrowed) {
           // return res.status(400).json({ message: 'You have already borrowed this book' });
        }

        // Calculate due date (10 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 10);

        // Update User
        user.borrowedBooks.push({
            bookId: book._id,
            issueDate: new Date(),
            dueDate: dueDate
        });
        await user.save();

        // Update Book
        book.inventoryCount -= 1;
        if (book.inventoryCount <= 0) {
            book.isAvailable = false;
        }
        await book.save();

        res.json({ message: 'Book issued successfully', borrowedBooks: user.borrowedBooks });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
