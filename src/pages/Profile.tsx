
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { Image } from "image-js";
import PhoneInput from "@/components/PhoneInput";
import AddressInput from "@/components/AddressInput";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUserId(user.id);
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
        }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        });
      }
    };
    fetchUserData();
  }, [navigate, toast]);

  // Handle avatar image upload, crop to square and resize to 300x300, store as a data url
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (!e.target?.result) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to read file",
          });
          setUploading(false);
          return;
        }

        try {
          const img = await Image.load(e.target.result as string);
          const size = Math.min(img.width, img.height);
          const croppedImg = img.crop({
            x: Math.floor((img.width - size) / 2),
            y: Math.floor((img.height - size) / 2),
            width: size,
            height: size,
          });
          const resizedImg = croppedImg.resize({ width: 300, height: 300 });
          const dataUrl = resizedImg.toDataURL();
          setAvatar(dataUrl);
          toast({
            title: "Profile photo ready!",
            description: "Image cropped and ready to save.",
            duration: 1800,
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process profile photo. Please try again.",
          });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile photo. Please try again.",
      });
      setUploading(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!userId) throw new Error("User not found");
      
      // Fixed: Explicitly creating the profile object with the required 'id' field
      const profileData = {
        id: userId,
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avatar
      };
      
      const { error } = await supabase.from("profiles").upsert(profileData);
      if (error) throw error;

      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully.",
        duration: 2000,
      });

      // Redirect to success page
      navigate("/success");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // We'll use the first letter of the name if no avatar
  const avatarFallback = formData.fullName.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12 font-inter">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">
          Create Profile
        </h1>
        <p className="text-gray-500">Tell us more about yourself</p>
      </div>
      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm"
        autoComplete="off"
        style={{ fontFamily: "inherit" }}
      >
        {/* Avatar Upload */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl text-gray-400 font-bold">
                  {avatarFallback}
                </span>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center cursor-pointer"
              htmlFor="avatar-upload"
            >
              <Camera className="h-4 w-4 text-white" />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] font-inter"
              style={{ fontFamily: "inherit" }}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] font-inter"
              style={{ fontFamily: "inherit" }}
              placeholder="Enter your email"
              value={formData.email}
              readOnly
              required
            />
          </div>
          {/* Use PhoneInput for phone number */}
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(val: string) => handleChange("phone", val)}
            />
          </div>
          {/* Use AddressInput for address */}
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <AddressInput
              value={formData.address}
              onChange={(val: string) => handleChange("address", val)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold mt-8 font-inter"
          style={{ fontFamily: "inherit" }}
          disabled={isLoading}
        >
          {isLoading ? "Saving Profile..." : "Save Profile"}
        </button>
      </form>

      {/* Return to Login */}
      <div className="text-center mt-6">
        <p className="text-gray-500">
          Want to go back?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#212529] cursor-pointer font-inter"
            style={{ fontFamily: "inherit" }}
          >
            Return to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Profile;
