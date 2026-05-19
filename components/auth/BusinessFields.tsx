import InputField from "@/components/ui/InputField";
export default function BusinessFields() {
  return (
    <div className="full-width">
      <div className="interest-section">
        <h3 style={{ marginBottom: "20px" }}>
          ข้อมูลธุรกิจ | Business Information
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>ชื่อสถานที่</label>

            <input
              type="text"
              className="form-control"
              placeholder="ชื่อร้าน / สถานที่"
            />
          </div>

          <div className="form-group">
            <label>หมวดหมู่</label>

            <select className="form-control">
              <option>เลือกหมวดหมู่</option>
              <option>คาเฟ่</option>
              <option>ร้านอาหาร</option>
              <option>ที่พัก</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>รายละเอียด</label>

            <textarea
              className="form-control"
              placeholder="รายละเอียดธุรกิจ"
              rows={4}
              style={{
                borderRadius: "25px",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}