const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');

mongoose.connect(config.database);
let db = mongoose.connection;

// Check Connection
db.once('open', function() {
    console.log('Connected to Mongodb');
})

//Check for db errors
db.on('error', function(err) {
    console.log(err);
});

// Init the app
const app = express();

// Bring in Models
let Post = require('./models/post')

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Set Static Folder
app.use(express.static('public'));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res)();
  next();
});

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
  
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
}));

// Passport config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next) {
    res.locals.user = req.user || null;
    next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Home Route
app.get('/', function(req, res) {
    Post.find({}, null, {sort: '-votes'}, function(err, posts) {
        if(err){
            console.log(err);
        } else {
            res.render('home', {
                posts: posts
            });
        }
    });
});

// Home Route -- Keep Safe --
app.get('/', function(req, res) {
    Post.find({}, function(err, posts) {
        if(err){
            console.log(err);
        } else {
            res.render('home', {
                posts: posts
            });
        }
    });
});

// Route Files
let posts = require('./routes/posts');
let users = require('./routes/users');
app.use('/posts', posts);
app.use('/users', users);

// var tutorials = require('./routes/tutorials');
// app.use('/tutorials', tutorials);

app.set('port', (process.env.PORT || 8000));

app.listen(app.get('port'), function () {
    console.log('Server started');
});