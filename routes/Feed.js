//Includes
var express = require('express');
var request = require('request');

var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');
var Image = require('../models/ImageModel');

router.post('/upload', requireAuth, function (req, res) {
    User.findOne({ username: req.username }, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            var userId = user._id;
            var imageInstance = {
                owner: userId,
                data: "YmVya2F5",
                category: "Nature"
            };
            Image.create(imageInstance, function (err, image) {

                if (err) {
                    res.status(500).json({ result: "bad", message: err.message });
                }
                else {
                    res.status(200).json({ result: "ok", message: "Image uploaded succesfully" });
                }
            });
        }

    });
});

router.get('/list', requireAuth, function (req, res) {
    User.findOne({ username: req.username }, function (err, user) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            Image.find({ owner: user._id }).exec(function (err, images) {
                if (err) {
                    res.status(500).json({ result: "bad", message: err.message });
                }
                else {
                    res.status(200).json({ result: "ok", images: images })
                }
            });
        }
    });
});

module.exports = router;