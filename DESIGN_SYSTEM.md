# PAI-LAO Design System  
_Version 1.0 — Phase: Design System Foundation_

---

## โครงสร้างไฟล์ที่เพิ่มเข้ามา

```
app/
  design-tokens.css          ← Single source of truth สีทั้งหมด
  globals.css                ← แก้ไขแล้ว (ลบ class ซ้ำออก)

components/ui/
  action-buttons.css         ← Shared: BackButton, CancelButton, SaveButton
  ActionButtons.tsx          ← React components ของปุ่มทั้ง 3
  form-card.css              ← Shared: SectionCard, FormGrid, Input, Label
```

---

## Color Tokens

| Token | Value | ใช้กับ |
|---|---|---|
| `--pl-blue` | `#4facfe` | ฟ้าหลัก, gradient |
| `--pl-blue-dark` | `#2563eb` | hover, icon circle |
| `--pl-blue-soft` | `#eff6ff` | พื้น en-tag, chip hover |
| `--pl-green` | `#43e97b` | เขียวหลัก, gradient |
| `--pl-green-dark` | `#22a06b` | ปุ่มเพิ่มรูป gallery |
| `--pl-gradient` | `→ blue to green` | Save button, Register button |
| `--pl-red` | `#b91c1c` | ปุ่มยกเลิก ตัวหนังสือ |
| `--pl-red-border` | `#fecaca` | ปุ่มยกเลิก border |
| `--pl-white` | `#ffffff` | พื้นปุ่มยกเลิก, card |
| `--pl-bg` | `#f8fafc` | พื้นหลังทุกหน้า |

---

## Components

### BackButton
```tsx
import { BackButton } from "@/components/ui/ActionButtons";

<BackButton
  href="/business/dashboard"
  label="Dashboard"          // ← ข้อความภาษาอังกฤษ
  labelTh="กลับแดชบอร์ด"   // ← ข้อความภาษาไทย
/>
```

### CancelButton (พื้นขาว, ขอบแดง)
```tsx
import { CancelButton } from "@/components/ui/ActionButtons";

<CancelButton href="/business/dashboard" label="ยกเลิก · Discard" />
```

### SaveButton (gradient ฟ้า→เขียว)
```tsx
import { SaveButton } from "@/components/ui/ActionButtons";

<SaveButton label="บันทึก · Save changes" loading={false} />
```

### ActionBar (wrapper)
```tsx
import { ActionBar, CancelButton, SaveButton } from "@/components/ui/ActionButtons";

<ActionBar>
  <CancelButton href="/business/dashboard" />
  <SaveButton />
</ActionBar>
```

### SectionCard + FormGrid
```tsx
import "@/components/ui/form-card.css";

<div className="ui-section-card">
  <div className="ui-section-hdr">
    <div>
      <h2>ชื่อ Section <span className="ui-en-tag">English Name</span></h2>
      <p>คำอธิบาย · Description</p>
    </div>
  </div>

  <div className="ui-form-grid">
    <div className="ui-field">
      <label>ชื่อ <span className="en">Name</span></label>
      <input className="ui-input" type="text" />
    </div>

    {/* span 2 columns */}
    <div className="ui-field col-full">
      <label>รายละเอียด <span className="en">Description</span></label>
      <textarea className="ui-input textarea" />
    </div>
  </div>
</div>
```

---

## ปัญหาที่แก้ไปแล้ว

| ปัญหาเดิม | วิธีแก้ |
|---|---|
| `.back-btn` ถูก `globals.css` override เป็นสีฟ้า font เท่านั้น | ย้ายมาเป็น `.ui-back-btn` ใน `action-buttons.css` |
| `.cancel-btn` บางหน้าพื้นเทา บางหน้าพื้นขาว | ใช้ `CancelButton` component เดียว พื้นขาวเสมอ |
| `.btn-cancel` / `.cancel-btn` / `.btn-cancel` คนละไฟล์ คนละสไตล์ | Consolidate เป็น `.ui-cancel-btn` ไฟล์เดียว |
| `globals.css` มี `.form-grid` `.form-control` ที่ override หน้าอื่น | แยกออก ใช้ `.ui-form-grid` `.ui-input` แทน |
| `edit-profile` กับ `places/edit` โครงสร้างต่างกัน | ทั้งคู่ใช้ `ui-section-card` + `ui-form-grid` เหมือนกัน |

---

## Migration Guide สำหรับหน้าอื่น

### หน้า `app/business/places/[slug]/edit/page.tsx`
```diff
- className="back-btn"
+ <BackButton href="/business/dashboard" label="Dashboard" />

- className="cancel-btn"
+ <CancelButton href="/business/dashboard" />

- className="save-btn"
+ <SaveButton />
```

### หน้า `app/dashboard/edit-profile/page.tsx` (traveler)
ใช้โครงสร้างเดิม แต่เปลี่ยน class:
```diff
- className="form-control"
+ className="ui-input"

- className="form-group"
+ className="ui-field"

- className="form-card"
+ className="ui-section-card"
```

---

## กฎที่ต้องถือปฏิบัติ

1. **ห้ามเขียน class เฉพาะหน้าใน `globals.css`** — เฉพาะ reset / body / navbar / utility เท่านั้น
2. **ใช้ CSS variable** (`var(--pl-blue)`) เสมอ อย่าใช้ hex โดยตรงในโค้ดใหม่
3. **ปุ่ม action ทุกหน้าต้องใช้ `ActionButtons.tsx`** ไม่เขียน style ปุ่มเองในแต่ละหน้า
4. **Form layout ใช้ `ui-section-card` + `ui-form-grid` + `ui-field` + `ui-input`** ทุกหน้า
5. **ไฟล์ CSS เฉพาะหน้า** (เช่น `edit-profile.css`) มีได้ แต่เฉพาะ layout ของหน้านั้นเท่านั้น ไม่ใช่ component ที่ใช้ร่วม
