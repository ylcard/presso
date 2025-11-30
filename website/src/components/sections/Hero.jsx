import { motion } from 'framer-motion'
import Button from '../ui/Button'
import DeviceMockup from '../ui/DeviceMockup'

export default function Hero() {
    return (
        <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container-width relative z-10 py-20 md:py-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-display font-extrabold text-white mb-6 leading-tight">
                            Take Control of Your{' '}
                            <span className="text-primary-200">Financial Future</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
                            BudgetWise helps you master your money with the proven 50/30/20 budgeting methodology.
                            Track expenses, set goals, and build lasting financial habits.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button href="/register" size="lg">
                                Start Free Today
                            </Button>
                            <Button href="#features" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                                Learn More
                            </Button>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-8 flex items-center gap-6 text-white/60 text-sm">
                            <span>✓ Free to use</span>
                            <span>✓ No credit card required</span>
                            <span>✓ Secure & private</span>
                        </div>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="hidden lg:block"
                    >
                        <DeviceMockup type="desktop">
                            <img
                                src="/images/screenshots/dashboard.png"
                                alt="BudgetWise Dashboard"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentElement.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div class="text-center p-8">
                        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span class="text-primary-600 text-2xl font-bold">B</span>
                        </div>
                        <p class="text-gray-500">Dashboard Preview</p>
                      </div>
                    </div>
                  `
                                }}
                            />
                        </DeviceMockup>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <div className="w-1.5 h-3 bg-white/50 rounded-full" />
                </div>
            </motion.div>
        </section>
    )
}
