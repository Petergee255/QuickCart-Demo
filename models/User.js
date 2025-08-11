import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // Temporarily make this optional for debugging
    unique: true,
    sparse: true, // This allows multiple documents with null/undefined email
  },
  imageUrl: {
    type: String,
    required: false,
    default: "",
  },
  cartItems: {
    type: Object,
    default: {},
  },
}, { 
  minimize: false,
  timestamps: true
});

// Add a pre-save hook to handle empty emails
userSchema.pre('save', function(next) {
  if (this.email === '') {
    this.email = undefined;
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;