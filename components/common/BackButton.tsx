"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallback?: string;
};

export default function BackButton({
  fallback = "/",
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
        กลับ
      </span>

    </button>
  );
}