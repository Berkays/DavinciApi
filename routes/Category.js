//Includes
var express = require('express');
var request = require('request');
var mongoose = require('mongoose');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var path = require('path');
const sharp = require('sharp');

var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');
var Post = require('../models/PostModel');
var Category = require('../models/CategoryModel');

//(un)follow category
router.post('/follow', requireAuth, function (req, res) {
    User.findById(req.userId, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            if (req.body.category) {
                Category.findOne({ name: req.body.category }, function (err, category) {
                    if (err) {
                        res.status(400).json({ result: "bad", message: "Category not found" });
                    }
                    else {
                        if (!user.follows)
                            user.follows = new mongoose.SchemaTypes.Array();

                        index = user.follows.indexOf(category.id);

                        if (index > -1) {
                            user.follows = user.follows.slice(index, 1);
                            user.save();
                            res.status(200).json({ result: "ok", message: "Category unfollowed" });
                        }
                        else {
                            user.follows.push(category._id);
                            user.save();
                            res.status(200).json({ result: "ok", message: "Category followed" });
                        }
                    }
                });
            }
        }
    });
});

//return popular categories with 4 most liked images
router.get('/popularCategories', requireAuth, async function (req, res) {
    //Find categories with most images
    //Find images with most likes from these categories
    Category.find().sort({ imagecount: 'desc' }).limit(5).populate({
        path: 'posts',
        select: { 'smallImage': 1, 'likes': 1 },
        options: { limit: 8 }
    }).sort({ likes: 'desc' }).exec(function (err, categories) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else {
            var promises = [];
            categories.forEach(function (entry, i) {
                var posts = entry["posts"];
                posts.forEach(function (post, i) {
                    promises.push(sharp(post.smallImage).toBuffer().then(data => {
                        post.image = data.toString('base64');
                    }));
                });
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", categories: categories });
            });
        }
    });
});

//autocomplete for category search
router.post('/autocomplete', function (req, res) {
    Category.find({ name: new RegExp('^' + req.body.search, 'g') }).select('name').limit(8).exec(function (err, result) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else {
            res.status(200).json({ result: "ok", message: "ok", results: result })
        }
    });
});

//return matching categories
router.post('/search', function (req, res) {
    Category.find({ name: new RegExp('^' + req.body.category, 'g') }).limit(5).select('name imagecount').populate({
        path: 'posts',
        select: { 'smallImage': 1 },
        options: {
            limit: 4,
            sort: { 'createdAt': 'desc' }
        }
    }).exec(function (err, categories) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else {

            var promises = [];
            categories.forEach(function (entry, i) {
                var posts = entry["posts"];
                posts.forEach(function (post, i) {
                    promises.push(sharp(post.smallImage).toBuffer().then(data => {
                        post.image = data.toString('base64');
                    }));
                });
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", categories: categories });
            });
        }
    });
});

//return category posts with small image
router.post('/', function (req, res) {
    Category.findById(req.body.categoryId).populate({
        path: 'posts',
        select: { 'smallImage': 1 },
        options: {
            sort: { 'createdAt': 'desc' }
        }
    }).exec(function (err, category) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else if (category) {

            var promises = [];
            category.posts.forEach(function (post, i) {
                promises.push(sharp(post.smallImage).toBuffer().then(data => {
                    post.image = data.toString('base64');
                }));
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", category: category });
            });
        }
        else {
            res.status(500).json({ result: "bad", message: "Category not found" });
        }
    });
});

module.exports = router;