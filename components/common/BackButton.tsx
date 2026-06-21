"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallback?: string;
  label?: string;
};

export default function BackButton({
  fallback = "/",
  label = "กลับ",
}: Props) {

  const router = useRouter();

  const handleBack = () => {

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }

  };

  return (
    <button
      onClick={handleBack}
      className="floating-back-btn"
    >

      <span className="icon-circle">
        ←
      </span>

      <span>
        {label}
      </span>

    </button>
  );
}