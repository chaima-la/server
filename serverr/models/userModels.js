const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
 
const userSchema = mongoose.Schema({  
    fullname: {
        type: String, 
        required: true,
    }, 
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    plan : {
        type: String,
        enum: ["free", "1month","2months","3months"],
        default: "free",
    },
    planExpiry: {
        type: Date,
    },
    role: {
        type: String,
        default: "user"
    },
});
 
// Hash the password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const hash = await bcrypt.hash(this.password, 8);
            this.password = hash;
        } catch (err) {
            return next(err);
        }
    }
    next();
});
  
// Method to compare passwords
userSchema.methods.ComparePassword = async function(password) {
    const result = await bcrypt.compareSync(password, this.password);
    return result;
};

 
module.exports = mongoose.model("Vendor", userSchema);