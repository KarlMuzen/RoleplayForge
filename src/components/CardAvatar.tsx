import React from 'react';
import { User } from 'lucide-react';

export interface CardAvatarProps {
  src?: string | null;
  name?: string | null;
  alt: string;
  className: string;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
  loading?: React.ImgHTMLAttributes<HTMLImageElement>['loading'];
  fallbackClassName?: string;
  fallbackIconClassName?: string;
  emptyLabel?: string;
}

export const CardAvatar: React.FC<CardAvatarProps> = ({
  src,
  name,
  alt,
  className,
  referrerPolicy,
  loading,
  fallbackClassName = 'text-sm',
  fallbackIconClassName = 'w-8 h-8',
  emptyLabel,
}) => {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] || '')
    .join('')
    .toUpperCase();
  const showImage = Boolean(src) && failedSrc !== src;

  return showImage ? (
    <img
      src={src!}
      alt={alt}
      referrerPolicy={referrerPolicy}
      loading={loading}
      className={className}
      onError={() => {
        if (src) setFailedSrc(src);
      }}
    />
  ) : (
    <div className="flex flex-col items-center justify-center w-full h-full bg-void-900/50 text-knight-500 font-semibold text-center">
      {initials ? (
        <span className={fallbackClassName}>{initials}</span>
      ) : (
        <User className={`${fallbackIconClassName} text-knight-500`} />
      )}
      {!src && emptyLabel && (
        <span className="text-[10px] text-knight-500 font-medium">{emptyLabel}</span>
      )}
    </div>
  );
};

export default CardAvatar;
