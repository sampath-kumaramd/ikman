import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SIZE_PX = {
  sm: 24,
  md: 32,
  lg: 40,
} as const

type LogoSize = keyof typeof SIZE_PX

/** App mark from `/public/logo.jpg` — house + alert icon. */
export function AppLogo({
  size = 'md',
  className,
  priority = false,
}: {
  size?: LogoSize | number
  className?: string
  priority?: boolean
}) {
  const px = typeof size === 'number' ? size : SIZE_PX[size]
  return (
    <Image
      src="/logo.jpg"
      alt="Rental Tracker"
      width={px}
      height={px}
      priority={priority}
      className={cn('shrink-0 rounded-[22%] object-cover shadow-sm ring-1 ring-white/10', className)}
    />
  )
}

/** Logo + wordmark link used in nav headers. */
export function BrandLink({
  href = '/',
  size = 'md',
  showLabel = true,
  className,
  labelClassName,
  priority = false,
}: {
  href?: string
  size?: LogoSize
  showLabel?: boolean
  className?: string
  labelClassName?: string
  priority?: boolean
}) {
  return (
    <Link href={href} className={cn('flex min-w-0 shrink items-center gap-2', className)}>
      <AppLogo size={size} priority={priority} />
      {showLabel && (
        <span
          className={cn(
            'font-display truncate font-bold tracking-tight text-white',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-[15px] sm:text-base',
            size === 'lg' && 'text-lg',
            labelClassName,
          )}
        >
          Rental Tracker
        </span>
      )}
    </Link>
  )
}
