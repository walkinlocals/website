import { GALLERY_IMAGES } from "@/lib/marketing-content";

export default function HomeGallery() {
  return (
    <section className="relative z-10 border-t border-[#002fa7]/10 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
          {GALLERY_IMAGES.map((image) => (
            <div
              key={image.src}
              className={`group relative overflow-hidden rounded-2xl border border-[#002fa7]/10 bg-slate-100 aspect-[4/3] md:aspect-auto md:min-h-[180px] ${image.className}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#002fa7]/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
