"use client";

import * as React from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  CreatorProfile,
  PRESET_AVATARS,
  PresetAvatarId,
  AvatarType,
  getResolvedAvatarUrl,
} from "@/types/profile";
import { AvatarCropModal } from "@/components/settings/AvatarCropModal";

interface AvatarStudioCardProps {
  profile: CreatorProfile | null;
  onProfileUpdated: (updated: CreatorProfile) => void;
}

export function AvatarStudioCard({ profile, onProfileUpdated }: AvatarStudioCardProps) {
  const { user, setOptimisticProfile, refreshUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = React.useState<AvatarType>(profile?.avatar_type || "google");
  const [selectedPresetId, setSelectedPresetId] = React.useState<PresetAvatarId | null>(
    profile?.avatar_preset_id || null
  );
  const [customAvatarUrl, setCustomAvatarUrl] = React.useState<string | null>(
    profile?.custom_avatar_url || null
  );

  // Crop Modal state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = React.useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync state if profile prop changes
  React.useEffect(() => {
    if (profile) {
      setActiveTab(profile.avatar_type);
      setSelectedPresetId(profile.avatar_preset_id);
      setCustomAvatarUrl(profile.custom_avatar_url);
    }
  }, [profile]);

  // Authentic Google OAuth photo URL (never falls back to preset paths)
  const googlePhotoUrl =
    user?.googlePhotoURL ||
    (typeof user?.photoURL === "string" && !user.photoURL.startsWith("/avatars/") ? user.photoURL : null) ||
    (user?.metadata as Record<string, unknown>)?.picture as string ||
    null;

  // Resolve currently active avatar URL for preview
  const currentPreviewUrl = React.useMemo(() => {
    if (activeTab === "google") {
      return googlePhotoUrl;
    }
    if (activeTab === "preset" && selectedPresetId) {
      const preset = PRESET_AVATARS.find((p) => p.id === selectedPresetId);
      return preset?.src || `/avatars/presets/${selectedPresetId}.svg`;
    }
    if (activeTab === "custom" && customAvatarUrl) {
      return customAvatarUrl;
    }
    return googlePhotoUrl;
  }, [activeTab, selectedPresetId, customAvatarUrl, googlePhotoUrl]);

  // Persist avatar selection via PATCH /api/user/profile
  const saveAvatarSelection = async (
    type: AvatarType,
    presetId: PresetAvatarId | null,
    customUrl: string | null
  ) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Immediate optimistic update in AuthContext
    const optimisticUrl =
      type === "google"
        ? googlePhotoUrl
        : type === "preset" && presetId
        ? `/avatars/presets/${presetId}.svg`
        : customUrl;

    setOptimisticProfile({ photoURL: optimisticUrl });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          avatar_type: type,
          avatar_preset_id: type === "preset" ? presetId : null,
          custom_avatar_url: type === "custom" ? customUrl : null,
          avatar_source: type === "google" ? "google" : "manual",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to save avatar preference");
      }

      onProfileUpdated(data.profile);
      if (typeof refreshUser === "function") {
        await refreshUser();
      }
      setSuccessMessage("Avatar updated successfully across your showcase!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error saving avatar";
      setErrorMessage(msg);
      // Revert optimistic update on failure
      const fallbackUrl = getResolvedAvatarUrl(profile, googlePhotoUrl);
      setOptimisticProfile({ photoURL: fallbackUrl });
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to Google Photo
  const handleSelectGoogle = async () => {
    setActiveTab("google");
    setSelectedPresetId(null);
    await saveAvatarSelection("google", null, null);
  };

  // Switch to a Preset Avatar
  const handleSelectPreset = async (presetId: PresetAvatarId) => {
    setActiveTab("preset");
    setSelectedPresetId(presetId);
    await saveAvatarSelection("preset", presetId, null);
  };

  // Custom File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if cancelled
    e.target.value = "";

    // Validate type & size
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrorMessage("File exceeds 1 MB limit. Please select a smaller photo.");
      return;
    }

    setSelectedFile(file);
    setIsCropModalOpen(true);
  };

  // Upload cropped blob to Supabase Storage and persist
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const filename = `avatar_${Date.now()}.webp`;
      const filePath = `${user.id}/${filename}`;

      // Upload to public avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload avatar to cloud storage.");
      }

      // Retrieve public URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const uploadedUrl = publicUrlData.publicUrl;

      setCustomAvatarUrl(uploadedUrl);
      setActiveTab("custom");
      setIsCropModalOpen(false);
      setSelectedFile(null);

      // Persist profile
      await saveAvatarSelection("custom", null, uploadedUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error uploading avatar";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="avatar-studio" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-warm-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-normal inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Avatar Studio</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2.5 py-0.5 rounded-full border border-pink-200 whitespace-nowrap shrink-0">
              Personalize
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Choose your Google photo, select a curated character preset, or upload a custom avatar.
          </p>
        </div>

        {profile?.avatar_source === "manual" ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-dark bg-brand-warm-subtle px-3 py-1 rounded-full border border-brand-warm-border self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google sync disabled</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-muted bg-brand-warm-subtle px-3 py-1 rounded-full border border-brand-warm-border self-start sm:self-auto">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <span>Google synced</span>
          </span>
        )}
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Avatar Preview Bar */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border">
        {/* Dynamic Avatar Display */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-brand-pink/30 shadow-md bg-white flex items-center justify-center">
            {currentPreviewUrl ? (
              <Image
                src={currentPreviewUrl}
                alt={profile?.display_name || user?.displayName || "Avatar"}
                width={96}
                height={96}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-brand-pink via-brand-orange to-brand-purple flex items-center justify-center text-white text-2xl font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || "C"}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving || isUploading}
            aria-label="Upload custom avatar photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-dark text-white hover:bg-brand-pink transition-colors shadow-md border-2 border-white disabled:opacity-50"
            title="Upload custom avatar"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Details & Live Indicator */}
        <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h4 className="text-sm font-bold text-brand-dark">Active Avatar</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
              {activeTab === "google"
                ? "Google Profile"
                : activeTab === "preset"
                ? "Preset Character"
                : "Custom Upload"}
            </span>
          </div>

          <p className="text-xs text-brand-muted max-w-lg leading-relaxed">
            Your avatar is displayed in card headers, the Studio Sidebar, recipient scratch intros, and badge showcases.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Button
              type="button"
              variant={activeTab === "google" ? "primary" : "secondary"}
              size="sm"
              onClick={handleSelectGoogle}
              disabled={isSaving || isUploading || activeTab === "google"}
              className="text-xs gap-1.5"
            >
              {isSaving && activeTab === "google" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Use Google Photo</span>
            </Button>

            <Button
              type="button"
              variant={activeTab === "custom" && customAvatarUrl ? "primary" : "outline"}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving || isUploading}
              className="text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Photo (Max 1MB)</span>
            </Button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Preset Character Avatars Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Platform Preset Avatars (10 Hand-Crafted Characters)
            </h4>
          </div>
          <span className="text-[11px] text-brand-muted">Click to select and apply instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESET_AVATARS.map((preset) => {
            const isSelected = activeTab === "preset" && selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                disabled={isSaving || isUploading}
                aria-pressed={isSelected}
                className={`relative group p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? "bg-brand-pink-light/30 border-brand-pink ring-2 ring-brand-pink shadow-sm"
                    : "bg-white hover:bg-brand-warm-subtle border-brand-warm-border hover:border-brand-pink/40"
                }`}
              >
                {/* Checkmark Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-pink text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                {/* SVG Image */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-warm-subtle ring-2 ring-brand-warm-border group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Image
                    src={preset.src}
                    alt={preset.label}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-0.5 min-w-0 w-full">
                  <p className="text-xs font-bold text-brand-dark truncate">{preset.label}</p>
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider capitalize">
                    {preset.category.replace("-", " ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        file={selectedFile}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedFile(null);
        }}
        onCropComplete={handleCropComplete}
        isUploading={isUploading}
      />
    </div>
  );
}

