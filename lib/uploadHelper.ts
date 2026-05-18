// อัปโหลด File object ไป /api/upload แล้วคืน URL
export async function uploadFile(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "อัปโหลดไม่สำเร็จ");
  }
  const { url } = await res.json();
  return url;
}

// อัปโหลดหลายไฟล์พร้อมกัน
export async function uploadFiles(files: File[], folder: string): Promise<string[]> {
  return Promise.all(files.map((f) => uploadFile(f, folder)));
}
