import { motion } from 'framer-motion'

export default function TestimonialCard({ quote, author, role, avatar }) {
    return (
        <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={`${author}'s avatar`}
                            className="w-12 h-12 rounded-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div
                            className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center"
                            data-testid="avatar-placeholder"
                        >
                            <span className="text-primary-600 font-semibold text-lg">
                                {author?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <blockquote className="text-gray-700 italic mb-3">
                        "{quote}"
                    </blockquote>
                    <div>
                        <p className="font-semibold text-gray-900">{author}</p>
                        <p className="text-sm text-gray-500">{role}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
