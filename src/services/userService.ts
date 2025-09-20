
import User from "../UserModel/UserModel";

export const saveUserInfo = async (userInfo: any) => {
  try {
    console.log("Checking and saving user info:", userInfo);
    const existingUser = await User.findOne({ email: userInfo.email });
    if (existingUser) {
      console.log("User already exists with email:", userInfo.email);
      return existingUser; 
    }
    const newUser = new User(userInfo);
    const savedUser = await newUser.save();
    console.log("New user saved:", savedUser.email);
    return savedUser;
  } catch (error) {
    console.error("Error saving user info:", error);
    throw error;
  }
};


interface SavePhoneInput {
  email: string;
  phoneNumber: string;
}

export const savePhoneNumberService = async ({ email, phoneNumber }: SavePhoneInput) => {
  const user = await User.findOneAndUpdate(
    { email },
    { phoneNumber, isActivated: true },
    { new: true, upsert: true }
  );
  return user;
};
