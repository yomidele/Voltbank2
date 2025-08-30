const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const router = express.Router();

// Middleware to verify token
function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}

// Deposit
router.post("/deposit", auth, async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user);
  user.balance += amount;

  const tx = new Transaction({ user: user._id, type: "Deposit", details: "Cash Deposit", amount });
  await tx.save();
  user.transactions.push(tx._id);
  await user.save();

  res.json({ balance: user.balance, transaction: tx });
});

// Withdraw
router.post("/withdraw", auth, async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user);
  if (amount > user.balance) return res.status(400).json({ msg: "Insufficient funds" });

  user.balance -= amount;

  const tx = new Transaction({ user: user._id, type: "Withdrawal", details: "Cash Withdrawal", amount });
  await tx.save();
  user.transactions.push(tx._id);
  await user.save();

  res.json({ balance: user.balance, transaction: tx });
});

// Transfer to another user
router.post("/transfer", auth, async (req, res) => {
  const { recipient, amount } = req.body;
  const sender = await User.findById(req.user);
  const receiver = await User.findOne({ username: recipient });

  if (!receiver) return res.status(400).json({ msg: "Recipient not found" });
  if (amount > sender.balance) return res.status(400).json({ msg: "Insufficient funds" });

  sender.balance -= amount;
  receiver.balance += amount;

  const txOut = new Transaction({ user: sender._id, type: "Transfer Out", details: `To ${recipient}`, amount });
  const txIn = new Transaction({ user: receiver._id, type: "Transfer In", details: `From ${sender.username}`, amount });

  await txOut.save(); await txIn.save();
  sender.transactions.push(txOut._id);
  receiver.transactions.push(txIn._id);

  await sender.save(); await receiver.save();

  res.json({ balance: sender.balance, transaction: txOut });
});

module.exports = router;