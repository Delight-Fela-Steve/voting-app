type ParticipantAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

const sizeClasses = {
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl sm:h-20 sm:w-20",
};

export function ParticipantAvatar({
  name,
  imageUrl,
  size = "lg",
  className = "",
}: ParticipantAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} rounded-xl object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 font-semibold text-white shadow-inner ${className}`}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  );
}
