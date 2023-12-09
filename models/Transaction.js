const mongoose = require('mongoose');

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
    date: {
      type: Date,
      required: true,
    },
    fromAccount: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: false,
      maxlength: [20, 'Description cannot exceed 15 characters'] // Limit of 15 characters
    },
  });
  
  // Transaction Model
  const Transaction = mongoose.model('Transaction', TransactionSchema);
  module.exports = Transaction;

  

