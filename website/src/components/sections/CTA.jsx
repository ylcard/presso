import { motion } from 'framer-motion'
import Button from '../ui/Button'

export default function CTA() {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container-width relative z-10">
                <motion.div
                    className="text-center max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Ready to Take Control of Your Finances?
                    </h2>
                    <p className="text-lg md:text-xl text-white/80 mb-8">
                        Join thousands of users who have transformed their financial lives with BudgetWise.
                        Start your journey to financial freedom today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button href="/register" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                            Get Started Free
                        </Button>
                        <Button
                            href="#features"
                            variant="outline"
                            size="lg"
                            className="border-white text-white hover:bg-white/10"
                        >
                            Learn More
                        </Button>
                    </div>
                    <p className="mt-6 text-white/60 text-sm">
                        No credit card required • Free forever • Cancel anytime
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
