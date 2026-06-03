function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type ParticipantAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
};

export function ParticipantAvatar({
  name,
  imageUrl,
  size = "md",
}: ParticipantAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 font-semibold text-white`}
      aria-hidden
    >
      {initialsFromName(name) || "?"}
    </span>
  );
}
