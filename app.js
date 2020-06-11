var express= require ("express"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local')
    passportLocalMongoose = require('passport-local-mongoose'),
    User = require('./models/user'),
    Blog = require('./models/blog')
require('dotenv').config()
//App config 
mongoose.connect(process.env.DBURL,{ useNewUrlParser: true,useUnifiedTopology: true })
app.set("view engine","ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))
app.use(expressSanitizer())
app.use(methodOverride("_method"))
//PASSPORT CONFIG
app.use(require('express-session')({
    secret:"Once Again rusty wins cutest dog",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next)=>{
    res.locals.currentUser = req.user
    next()
})
//RESTFUL ROUTES
app.get("/",(req,res)=>{
    res.redirect("/blogs")
})
//INDEX PAGE
app.get("/blogs",(req,res)=>{
    Blog.find({},(err,blogs)=>{
        if(err)
            console.log("ERROR")
        else{
            res.render("index",{blogs:blogs})
        }
    })
})

//new - shows the form
app.get("/blogs/new",isLoggedIn,(req,res)=>{
    res.render("new")
})
//create route
app.post("/blogs",isLoggedIn,(req,res)=>{
    //create blog
    req.body.blog.body = req.sanitize(req.body.blog.body)
    var author={
        id: req.user._id,
        username: req.user.username
    }
    var newBlog = {title: req.body.blog.title,image: req.body.blog.image,body: req.body.blog.body,author:author}
    //console.log(req.body.blog.body)
    console.log(newBlog)
    Blog.create(newBlog,(err,blog)=>{
        if(err)
            res.render("new")
        else
            res.redirect("/blogs")
    })
})

//SHOW ROUTE
app.get("/blogs/:id",(req,res)=>{
    Blog.findById(req.params.id,(err,foundBlog)=>{
        if(err)
           res.redirect("/blogs")
        else{
            res.render("show",{blog:foundBlog})
        }
    })
})

//EDIT ROUTE 
app.get("/blogs/:id/edit",checkBlogOwnership,(req,res)=>{
    Blog.findById(req.params.id,(err,foundBlog)=>{
        if(err)
           res.redirect("/blogs")
        else{
            res.render("edit",{blog:foundBlog})
        }
    })
})
//UPDATE ROUTE
app.put("/blogs/:id",checkBlogOwnership,(req,res)=>{
    req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.findByIdAndUpdate(req.params.id,req.body.blog,(err,updatedBlog)=>{
        if(err)
           res.redirect("/blogs")
        else{
            res.redirect("/blogs/"+req.params.id)
        }
    })
})

//DELETE ROUTE
app.delete("/blogs/:id",checkBlogOwnership,(req,res)=>{
    Blog.findByIdAndRemove(req.params.id,(err)=>{
        if(err)
           res.redirect("/blogs")
        else{
            res.redirect("/blogs")
        }
    })
})
function checkBlogOwnership(req,res,next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id,(err,foundBlog)=>{
            if(err){
                res.redirect("back")
            }
            else{
                //foundCampground.author.id is obj
                //req.user._id is string so we can't use === to compare
                if(foundBlog.author.id.equals(req.user._id))
                {
                    next();
                }else{
                    res.redirect("back")
                }
            }
        })
    }else{
        res.redirect("back")
    }
}
//====================
//AUTH ROUTES
//====================
app.get("/register",(req,res)=>{
    res.render("register")
})
//handle signup
app.post("/register",(req,res)=>{
    var newUser = new User({username: req.body.username})
    User.register(newUser,req.body.password,(err,user)=>{
        if(err){
            console.log(err)
            return res.render('/register')
        }
        passport.authenticate("local")(req,res,()=>{
            res.redirect('/blogs')
        })
    })
})

//show login form
app.get("/login",(req,res)=>{
    res.render("login")
})
//handling login logic
app.post("/login",passport.authenticate("local",{
    successRedirect:"/blogs",
    failureRedirect:"/login"
}),(req,res)=>{
})

app.get("/logout",(req,res)=>{
    req.logOut()
    res.redirect("/blogs")
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}

/*  Blog.remove({},(err,c)=>{
    console.log(c)
})  */
app.listen(4001 || process.env.PORT,()=>{
    console.log("Connected Blog App")
})