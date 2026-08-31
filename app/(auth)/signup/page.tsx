import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your vault",
  description:
    "Create an Echoes vault, share one link, and keep every message anyone sends you.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
