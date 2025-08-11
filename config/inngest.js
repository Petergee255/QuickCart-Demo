import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

export const inngest = new Inngest({ id: "quickcart-next" });

export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log("🚀 Starting user creation sync");
    console.log("Full event:", JSON.stringify(event, null, 2));
    
    try {
      // Log the exact structure we're receiving
      console.log("Event data keys:", Object.keys(event.data || {}));
      console.log("Event data:", JSON.stringify(event.data, null, 2));
      
      const { 
        id, 
        first_name, 
        last_name, 
        email_addresses, 
        image_url,
        primary_email_address_id,
        // Alternative field names that Clerk might use
        emailAddresses,
        firstName: altFirstName,
        lastName: altLastName,
        imageUrl: altImageUrl
      } = event.data || {};
      
      console.log("Extracted fields:", {
        id,
        first_name,
        last_name,
        email_addresses,
        image_url,
        primary_email_address_id,
        emailAddresses,
        altFirstName,
        altLastName,
        altImageUrl
      });
      
      // Try multiple ways to get the email
      let email = "";
      
      if (email_addresses && Array.isArray(email_addresses) && email_addresses.length > 0) {
        email = email_addresses[0]?.email_address || "";
        console.log("Email from email_addresses:", email);
      } else if (emailAddresses && Array.isArray(emailAddresses) && emailAddresses.length > 0) {
        email = emailAddresses[0]?.emailAddress || emailAddresses[0]?.email_address || "";
        console.log("Email from emailAddresses:", email);
      } else if (event.data.email) {
        email = event.data.email;
        console.log("Email from direct email field:", email);
      } else {
        console.log("⚠️ No email found in any expected format");
      }
      
      // Try multiple ways to get the name
      const firstName = first_name || altFirstName || "";
      const lastName = last_name || altLastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";
      
      // Try multiple ways to get image URL
      const userImageUrl = image_url || altImageUrl || "";
      
      const userData = {
        _id: id,
        email,
        name: fullName,
        imageUrl: userImageUrl,
      };
      
      console.log("Final user data to save:", userData);
      
      // Validate required fields
      if (!id) {
        throw new Error("User ID is required but not provided");
      }
      
      if (!email) {
        console.log("⚠️ Warning: No email provided, proceeding with empty email");
      }

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
      console.error("Error stack:", error.stack);
      throw error;
    }
  }
);

export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log("🔄 Starting user update sync");
    console.log("Full event:", JSON.stringify(event, null, 2));
    
    try {
      console.log("Event data keys:", Object.keys(event.data || {}));
      
      const { 
        id, 
        first_name, 
        last_name, 
        email_addresses, 
        image_url,
        // Alternative field names
        emailAddresses,
        firstName: altFirstName,
        lastName: altLastName,
        imageUrl: altImageUrl
      } = event.data || {};
      
      // Safe email extraction with multiple fallbacks
      let email = "";
      
      if (email_addresses && Array.isArray(email_addresses) && email_addresses.length > 0) {
        email = email_addresses[0]?.email_address || "";
      } else if (emailAddresses && Array.isArray(emailAddresses) && emailAddresses.length > 0) {
        email = emailAddresses[0]?.emailAddress || emailAddresses[0]?.email_address || "";
      } else if (event.data.email) {
        email = event.data.email;
      }
      
      const userFirstName = first_name || altFirstName || "";
      const userLastName = last_name || altLastName || "";
      const fullName = `${userFirstName} ${userLastName}`.trim();
      const userImageUrl = image_url || altImageUrl;
      
      console.log("Extracted update data:", { id, email, fullName, userImageUrl });
      
      // Build update object with only defined values
      const userData = {};
      if (email) userData.email = email;
      if (fullName) userData.name = fullName;
      if (userImageUrl !== undefined) userData.imageUrl = userImageUrl;
      
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
      console.error("Error stack:", error.stack);
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