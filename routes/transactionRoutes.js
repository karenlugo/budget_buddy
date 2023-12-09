console.log('Transaction routes module is loaded');

const express = require('express');
const router = express.Router(); // corrected definition with semicolon
const Transaction = require('../models/Transaction'); // added semicolon

app.use('/api/transactions', transactionRoutes);

// POST route to create a new transaction
router.post('/', async (req, res) => {
    console.log('POST /api/transactions hit');
    const { date, amount, category, description, userId } = req.body;
    try {
        const newTransaction = new Transaction({ date, amount, category, description, userId }); // Ensure 'description' exists in your schema
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET route to get all transactions for a user

// Test route
router.get('/:userId', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

  

// PUT route to update a transaction
router.put('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE route to delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.json({ message: "Transaction deleted", transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
