import { Plus } from "lucide-react";
import * as React from "react";

import avatarDefault from "~/assets/images/avatar-default.png";
import { cn } from "~/lib/utils";

const AVATAR_DEFAULT_SRC = avatarDefault;

const avatarSizeClasses = {
  sm: "size-24",
  md: "size-40",
  lg: "size-[80px]",
} as const;

type AvatarSize = keyof typeof avatarSizeClasses;

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

    const hasProvidedSrc = Boolean(src);
    const showProvidedImage = hasProvidedSrc && !imageError;
    const resolvedSrc = showProvidedImage ? src : AVATAR_DEFAULT_SRC;

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
  extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

export const AvatarUpload = React.forwardRef<HTMLDivElement, AvatarUploadProps>(
  ({ className, src, alt, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex size-[120px] shrink-0 flex-col items-center justify-center gap-[10px] rounded-[64px] bg-button-tertiary-frame/90",
          className,
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? ""}
            className="size-full rounded-full object-cover"
          />
        ) : (
          <>
            <Plus className="size-24 text-white" />
            <span className="text-ui-16 font-bold text-white">画像を選択</span>
          </>
        )}
      </div>
    );
  },
);
AvatarUpload.displayName = "AvatarUpload";
