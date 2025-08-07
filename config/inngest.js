import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

//Ingest function to save user data to the database
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    // Fixed: Check if email_addresses exists and has at least one item
    const email = email_addresses && email_addresses.length > 0 
      ? email_addresses[0]?.email_address ?? "" 
      : "";

    const userData = {
      _id: id,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      email,
      imageUrl: image_url,
    };

    await connectDB();
    // Fixed: Create new user instance and save it
    const newUser = new User(userData);
    await newUser.save();
  }
);

// Ingest function to update user data in the database
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    // Fixed: Check if email_addresses exists and has at least one item
    const email = email_addresses && email_addresses.length > 0 
      ? email_addresses[0]?.email_address ?? "" 
      : "";

    const userData = {
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      email,
      imageUrl: image_url,
    };

    await connectDB();
    await User.findByIdAndUpdate(id, userData, { new: true });
  }
);

// Ingest function to delete user data from the database
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;

    await connectDB();
    await User.findByIdAndDelete(id);
  }
);