import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ businessname: string }>;
}

export default async function BusinessProfilePage({ params }: Props) {
  const { businessname } = await params;

  const business = await prisma.business.findFirst({
    where: { businessName: businessname },
    include: {
      places: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!business) notFound();

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
            🏢
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{business.businessName}</h1>
            {business.phone && (
              <p className="text-gray-500 text-sm">📞 {business.phone}</p>
            )}
          </div>
        </div>

        {/* Places */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          สถานที่ ({business.places.length})
        </h2>

        {business.places.length === 0 ? (
          <p className="text-gray-400 text-center py-10">ยังไม่มีสถานที่</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {business.places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.slug}`}
                className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden"
              >
                {place.coverUrl && (
                  <img
                    src={place.coverUrl}
                    alt={place.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{place.title}</h3>
                  <p className="text-sm text-gray-500">{place.province} · {place.district}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
