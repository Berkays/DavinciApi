const mongoose = require('mongoose');
var mongooseHidden = require('mongoose-hidden')()
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        hide:true
    },
    password: {
        type: String,
        required: true,
        hide: true
    },

}, { timestamps: true })

UserSchema.plugin(mongooseHidden);

const User = mongoose.model('User', UserSchema);
module.exports = User;