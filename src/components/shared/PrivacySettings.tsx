"use client";

import React, { useState } from "react";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { useUpdateUser } from "@/lib/react-query/queriesAndMutations";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { PRIVACY_SETTINGS } from "@/constants";
import Loader from "./Loader";

type PrivacySettingsProps = {
  currentPrivacy: string;
  userId: string;
  onClose?: () => void;
};

const PrivacySettings = ({ currentPrivacy, userId, onClose }: PrivacySettingsProps) => {
  const { user, setUser } = useUserContext();
  const { toast } = useToast();
  const [selectedPrivacy, setSelectedPrivacy] = useState(currentPrivacy || "public");
  const [isUpdating, setIsUpdating] = useState(false);

  const { mutateAsync: updateUser } = useUpdateUser();

  const handlePrivacyUpdate = async () => {
    if (selectedPrivacy === currentPrivacy) {
      toast({
        title: "No changes to save",
        description: "Privacy setting is already set to this value.",
      });
      return;
    }

    if (!user) {
      toast({
        title: "User not found",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser = await updateUser({
        userId: userId,
        privacy_setting: selectedPrivacy as "public" | "private" | "followers_only",
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        file: [],
        imageUrl: user.image_url || undefined,
      });

      if (updatedUser && user) {
        // Update the context
        setUser({
          ...user,
          privacy_setting: updatedUser.privacy_setting,
        });

        const selectedSetting = PRIVACY_SETTINGS.find(s => s.value === selectedPrivacy);
        toast({
          title: "Privacy updated!",
          description: `Your profile is now ${selectedSetting?.label.toLowerCase()}.`,
        });
      }
    } catch (error) {
      console.error("Error updating privacy:", error);
      toast({
        title: "Update failed",
        description: "Failed to update privacy setting. Please try again.",
        variant: "destructive",
      });
      // Reset to original value
      setSelectedPrivacy(currentPrivacy);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentSetting = PRIVACY_SETTINGS.find(s => s.value === selectedPrivacy);

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-xl p-5 space-y-5 max-w-md mx-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-dark-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <img
              src="/assets/icons/profile-placeholder.svg"
              alt="privacy"
              width={16}
              height={16}
              className="invert-white"
            />
          </div>
          <h3 className="text-lg font-semibold text-light-1">Privacy Settings</h3>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-light-3 hover:text-light-1 hover:bg-dark-3 h-8 w-8 p-0"
          >
            ✕
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Question Label */}
        <div>
          <label className="text-light-2 text-sm font-medium mb-3 block">
            Who can see your posts?
          </label>
          
          {/* Custom Privacy Selector */}
          <Select value={selectedPrivacy} onValueChange={setSelectedPrivacy}>
            <SelectTrigger className="w-full h-12 bg-dark-3 border border-dark-4 rounded-lg text-light-1 hover:bg-dark-4 transition-colors">
              <div className="flex items-center gap-3">
                {currentSetting && (
                  <>
                    <span className="text-xl">{currentSetting.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{currentSetting.label}</span>
                      <span className="text-xs text-light-3">{currentSetting.description}</span>
                    </div>
                  </>
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-dark-2 border border-dark-4">
              {PRIVACY_SETTINGS.map((setting) => (
                <SelectItem 
                  key={setting.value} 
                  value={setting.value}
                  className="hover:bg-dark-3 focus:bg-dark-3 cursor-pointer p-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xl">{setting.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-light-1">{setting.label}</span>
                      <span className="text-xs text-light-3">{setting.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Button */}
        <Button
          onClick={handlePrivacyUpdate}
          disabled={isUpdating || selectedPrivacy === currentPrivacy}
          className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <div className="flex items-center gap-2">
              <Loader />
              <span>Updating...</span>
            </div>
          ) : (
            "Update Privacy Setting"
          )}
        </Button>
      </div>
    </div>
  );
};

export default PrivacySettings;
