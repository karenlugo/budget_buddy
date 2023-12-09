const balanceAmount = document.getElementById("balanceAmount");
const transactionList = document.getElementById("transactionList");
const transactionTypeTabs = document.querySelectorAll(".tab");
const transactionDateInput = document.getElementById("transactionDate");
const fromAccountInput = document.getElementById("fromAccount");
const categoryInput = document.getElementById("category");
const textInput = document.getElementById("text");
const amountInput = document.getElementById("amount");
const saveBtn = document.getElementById("saveBtn");
const currentMonthYear = document.getElementById("currentMonthYear");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
let updateRangeBtn = document.getElementById("updateRangeBtn");
let clearRangeBtn = document.getElementById("clearRangeBtn");

let transactions = [];
let selectedTab = "all"; // Default tab


const incomeCategories = ["Salary", "Bonus", "Other Income"];
const expenseCategories = ["Food", "Rent", "Utilities", "Entertainment", "Other"];

// Initialize the month and year display
function displayCurrentMonthYear() {
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  currentMonthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

// Get the transaction type based on the selected tab
function getSelectedType() {
  return selectedTab.replace('Tab', '');  // 'expense', 'income', or 'all'
}

// Update and display transactions based on filters
function updateAndDisplayTransactions() {
  const startDate = startDateInput.value ? new Date(startDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = endDateInput.value ? new Date(endDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  if(new Date(startDate) - new Date(endDate)>0){
    window.alert("Please Select Valid Date Range");
    return;
  }
  populateTable(getSelectedType(), startDate, endDate);
}

function populateTable(selectedType, startDate, endDate) {
  const transactionList = document.getElementById('transactionList');
  transactionList.innerHTML = ''; // Clear existing transactions
  let filteredTransactions;
  if (selectedType === 'expense') {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.amount < 0 && transactionDate >= startDate && transactionDate <= endDate;
    });
  } else if (selectedType === 'income') {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.amount > 0 && transactionDate >= startDate && transactionDate <= endDate;
    });
  } else {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  if (filteredTransactions.length === 0) {
    // If there are no transactions for the month, show 'No data available.'
    const li = document.createElement("li");
    li.textContent = "No data available for selected range";
    transactionList.appendChild(li);
  } else {
    filteredTransactions.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(b.date) - new Date(a.date);
    });
    const actionTab = document.getElementById('actionTab');
    actionTab.style.display = getSelectedType() == 'all' ? 'none' : 'block';
    filteredTransactions.forEach(transaction => {
      let txnIndex = transactions.indexOf(transaction);
      const listItem = document.createElement('li');
      listItem.classList.add("transaction-item");
      listItem.innerHTML = `
            <div class="transaction-details">
                <span class="transaction-date">${new Date(transaction.date).toUTCString().substring(0,17)}</span>
                <span class="transaction-type">${transaction.amount > 0 ? 'Income' : 'Expense'}</span>
                <span class="transaction-account">${transaction.fromAccount}</span>
                <span class="transaction-category">${transaction.category}</span>
                <span class="transaction-description">${transaction.text}</span>
                <span class="transaction-amount">${transaction.amount >= 0 ? '+' : '-'}$${Math.abs(transaction.amount)}</span>
                <span class="transaction-action-btn" onclick="deleteTransaction(${txnIndex})" style="display:${getSelectedType() == 'all' ? 'none' : 'block'}">DELETE</span>
            </div>
        `;
      transactionList.appendChild(listItem);
    });
  }
}


// Select a tab and update the view
function selectTab(tab) {
  transactionTypeTabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  selectedTab = tab.id;

}

// Add a new transaction
function addTransaction(event) {
  event.preventDefault(); // Prevent the form from submitting in the traditional way

  const date = transactionDateInput.value;
  const fromAccount = fromAccountInput.value;
  const category = categoryInput.value;
  const text = textInput.value.trim();
  let amount = parseFloat(amountInput.value);

  const type = getSelectedType();

  // Validation logic...
  if (type === "expense" && amount < 0) {
    alert("Please enter a positive number for expenses.");
    return false; // Indicate failure to add transaction
  } else if (type === "expense") {
    amount = -Math.abs(amount); // Ensure the amount is negative for expenses
  } else if (type === "income" && amount <= 0) {
    alert("Income amount should be positive.");
    return false; // Indicate failure to add transaction
  }

  if (fromAccount === "" ||category === "" ||date === "" || text === "" || isNaN(amount) || amount === 0) {
    alert("Please enter valid information.");
    return false; // Indicate failure to add transaction
  }

  if (text.length > 20) {
    alert("Description must be 20 characters or less.");
    return false; // Indicate failure to add transaction
  }

  // Assuming transaction creation logic...
  const transaction = {
    type: type,
    date,
    fromAccount,
    category,
    text,
    amount, // Already adjusted for expense or income
  };

  // Add the transaction to your database or storage here
  let result = addTransactionToDatabase(transaction);
  result.then((res) => {
    // Push the transaction to your transactions array or handle it otherwise
    transactions.push(res);
    populateTable(type, new Date(date), new Date(date)); // Refresh the displayed transactions

    // Reset the form to default values after adding the transaction
    resetTransactionForm();
    displaySummary();
    //update chart trend
    updateExpenseIncomeLineChartDisplay(); // Ensure the chart is displayed if necessary
    updateExpenseIncomeLineChart();
    updateExpenseIncomePieChart();
    return true; // Indicate successful addition of transaction
  }).catch(error => console.log(error));

  startDateInput.value = date;
  endDateInput.value = date;
}

function resetTransactionForm() {
  // Reset the date field to the current date after adding the transaction
  const currentDate = new Date().toISOString().substring(0, 10);
  transactionDateInput.value = currentDate;

  // Reset 'From Account' and 'Category' select fields to the first option
  fromAccountInput.selectedIndex = 0;
  categoryInput.selectedIndex = 0;

  // Clear other input fields
  textInput.value = "";
  amountInput.value = "";
}


function populateCategories() {
  // Assuming you have two separate category lists for expenses and income
  const categories = selectedTab === 'expenseTab' ? expenseCategories : incomeCategories;
  // Start with a default option
  categoryInput.innerHTML = '<option value="" disabled selected>Select category</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryInput.appendChild(option);
  });

  if (getSelectedType() == 'all') {
    // Hide the transaction-form
    document.querySelector('.transaction-form').style.display = 'none';
    document.querySelector('.transaction-summary').style.display = 'block';

  }
  else {
    document.querySelector('.transaction-form').style.display = 'block';
    document.querySelector('.transaction-summary').style.display = 'none';

  }
}

function deleteTransaction(index) {
  console.log(index);
  if (!window.confirm("Confirm Delete ?")) {
    return;
  }
  //Delete from Database First
  deleteTransactionFromDatabase(transactions[index]);
  // Directly remove the transaction from the array
  transactions.splice(index, 1);
  // Update the display
  updateAndDisplayTransactions(); // getSelectedType() needs to be defined to return the current filter type
  displaySummary();
  updateExpenseIncomeLineChartDisplay();
  updateExpenseIncomeLineChart();
  updateExpenseIncomePieChart();
  // Update the balance or any other related information
}

initDateTabs();
saveBtn.addEventListener("click", addTransaction);
// selectTab(document.getElementById("allTab"));


function deleteTransactionFromDatabase(txn) {
  console.log(txn);
  fetch('http://localhost:3000/api/transactions', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(txn),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      // Add any success logic here, e.g., update the UI to show the new transaction
    })
    .catch((error) => {
      console.error('Error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error', error.message);
      }
    });
}

async function addTransactionToDatabase(transaction) {

  try {
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
    }
  }
}


//summaryyyy
function displaySummary(inStartDate, inEndDate) {
  // Define startDate and endDate
  let startDate = startDateInput.value ? new Date(startDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth(), 2);
  let endDate = endDateInput.value ? new Date(endDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  startDate = inStartDate != null ? inStartDate : startDate;
  endDate = inEndDate != null ? inEndDate : endDate;

  let totalIncome = 0;
  let totalExpense = 0;
  let accountSummary = {};

  // Filter and process transactions
  transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  }).forEach(transaction => {
    if (transaction.amount > 0) { //income
      totalIncome += transaction.amount;
    } else if (transaction.amount < 0) {  //expense
      totalExpense += Math.abs(transaction.amount);
      // Sum up expenses by account
      accountSummary[transaction.fromAccount] = (accountSummary[transaction.fromAccount] || 0) + Math.abs(transaction.amount);
    }
  });

  // Calculate the overall balance
  let totalBalance = totalIncome - totalExpense;
  // Update the date range in the summary
  document.getElementById('dateRange').textContent = `${startDate.toISOString().substring(0, 10)} ~ ${endDate.toISOString().substring(0, 10)}`;

  // Update the main summary values
  document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
  document.getElementById('totalExpense').textContent = `$${totalExpense.toFixed(2)}`;
  // Store the total balance element since we'll use it to insert rows before it
  const totalBalanceElement = document.getElementById('totalBalance');
  totalBalanceElement.textContent = `$${totalBalance.toFixed(2)}`;

  // Target the summary table's tbody where you want to insert the expense details
  const summaryTableBody = document.querySelector('#summaryTable tbody');

  // Remove previous expense details
  const oldExpenseRows = summaryTableBody.querySelectorAll('.dynamic-expense-row');
  oldExpenseRows.forEach(row => row.remove());

  // Identify the total balance row, assuming it's the last row in the tbody
  const totalBalanceRow = summaryTableBody.lastElementChild;

  // Insert new expense details before the total balance row
  for (let account in accountSummary) {
    const tr = document.createElement('tr');
    tr.classList.add('dynamic-expense-row'); // Add a class for easy removal later
    const tdName = document.createElement('td');
    tdName.textContent = `${account.charAt(0).toUpperCase() + account.slice(1)} Expense:`;
    tdName.style.backgroundColor='antiquewhite';
    const tdAmount = document.createElement('td');
    tdAmount.textContent = `$${accountSummary[account].toFixed(2)}`;
    tdAmount.setAttribute('colspan', '2'); // Adjust the colspan as per the number of columns in your table
    tdAmount.style.backgroundColor='antiquewhite';
    tr.appendChild(tdName);
    tr.appendChild(tdAmount);

    // Insert the new row before the total balance row
    summaryTableBody.insertBefore(tr, totalBalanceRow);
  }

  // Show the summary section
  // document.querySelector('.transaction-summary').style.display = 'block';
}




///chart trend

// Function to create or update the Pie Chart
function updateExpenseIncomePieChart() {
  var ctx = document.getElementById('expenseIncomePieChart').getContext('2d');
  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }
  const startDate = startDateInput.value ? new Date(startDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = endDateInput.value ? new Date(endDateInput.value) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  let labels = null;
  let values = [];
  if (getSelectedType() === 'expense') {
    labels = expenseCategories;
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.amount < 0 && transactionDate >= startDate && transactionDate <= endDate;
    });
    labels.forEach(label=>{
      let total = filteredTransactions.filter(txn=>txn.category===label).reduce((n,{amount})=>n+amount,0);
      values.push(total);
    })
  } else if (getSelectedType() === 'income') {
    labels = incomeCategories;
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.amount > 0 && transactionDate >= startDate && transactionDate <= endDate;
    });
    labels.forEach(label=>{
      let total = filteredTransactions.filter(txn=>txn.category===label).reduce((n,{amount})=>n+amount,0);
      values.push(total);
    })
  }
  else {
    return;
  }
  drawPieChart(labels, values, ctx);

}
function getTotal(x,filteredTransactions)
{
  return 10;
}
function drawPieChart(labels, values, ctx) {
  if (window.pieChart) {
    window.pieChart.destroy();
  }

  window.pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          backgroundColor: getPieChartColors(labels.length),
          data: values
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Expanse or Income"
      }
    }
  });

}

function getPieChartColors(labels_length) {
  const letters = '0123456789ABCDEF';
  const colors = [];
  for (let i = 0; i < labels_length; i++) {
    let color = '#';
    for (let j = 0; j < 6; j++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    colors.push(color);
  }
  return colors;
}


// Function to create or update the expense graph
function updateExpenseIncomeLineChart() {
  var ctx = document.getElementById('expenseIncomeLineChart').getContext('2d');
  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }

  const expensesData = getExpensesData();
  const expenseLabels = expensesData.map(item => item.date);
  const expenseValues = expensesData.map(item => item.expense);

  const incomeData = getIncomeData();
  const incomeValues = incomeData.map(item => item.income);

  let labels = expenseLabels; //Or incomeLabels (use either one as they are same)
  drawExpenseIncomeLineChart(labels, incomeValues, expenseValues, ctx);

}

function drawExpenseIncomeLineChart(labels, incomeValues, expenseValues, ctx) {
  if (window.myChart) {
    window.myChart.data.labels = labels;
    window.myChart.data.datasets[0].data = expenseValues;
    window.myChart.data.datasets[1].data = incomeValues;
    window.myChart.update();
  } else {
    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses Over Time',
          data: expenseValues,
          borderColor: 'rgb(235, 54, 54)',
          backgroundColor: 'rgba(235, 54, 54, 0.2)',
          fill: false,
        },
        {
          label: 'Income Over Time',
          data: incomeValues,
          borderColor: 'rgb(22, 45, 222)',
          backgroundColor: 'rgba(22, 45, 222, 0.2)',
          fill: false,
        }]
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              parser: 'YYYY-MM',
              tooltipFormat: 'MMMM YYYY'
            },
            title: {
              display: true,
              text: 'Month and Year'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Expense Amount'
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        onClick: function (event, elements) {
          if (elements.length > 0) {
            const firstPoint = elements[0];
            if (firstPoint && firstPoint.datasetIndex === 0) {
              const monthIndex = firstPoint.index;
              const clickedMonthLabel = this.data.labels[monthIndex];
              console.log("Clicked on month: ", clickedMonthLabel);
              displayTransactionsForMonth(clickedMonthLabel, 'expense');
            }
            if (firstPoint && firstPoint.datasetIndex === 1) {
              const monthIndex = firstPoint.index;
              const clickedMonthLabel = this.data.labels[monthIndex];
              console.log("Clicked on month: ", clickedMonthLabel);
              displayTransactionsForMonth(clickedMonthLabel, 'income');
            }
          }
        }
      }
    });
  }
}

// Assuming 'transactions' is an array of transaction objects available in the scope
function getIncomeData() {
  const incomeByMonth = {};
  let latestDate = new Date();

  // Find the latest date in the transactions, including future dates
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate > latestDate) {
      latestDate = transactionDate;
    }
  });

  // Find the earliest year in transactions
  let startYear = transactions.reduce((min, p) => {
    const year = new Date(p.date).getFullYear();
    return year < min ? year : min;
  }, new Date().getFullYear());

  const endYear = latestDate.getFullYear();
  const endMonth = latestDate.getMonth();

  // Generate months from the earliest to the latest date
  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? 0 : 0;
    const monthEnd = year === endYear ? endMonth : 11;

    for (let month = monthStart; month <= monthEnd; month++) {
      const label = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      incomeByMonth[label] = 0;
    }
  }

  // Add actual income to the initialized months
  transactions.forEach(transaction => {
    const month = transaction.date.slice(0, 7); // Assumes date is in 'YYYY-MM-DD' format
    if (incomeByMonth.hasOwnProperty(month) && transaction.amount > 0) {
      incomeByMonth[month] += Math.abs(transaction.amount); // Accumulate absolute amounts
    }
  });

  // Convert to the array of {date, income} objects
  return Object.keys(incomeByMonth).map(month => ({
    date: month,
    income: incomeByMonth[month]
  }));
}

// Assuming 'transactions' is an array of transaction objects available in the scope
function getExpensesData() {
  const expensesByMonth = {};
  let latestDate = new Date();

  // Find the latest date in the transactions, including future dates
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate > latestDate) {
      latestDate = transactionDate;
    }
  });

  // Find the earliest year in transactions
  let startYear = transactions.reduce((min, p) => {
    const year = new Date(p.date).getFullYear();
    return year < min ? year : min;
  }, new Date().getFullYear());

  const endYear = latestDate.getFullYear();
  const endMonth = latestDate.getMonth();

  // Generate months from the earliest to the latest date
  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? 0 : 0;
    const monthEnd = year === endYear ? endMonth : 11;

    for (let month = monthStart; month <= monthEnd; month++) {
      const label = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      expensesByMonth[label] = 0;
    }
  }

  // Add actual expenses to the initialized months
  transactions.forEach(transaction => {
    const month = transaction.date.slice(0, 7); // Assumes date is in 'YYYY-MM-DD' format
    if (expensesByMonth.hasOwnProperty(month) && transaction.amount < 0) {
      expensesByMonth[month] += Math.abs(transaction.amount); // Accumulate absolute amounts
    }
  });

  // Convert to the array of {date, expense} objects
  return Object.keys(expensesByMonth).map(month => ({
    date: month,
    expense: expensesByMonth[month]
  }));
}



function displayTransactionsForMonth(monthLabel, expenseOrIncome) {
  let year = monthLabel.substring(0, 4);
  let month = Number(monthLabel.substring(5, 7));
  let startDate = new Date(year, month - 1, 1);
  let endDate = new Date(year, month, 0)
  populateTable(expenseOrIncome, startDate, endDate);
  displaySummary(startDate, endDate);
}


// Call the function to update the graph
// updateExpenseGraph();





function setActiveTab(tabId) {
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Add active class to the specified tab
  document.getElementById(tabId).classList.add('active');
}


// Function to show/hide the chart based on the active tab
function updateExpenseIncomeLineChartDisplay() {
  const lineChartContainer = document.getElementById('expenseIncomeLineChartContainer');
  const pieChartContainer = document.getElementById('expenseIncomePieChartContainer');

  const allTab = document.getElementById('allTab');

  // Check if the chart container and allTab element exist to prevent errors
  if (!lineChartContainer || !allTab) {
    console.error('One or more elements are not found:', {
      chartContainer: lineChartContainer,
      allTab
    });
    return; // Exit the function if any required element is not found
  }

  // Show the chart only if the "All Transactions" tab is active
  if (allTab.classList.contains('active')) {
    lineChartContainer.style.display = 'block';
    pieChartContainer.style.display = 'none';

  } else {
    lineChartContainer.style.display = 'none';
    pieChartContainer.style.display = 'block';
  }
}

// Call this function initially to set the correct display state
updateExpenseIncomeLineChartDisplay();


// Also call this function whenever a tab is changed. This could be inside the event listener for tab changes, for example:
allTab.addEventListener('click', function () {
  this.classList.add('active');
  expenseTab.classList.remove('active');
  incomeTab.classList.remove('active');
  updateExpenseIncomeLineChartDisplay();
});

expenseTab.addEventListener('click', function () {
  this.classList.add('active');
  allTab.classList.remove('active');
  incomeTab.classList.remove('active');
  updateExpenseIncomeLineChartDisplay();
});

incomeTab.addEventListener('click', function () {
  this.classList.add('active');
  allTab.classList.remove('active');
  expenseTab.classList.remove('active');
  updateExpenseIncomeLineChartDisplay();
});



//show transactions upon page load

function fetchTransactions() {
  fetch('/api/transactions')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(fetchedTransactions => {
      transactions = fetchedTransactions;
      updateAndDisplayTransactions(); // Update to display transactions based on the selected tab
      displaySummary();
      updateExpenseIncomeLineChart(); // Update to display transactions based on the selected tab
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}




// Tab click event listener
// Attach click event listeners to each tab
transactionTypeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const previouslySelectedTab = selectedTab;
    selectedTab = tab.id;

    // Log the tab change
    console.log(`Previous tab: ${previouslySelectedTab}, New tab: ${selectedTab}`);

    // Populate categories
    populateCategories();
    // If the tab is reselected, re-fetch or re-display the transactions
    updateAndDisplayTransactions();
    updateExpenseIncomePieChart();
  });
});



// Date range change event listener
updateRangeBtn.addEventListener('click', () => {
  updateAndDisplayTransactions();
  displaySummary();
  updateExpenseIncomePieChart();
});

clearRangeBtn.addEventListener('click', () => {
  initDateTabs();
});

function initDateTabs() {
  let currDate = new Date();
  startDateInput.value = currDate.getFullYear() + "-" + (Number(currDate.getMonth()) + Number(1)) + "-01";
  endDateInput.value = currDate.getFullYear() + "-" + (Number(currDate.getMonth()) + Number(1)) + "-" + (currDate.getDate() < 10 ? "0" : "") + currDate.getDate();
}



// Load transactions and initialize the app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  fetchTransactions();
  displayCurrentMonthYear();
  selectTab(document.getElementById("allTab"));
  getUserName();
});

function getUserName() {
  fetch('/api/getUserName')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(fetchedUsername => {
      fetchedUsername = fetchedUsername.userName;
      DisplayUsername(fetchedUsername); // Update to display transactions based on the selected tab
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

function DisplayUsername(fetchedUsername) {
  // Get the element with id "username"
  const usernameElement = document.getElementById('username');

  // Check if the element exists
  if (usernameElement) {
    // Set the innerHTML of the element to the fetched username
    usernameElement.innerHTML = fetchedUsername;
  } else {
    console.error('Element with id "username" not found.');
  }
}

// Add an event listener to the logout button
document.getElementById('logoutButton').addEventListener('click', function () {
  // Redirect to the logout page
  window.location.href = '/logout';
});


