// In-memory user database
const users = {}; 
let currentUser = null;

function generateAcctNumber(){
  return "9" + Math.floor(100000000 + Math.random()*900000000);
}

function register(){
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if(users[user]){
    alert("User already exists. Please login.");
    return;
  }
  users[user] = {
    password: pass,
    accountNumber: generateAcctNumber(),
    balance: 0,
    transactions: []
  };
  alert("Account created. Please login.");
}

function login(){
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if(!users[user] || users[user].password !== pass){
    alert("Invalid login.");
    return;
  }
  currentUser = users[user];
  document.getElementById("auth").style.display="none";
  document.getElementById("dashboard").style.display="block";
  document.getElementById("userDisplay").textContent = user;
  document.getElementById("acctNumber").textContent = currentUser.accountNumber;
  updateUI();
}

function updateUI(){
  document.getElementById("balance").textContent = currentUser.balance.toFixed(2);
  const tbody = document.querySelector("#txTable tbody");
  tbody.innerHTML = "";
  currentUser.transactions.forEach(tx=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${tx.date}</td><td>${tx.type}</td><td>${tx.details}</td><td>${tx.amount}</td>`;
    tbody.appendChild(tr);
  });
}

function addTx(type, details, amt){
  currentUser.transactions.unshift({
    date: new Date().toLocaleString(),
    type, details, amount: "$"+amt.toFixed(2)
  });
  updateUI();
}

function deposit(){
  const amt = parseFloat(document.getElementById("depositAmt").value);
  if(amt>0){
    currentUser.balance += amt;
    addTx("Deposit", "Cash Deposit", amt);
  }
}

function withdraw(){
  const amt = parseFloat(document.getElementById("withdrawAmt").value);
  if(amt>0 && amt <= currentUser.balance){
    currentUser.balance -= amt;
    addTx("Withdrawal", "Cash Withdrawal", amt);
  } else alert("Insufficient funds.");
}

function transferUser(){
  const recipient = document.getElementById("transferUser").value.trim();
  const amt = parseFloat(document.getElementById("transferAmt").value);
  if(!users[recipient]){ alert("Recipient not found."); return; }
  if(amt>0 && amt <= currentUser.balance){
    currentUser.balance -= amt;
    users[recipient].balance += amt;
    addTx("Transfer Out", "To "+recipient, amt);
    users[recipient].transactions.unshift({
      date: new Date().toLocaleString(),
      type: "Transfer In",
      details: "From "+document.getElementById("userDisplay").textContent,
      amount: "$"+amt.toFixed(2)
    });
    updateUI();
  } else alert("Insufficient funds.");
}

function transferBank(){
  const bank = document.getElementById("extBank").value.trim();
  const acct = document.getElementById("extAcct").value.trim();
  const amt = parseFloat(document.getElementById("extAmt").value);
  if(amt>0 && amt <= currentUser.balance){
    currentUser.balance -= amt;
    addTx("External Transfer", `To ${bank} - ${acct}`, amt);
  } else alert("Insufficient funds.");
}