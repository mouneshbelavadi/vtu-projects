"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { createClient } from "@/server/supabase/server";

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(60, "Display name must be 60 characters or fewer"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine(
      (val) => val === null || /^\+[1-9]\d{1,14}$/.test(val),
      "Phone number must be in E.164 format (e.g. +919876543210)"
    ),
});

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const authUser = await requireUser("/account");

  const parse = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    phone: formData.get("phone"),
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message || "Validation failed",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parse.data.display_name,
      phone: parse.data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUser.user.id);

  if (error) {
    return {
      status: "error",
      message: "Could not update profile. Please try again.",
    };
  }

  revalidatePath("/account");
  return {
    status: "success",
    message: "Profile updated successfully.",
  };
}
