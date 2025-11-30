import { motion } from 'framer-motion'

const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-lg shadow-secondary-500/25',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
}

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
}

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    href,
    onClick,
    className = '',
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 ease-out'
    const variantClasses = variants[variant]
    const sizeClasses = sizes[size]
    const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`

    const MotionComponent = href ? motion.a : motion.button

    return (
        <MotionComponent
            href={href}
            onClick={onClick}
            className={combinedClasses}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            {children}
        </MotionComponent>
    )
}
