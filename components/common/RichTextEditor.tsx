"use client";

/**
 * RichTextEditor — Tiptap rich text editor สำหรับ trip stories
 * Features: H2/H3, Bold, Italic, Underline, Lists, Image upload+compress, Text align
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useRef, useCallback, useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ── Client-side image compress + resize ──────────────────────
const MAX_WIDTH  = 1200; // px
const MAX_HEIGHT = 1200; // px
const QUALITY    = 0.82; // 0-1

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // scale down ถ้าใหญ่เกิน
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          });
          // ใช้ compressed เฉพาะถ้าเล็กกว่า
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/webp",
        QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function RichTextEditor({ value, onChange, placeholder = "เล่าความประทับใจในภาพรวมของทริปนี้..." }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // flag: prevent syncing back content that originated from the editor itself
  const skipSync  = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => { skipSync.current = true; onChange(editor.getHTML()); },
    editorProps: {
      attributes: { class: "rte-content", spellcheck: "false" },
    },
  });

  // sync external value changes (initial data load on edit page, AIPolish apply)
  useEffect(() => {
    if (!editor) return;
    if (skipSync.current) { skipSync.current = false; return; }
    editor.commands.setContent(value || "");
  }, [editor, value]);

  // ── Upload image ────────────────────────────────────────────
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file || !editor) return;
    setUploading(true);
    try {
      // 1. compress
      const compressed = await compressImage(file);
      const sizeMB = (compressed.size / 1024 / 1024).toFixed(2);
      console.info(`Image: ${file.name} → ${sizeMB} MB`);

      if (compressed.size > 5 * 1024 * 1024) {
        alert("รูปยังใหญ่เกิน 5MB หลังจากบีบอัดแล้ว กรุณาใช้รูปที่เล็กกว่า");
        return;
      }

      // 2. upload
      const form = new FormData();
      form.append("file", compressed);
      form.append("folder", "trips/content");
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      } else {
        alert(data.message ?? "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      alert("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  // drag & drop ใน editor
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleImageUpload(file);
  }, [handleImageUpload]);

  if (!editor) return null;

  // ── Toolbar button ──────────────────────────────────────────
  const Btn = ({
    onClick, active = false, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button" title={title} onClick={onClick}
      style={{
        padding: "5px 9px", borderRadius: 7, border: "none",
        background: active ? "#0f172a" : "transparent",
        color: active ? "white" : "#475569",
        cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "0.15s",
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "white" }}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 2, padding: "8px 10px",
        borderBottom: "1.5px solid #f1f5f9", background: "#f8fafc", alignItems: "center",
      }}>
        <Btn title="หัวข้อใหญ่ H2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
        <Btn title="หัวข้อย่อย H3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>

        <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <Btn title="ตัวหนา Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
        <Btn title="ตัวเอียง Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
        <Btn title="ขีดเส้นใต้" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>

        <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <Btn title="รายการ bullet" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>• —</Btn>
        <Btn title="รายการตัวเลข" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</Btn>

        <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <Btn title="ชิดซ้าย" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</Btn>
        <Btn title="กึ่งกลาง" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</Btn>
        <Btn title="ชิดขวา" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</Btn>

        <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <Btn title="เส้นคั่น" onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</Btn>

        {/* Image upload */}
        <button
          type="button"
          title="แทรกรูปภาพ (หรือลากวางได้เลย)"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "5px 12px", borderRadius: 7, border: "none",
            background: uploading ? "#f1f5f9" : "#eff6ff",
            color: uploading ? "#94a3b8" : "#2563eb",
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {uploading ? "⏳ กำลังอัปโหลด..." : "🖼️ แทรกรูป"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />

        {/* hint */}
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
          ลากวางรูปได้เลย · max 1200px auto-compress
        </span>
      </div>

      {/* ── Editor area ── */}
      <EditorContent editor={editor} />

      <style>{`
        .rte-content {
          min-height: 240px; max-height: 640px;
          overflow-y: auto; padding: 16px 18px;
          outline: none; font-size: 15px; line-height: 1.85;
          color: #1e293b; font-family: 'Sarabun', sans-serif;
        }
        .rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #94a3b8;
          pointer-events: none; height: 0;
        }
        .rte-content h2 {
          font-size: 22px; font-weight: 900; color: #0f172a;
          margin: 20px 0 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;
        }
        .rte-content h3 { font-size: 17px; font-weight: 800; color: #1e293b; margin: 16px 0 8px; }
        .rte-content p { margin: 0 0 12px; }
        .rte-content strong { font-weight: 800; }
        .rte-content em { font-style: italic; }
        .rte-content u { text-decoration: underline; }
        .rte-content ul, .rte-content ol { padding-left: 24px; margin: 8px 0 12px; }
        .rte-content li { margin-bottom: 4px; }
        .rte-content img {
          max-width: 100%; height: auto; border-radius: 12px;
          margin: 16px auto; display: block;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          cursor: pointer; object-fit: cover;
        }
        .rte-content img.ProseMirror-selectednode {
          outline: 3px solid #4facfe; border-radius: 12px;
        }
        .rte-content hr { border: none; border-top: 2px solid #f1f5f9; margin: 24px 0; }
        .ProseMirror-focused { outline: none; }
      `}</style>
    </div>
  );
}
