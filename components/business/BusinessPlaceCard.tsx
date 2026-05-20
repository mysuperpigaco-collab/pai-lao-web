"use client";

import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  location: string;
  image: string;
  category?: string;
  rating?: string;
};

export default function BusinessPlaceCard({
  slug,
  title,
  location,
  image,
  category,
  rating,
}: Props) {
  return (
    <div className="place-card">
      <div className="image-box">
        <img src={image} alt={title} />

        <div className="overlay">
          <span className="category">
            {category || "PLACE"}
          </span>

          <span className="rating">
            ⭐ {rating || "4.8"}
          </span>
        </div>
      </div>

      <div className="content">
        <h3>
          {title}
        </h3>

        <p>
          📍 {location}
        </p>
      </div>

      <div className="actions">
        <Link
          href={`/place/${slug}`}
          className="view-btn"
        >
          ดูหน้าเพจ
        </Link>
        <Link
          href={`/business/places/${slug}/edit`}
          className="edit-btn"
        >
          ✏️ แก้ไข
        </Link>
      </div>
      <style jsx>{`
        .place-card {
          background: white;

          border-radius: 30px;

          overflow: hidden;

          border: 1px solid #eef2f7;

          transition: 0.35s;

          box-shadow:
            0 10px 30px rgba(15,23,42,0.05);
        }

        .place-card:hover {
          transform: translateY(-8px);

          box-shadow:
            0 24px 60px rgba(15,23,42,0.12);
        }

        .image-box {
          height: 240px;
          overflow: hidden;
          position: relative;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: 0.5s;
        }

        .place-card:hover img {
          transform: scale(1.08);
        }

        .overlay {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              to top,
              rgba(15,23,42,0.85),
              transparent
            );

          display: flex;
          justify-content: space-between;
          align-items: flex-end;

          padding: 18px;
        }
        .category,
        .rating {
          background: rgba(255,255,255,0.16);

          backdrop-filter: blur(10px);

          color: white;

          padding: 8px 14px;

          border-radius: 999px;

          font-size: 12px;

          font-weight: 800;
        }

        .content {
          padding: 24px 24px 18px;
        }

        .content h3 {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .content p {
          color: #64748b;
          font-size: 15px;
        }
        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 0 24px 24px;
        }

        .view-btn,
        .edit-btn {
          text-decoration: none;
          text-align: center;
          padding: 14px;
          border-radius: 16px;
          font-weight: 800;
          transition: 0.25s;
        }

        .view-btn {
          background: #eff6ff;
          color: #2563eb;
        }

        .view-btn:hover {
          background: #dbeafe;
        }

        .edit-btn {
          background:
            linear-gradient(
              135deg,
              #3b82f6,
              #10b981
            );

          color: white;
        }

        .edit-btn:hover {
          transform: translateY(-2px);

          box-shadow:
            0 12px 24px rgba(59,130,246,0.25);
        }
      `}</style>
    </div>
  );
}