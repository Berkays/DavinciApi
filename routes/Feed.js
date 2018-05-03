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



//return user feed
router.get('/', requireAuth, function (req, res) {
    User.findById(req.userId)
        .populate('votes')
        .populate({
            path: 'follows',
            populate: {
                path: 'posts',
                select: { 'owner': 1, 'category': 1, 'fullImage': 1, 'likes': 1, 'dislikes': 1, 'createdAt': 1 },
                options: { limit: 20, sort: { 'createdAt': 'desc' } },
                populate: {
                    path: 'owner category',
                    select: { 'username': 1, 'name': 1 }
                }
            }
        })
        .exec(function (err, data) {
            if (err) {
                res.status(500).json({ result: "bad", message: err.message });
            }
            else {
                var promises = [];
                data.follows.forEach(function (category, i) {

                    category.posts.forEach(function (post, i) {
                        promises.push(sharp(post.fullImage).toBuffer().then(imgData => {
                            post.image = imgData.toString('base64');
                        }));
                    });
                });


                Promise.all(promises).then(() => {
                    res.status(200).json({ result: "ok", message: "Returned posts", data: data});
                });
            }
        });
});

//new post
router.post('/', requireAuth, function (req, res) {
    User.findById(req.userId, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            if (req.body.image && req.body.category) {

                //Posting user id
                var userId = user._id;

                //Unique image id
                var uuid = uuidv4();

                //Post Instance
                var postModel = {
                    owner: userId,
                    fullImage: path.join(UploadBase, uuid + '.webp'),
                    smallImage: path.join(UploadBase, uuid + '-t.webp'),
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

                            var imgBuffer = new Buffer(req.body.image, 'base64');

                            var promises = [];
                            promises.push(
                                sharp(imgBuffer)
                                    .resize(128, 128)
                                    .webp({ quality: 70 }).toFile(post.smallImage));


                            promises.push(
                                sharp(imgBuffer)
                                    .webp({ quality: 80 }).toFile(post.fullImage));

                            Promise.all(promises).then(function () {
                                category.imagecount++;
                                category.posts.push(post._id);
                                category.save();
                                res.status(200).json({ result: "ok", message: "Image uploaded succesfully" });
                            }).catch(function (err) {
                                res.status(400).json({ result: "bad", message: err.message });
                            });
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

//return single post detail
router.post('/getPostDetail', requireAuth, function (req, res) {
    Post.findById(req.body.postId)
        .populate('owner', 'username')
        .populate('category', 'name')
        .exec((err, post) => {
            if (err) {
                res.status(500).json({ result: "bad", message: err.message })
            }
            else {
                sharp(post.smallImage).toBuffer().then(data => {
                    post.image = data.toString('base64');
                    res.status(200).json({ result: "ok", message: "Post returned", post: post })
                });

            }
        });
});

router.post('/getVoteStatus', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {

        var vote = -1;

        for (var i = 0; i < user.votes.length; i++) {
            if (user.votes[i].id == req.body.postId) {
                vote = user.votes[i].vote;
                break;
            }
        }
        res.status(200).json({ result: "ok", message: "Vote returned", vote: vote })
    });
});

router.post('/votePost', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {

        var vote = req.body.vote;
        if (vote >= 1)
            vote = 1;
        else
            vote = 0;

        var index = user.votes.indexOf(req.body.postId);
        if (index == -1) {
            //If didn't voted before

            var insertModel = {
                _id: new mongoose.Types.ObjectId(req.body.postId),
                vote: vote
            }
            user.votes.push(insertModel);
            user.save();
        }

        Post.findById(req.body.postId, (err, post) => {
            if (vote == 1)
                post.likes = post.likes + 1;
            else
                post.dislikes = post.dislikes + 1;

            post.save();
            res.status(200).json({ result: "ok", message: "Voted post" })
        });

    });
});
module.exports = router;