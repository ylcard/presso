import { motion } from 'framer-motion'
import TestimonialCard from '../ui/TestimonialCard'

const testimonials = [
    {
        quote: "BudgetWise completely transformed how I manage my money. The 50/30/20 approach finally made budgeting click for me.",
        author: "Sarah M.",
        role: "Marketing Manager",
        avatar: null
    },
    {
        quote: "I've tried dozens of finance apps, but this is the first one I've stuck with. The dashboard gives me everything I need at a glance.",
        author: "James K.",
        role: "Software Developer",
        avatar: null
    },
    {
        quote: "The category system and reports helped me identify where my money was actually going. I've saved 30% more since using BudgetWise.",
        author: "Emily R.",
        role: "Freelance Designer",
        avatar: null
    }
]

export default function Testimonials() {
    return (
        <section id="testimonials" className="section-padding bg-white">
            <div className="container-width">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-h2 text-gray-900 mb-4">
                        Loved by Thousands of Users
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        See what our users have to say about their experience with BudgetWise.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <TestimonialCard
                                quote={testimonial.quote}
                                author={testimonial.author}
                                role={testimonial.role}
                                avatar={testimonial.avatar}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
