import { Plus } from "lucide-react";
import * as React from "react";

import avatarDefault from "~/assets/images/avatar-default.png";
import { ipfs2https } from "~/lib/ipfs";
import { cn } from "~/lib/utils";

const AVATAR_DEFAULT_SRC = avatarDefault;

const avatarSizeClasses = {
  sm: "size-24",
  md: "size-40",
  lg: "size-[80px]",
} as const;

type AvatarSize = keyof typeof avatarSizeClasses;

const resolveAvatarSrc = (src?: string): string | undefined => {
  if (!src) return undefined;
  if (src.startsWith("ipfs://")) return ipfs2https(src);
  return src;
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: AvatarSize;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = "md", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    const resolvedSrcCandidate = resolveAvatarSrc(src);
    const hasProvidedSrc = Boolean(resolvedSrcCandidate);
    const showProvidedImage = hasProvidedSrc && !imageError;
    const resolvedSrc = showProvidedImage
      ? resolvedSrcCandidate
      : AVATAR_DEFAULT_SRC;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          avatarSizeClasses[size],
          className,
        )}
        {...props}
      >
        <img
          src={resolvedSrc}
          alt={alt ?? ""}
          className="size-full rounded-full object-cover"
          onError={showProvidedImage ? () => setImageError(true) : undefined}
        />
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export interface AvatarUploadProps
  extends Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange"> {
  src?: string;
  alt?: string;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
}

export const AvatarUpload = React.forwardRef<
  HTMLLabelElement,
  AvatarUploadProps
>(({ className, src, alt, onFileSelect, disabled, ...props }, ref) => {
  const resolvedSrc = resolveAvatarSrc(src);
  const interactive = Boolean(onFileSelect) && !disabled;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    onFileSelect?.(file);
    e.target.value = "";
  };

  return (
    <label
      ref={ref}
      className={cn(
        "inline-flex size-[120px] shrink-0 flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[64px] bg-button-tertiary-frame/90",
        interactive && "cursor-pointer",
        className,
      )}
      {...props}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={!interactive}
      />
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt ?? ""}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <>
          <Plus className="size-24 text-white" />
          <span className="text-ui-16 font-bold text-white">画像を選択</span>
        </>
      )}
    </label>
  );
});
AvatarUpload.displayName = "AvatarUpload";
