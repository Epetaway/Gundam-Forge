import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  wide?: boolean;
}

export function Container({ className, wide = false, ...props }: ContainerProps): JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 sm:px-8',
        wide ? 'max-w-[90rem]' : 'max-w-[80rem]',
        className,
      )}
      {...props}
    />
  );
}
