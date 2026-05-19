// lib/uploadHelper.ts
// อัปโหลดรูปพร้อม resize ด้วย Canvas ก่อนส่ง → ลดขนาดไฟล์

/** Resize ภาพด้วย Canvas แล้วแปลงเป็น JPEG */
async function resizeImage(file: File, maxWidth: number, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    // ถ้าเป็น GIF หรือ SVG ไม่ต้อง resize
    if (file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      // scale down ถ้าใหญ่กว่า maxWidth
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // ตั้งชื่อไฟล์ใหม่เป็น .jpg เสมอ
          const newName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

/** กำหนด maxWidth ตาม folder */
function maxWidthFor(folder: string): number {
  if (folder === "avatars")  return 400;
  if (folder === "covers")   return 1600;
  return 1200; // general / trips / places
}

/** อัปโหลดไฟล์เดียวไป /api/upload แล้วคืน URL */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const resized = await resizeImage(file, maxWidthFor(folder));

  const form = new FormData();
  form.append("file", resized);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "อัปโหลดไม่สำเร็จ");
  }
  const { url } = await res.json();
  return url;
}

/** อัปโหลดหลายไฟล์พร้อมกัน */
export async function uploadFiles(files: File[], folder: string): Promise<string[]> {
  return Promise.all(files.map((f) => uploadFile(f, folder)));
}
