import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DeviceMockup from '../ui/DeviceMockup'

const screenshots = [
    {
        src: '/images/screenshots/dashboard.png',
        alt: 'BudgetWise Dashboard',
        caption: 'Dashboard - Your financial overview at a glance'
    },
    {
        src: '/images/screenshots/transactions.png',
        alt: 'BudgetWise Transactions',
        caption: 'Transactions - Track every income and expense'
    },
    {
        src: '/images/screenshots/reports.png',
        alt: 'BudgetWise Reports',
        caption: 'Reports - Visualize your spending patterns'
    }
]

export default function Screenshots() {
    const [currentIndex, setCurrentIndex] = useState(0)

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1))
    }

    return (
        <section id="screenshots" className="section-padding bg-white">
            <div className="container-width">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-h2 text-gray-900 mb-4">
                        See BudgetWise in Action
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore the intuitive interface designed to make managing your finances a breeze.
                    </p>
                </motion.div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Navigation Buttons */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                        aria-label="Previous screenshot"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                        aria-label="Next screenshot"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Screenshot Display */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DeviceMockup type="desktop">
                                <img
                                    src={screenshots[currentIndex].src}
                                    alt={screenshots[currentIndex].alt}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.parentElement.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center aspect-video">
                        <div class="text-center p-8">
                          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-primary-600 text-2xl font-bold">B</span>
                          </div>
                          <p class="text-gray-500">${screenshots[currentIndex].caption}</p>
                        </div>
                      </div>
                    `
                                    }}
                                />
                            </DeviceMockup>
                            <p className="text-center text-gray-600 mt-6">
                                {screenshots[currentIndex].caption}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicator Dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        {screenshots.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-primary-600' : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to screenshot ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
