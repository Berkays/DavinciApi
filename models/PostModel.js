const mongoose = require('mongoose');
var mongooseHidden = require('mongoose-hidden')()
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: Buffer },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
    privacy: { type: Number, default: 0, min: 0, max: 1 }
}, { timestamps: true })

PostSchema.plugin(mongooseHidden);

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;