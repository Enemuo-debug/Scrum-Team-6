const { Schema, model } = require('mongoose')

const UserSchema = new Schema ({
    user_name: {
        type: String,
        required: true,
    },
    email_address: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    }
})

const UserModel = model('User', UserSchema);

module.exports = UserModel