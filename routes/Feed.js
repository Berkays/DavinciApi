//Includes
var express = require('express');
var request = require('request');

var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');
var Post = require('../models/PostModel');
var Category = require('../models/CategoryModel');

router.post('/', requireAuth, function (req, res) {
    User.findOne({ username: req.username }, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            if (req.body.image && req.body.category) {

                var userId = user._id;

                //Post Instance
                var postModel = {
                    owner: userId,
                    image: req.body.image,
                    likes: 0,
                    dislikes: 0
                };

                Category.CreateIfNotExists(req.body.category, function (category) {

                    postModel.category = category._id;

                    Post.create(postModel, function (err, post) {

                        if (err) {
                            res.status(500).json({ result: "bad", message: err.message });
                        }
                        else {
                            category.imagecount++;
                            category.posts.push(post._id);
                            category.save();
                            res.status(200).json({ result: "ok", message: "Image uploaded succesfully" });
                        }
                    });
                });
            }
            else {
                res.status(400).json({ result: "bad", message: "Invalid image data" });
            }
        }

    });
});

router.get('/', requireAuth, function (req, res) {
    User.findOne({ username: req.username }, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            Post.find().populate('owner', 'username').populate('category','name').sort({createdAt:'desc'}).exec(function (err, posts) {
                if (err) {
                    res.status(500).json({ result: "bad", message: err.message });
                }
                else {
                    res.status(200).json({ result: "ok", message: "Returned " + posts.length + " posts", posts: posts })
                }
            });
        }
    });
});

module.exports = router;