import InputField from "@/components/ui/InputField";
type SignupTabsProps = {
  accountType: string;
  setAccountType: (type: string) => void;
};

export default function SignupTabs({
  accountType,
  setAccountType,
}: SignupTabsProps) {
  return (
    <div className="signup-tabs">
      <button
        type="button"
        className={`tab-btn ${
          accountType === "user" ? "active" : ""
        }`}
        onClick={() => setAccountType("user")}
      >
        👤 นักเดินทาง | Traveler
      </button>

      <button
        type="button"
        className={`tab-btn ${
          accountType === "business" ? "active" : ""
        }`}
        onClick={() => setAccountType("business")}
      >
        🏪 เจ้าของสถานที่ | Business
      </button>
    </div>
  );
}