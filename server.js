require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require("path");
const hbs = require("hbs");
const collection = require('./src/mongodb');
const mimeTypes = require("mime-types");

//new
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const { log } = require('console');
const LocalStrategy = require('passport-local').Strategy;




// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
// Define paths for Express config
const templatePath = path.join(__dirname, "./templates");
const publicPath = path.join(__dirname, "./public");  // Corrected the path here

// Set up Handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', templatePath);


// Setup static directory to serve
app.use(express.static(publicPath));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


//new
// Passport and session setup
app.use(session({ secret: "Your_Secret_Key", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Set the MIME type for CSS files
app.use(
  express.static(publicPath, {
    setHeaders: (res, path) => {
      if (mimeTypes.lookup(path) === "text/css") {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

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
    required: true,
    maxlength: [15, 'Description cannot exceed 20 characters'] // Limit of 15 characters
  },
  //new
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection1'
  },
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Transaction API Routes
// app.post('/api/transactions', async (req, res) => {
//   console.log(req.body); 
//   try {
//     const newTransaction = new Transaction(req.body); // Constructing a new Transaction with the request body
//     const savedTransaction = await newTransaction.save(); // Saving it to the database
//     res.status(201).json(savedTransaction); // Sending back the saved transaction
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: error.message, errors: error.errors });
//   }
// });

//new
app.post('/api/transactions', async (req, res) => {
  if (req.isAuthenticated()) {
    const newTransaction = new Transaction({ ...req.body, userId: req.user._id });

    try {
      const savedTransaction = await newTransaction.save(); // Save the transaction
      res.status(201).json(savedTransaction); // Send back the saved transaction
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message, errors: error.errors });
    }

  } else {
    res.status(403).send('Unauthorized');
  }
});

app.delete('/api/transactions', async (req, res) => {
  if (req.isAuthenticated()) {
    
    const newTransaction = new Transaction({ ...req.body});

    try {
      const savedTransaction = await newTransaction.deleteOne(); // Save the transaction
      res.status(201).json(savedTransaction); // Send back the saved transaction
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message, errors: error.errors });
    }

  } else {
    res.status(403).send('Unauthorized');
  }
});


// Authentication Routes
app.get("/", (req, res) => {
  res.render("login", { errorMessage: null, email: "", password: "" });
});


app.get("/signup", (req, res) => {
  res.render("signup");
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  //new
  if (!isValidEmail(email)) {
    return res.render("signup", {
      errorMessage: "Invalid email address!",
      firstName,
      lastName,
      email,
      password,
    });
  }
  if (firstName === "" || lastName === "" || email === "" || password === "") {
    return res.render("signup", {
      errorMessage: "Fields can not be blank.",
      firstName,
      lastName,
      email,
      password,
    });
  }
  try {
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.render("signup", {
        errorMessage: "Email already exists. Please use a different email.",
        firstName,
        lastName,
        email,
        password,
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new collection({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.render("signup", {
      successMessage: "SignUp Successfully. Redirecting you to Login Page...",
      redirectUrl: '/',
    });
    
  } catch (error) {
    console.error(error);
    res.render("signup", {
      errorMessage: "Failed to create account.",
      firstName,
      lastName,
      email,
      password,
    });
  }
});








// app.get("/login", (req, res) => {
//   res.render("login", { errorMessage: null, email: "", password: "" });
// });

// app.post("/login", async (req, res) => {
//   try {
//     const check = await collection.findOne({ email: req.body.email });
//     if (check.password === req.body.password) {
//       // Successful login
//       res.redirect('/budget');
//     } else {
//       res.render("login", {
//         errorMessage: "The password you’ve entered is incorrect.",
//         email: req.body.email,
//         password: "",
//       });
//     }
//   } catch {
//     res.render("login", {
//       errorMessage: "The email you entered isn’t connected to an account.",
//       email: req.body.email,
//       password: "",
//     });
//   }
// });

//new app.post
app.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }

    if (!user) {
      // No user found, display error message
      return res.render('login', { errorMessage: info.message, email: req.body.email });
    }

    req.logIn(user, function (err) {
      if (err) { return next(err); }
      return res.redirect('/budget');
    });
  })(req, res, next);
});


// Serve the budget.html as a static file when /budget is accessed
app.get('/budget', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(publicPath, 'budget.html'));
  }
  else {
    res.redirect('/');
  }
});



//new

// Passport local strategy setup
// Passport local strategy setup
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  console.log('Passport strategy called: email =', email);
  try {
    const user = await collection.findOne({ email: email });
    console.log('User found:', user);
    if (!user) {
      console.log('No user found with email:', email);
      return done(null, false, { message: 'Account does not exists.' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      console.log('Password comparison failed');
      return done(null, false, { message: 'Incorrect password.' });
    }

    console.log('Login successfull');
    return done(null, user);
  } catch (error) {
    console.error('Error in Passport strategy:', error);
    return done(error);
  }
}));


passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await collection.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


app.get('/api/transactions', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const transactions = await Transaction.find({ userId: req.user._id });
      res.json(transactions);  // Ensure this is an array
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(403).send('Unauthorized');
  }
});



// API endpoint to get user name based on email from the cookie
app.get('/api/getUserName', async (req, res) => {

  if (req.isAuthenticated()) {
    try {
      const user = await collection.findOne({ _id: req.user._id });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      console.log(user);

      const capitalizeFirstLetter = (str) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      };

      const userName = capitalizeFirstLetter(user.firstName) + " " + capitalizeFirstLetter(user.lastName);


      res.json({ userName: userName });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(403).send('Unauthorized');
  }
});


// Define the logout route as an API endpoint
app.get('/logout', (req, res) => {
  // Passport exposes a logout() function on the request object, which can be called to log the user out
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});




// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
