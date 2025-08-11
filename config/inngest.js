import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

export const inngest = new Inngest({ id: "quickcart-next" });

export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log("🚀 Starting user creation sync");
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      console.log("Extracted data:", { id, first_name, last_name, email_addresses, image_url });
      
      const email = email_addresses?.[0]?.email_address || "";
      const firstName = first_name || "";
      const lastName = last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";
      
      const userData = {
        _id: id,
        email,
        name: fullName,
        imageUrl: image_url || "",
      };
      
      console.log("User data to save:", userData);

      await connectDB();
      console.log("✅ Database connected");
      
      const savedUser = await User.findOneAndUpdate(
        { _id: id },
        userData,
        { upsert: true, new: true }
      );
      
      console.log("✅ User saved:", savedUser);
      return { success: true, userId: id };
      
    } catch (error) {
      console.error("❌ Error in syncUserCreation:", error);
      throw error;
    }
  }
);

export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log("🔄 Starting user update sync");
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      
      const email = email_addresses?.[0]?.email_address;
      const firstName = first_name || "";
      const lastName = last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Build update object with only defined values
      const userData = {};
      if (email) userData.email = email;
      if (fullName) userData.name = fullName;
      if (image_url !== undefined) userData.imageUrl = image_url;
      
      console.log("Update data:", userData);

      await connectDB();
      console.log("✅ Database connected");
      
      if (Object.keys(userData).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
        console.log("✅ User updated:", updatedUser);
        return { success: true, userId: id, updated: updatedUser };
      } else {
        console.log("ℹ️ No data to update");
        return { success: true, userId: id, message: "No data to update" };
      }
      
    } catch (error) {
      console.error("❌ Error in syncUserUpdation:", error);
      throw error;
    }
  }
);

export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    console.log("🗑️ Starting user deletion sync");
    console.log("Event data:", JSON.stringify(event.data, null, 2));
    
    try {
      const { id } = event.data;
      
      await connectDB();
      console.log("✅ Database connected");
      
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (deletedUser) {
        console.log("✅ User deleted:", deletedUser);
        return { success: true, userId: id, deleted: true };
      } else {
        console.log("ℹ️ User not found for deletion");
        return { success: true, userId: id, deleted: false, message: "User not found" };
      }
      
    } catch (error) {
      console.error("❌ Error in syncUserDeletion:", error);
      throw error;
    }
  }
);