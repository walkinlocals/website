import Image from "next/image";

const DOOR_IMAGES = [
  "/images/doors/d1.png",
  "/images/doors/d2.png",
] as const;

export default function LoginDoorCollage() {
  return (
    <aside
      className="relative z-10 hidden h-full min-h-[calc(100vh-4rem)] w-full grid-cols-1 grid-rows-2 gap-0 lg:grid"
      style={{ backgroundColor: "#faf9f6" }}
    >
      {DOOR_IMAGES.map((src) => (
        <div key={src} className="relative min-h-0 h-full w-full overflow-hidden">
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
            priority
          />
        </div>
      ))}
    </aside>
  );
}
