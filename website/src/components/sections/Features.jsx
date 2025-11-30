import { motion } from 'framer-motion'
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Tags, BarChart3, Globe } from 'lucide-react'
import FeatureCard from '../ui/FeatureCard'

const features = [
    {
        icon: LayoutDashboard,
        title: 'Dashboard Overview',
        description: 'Get a real-time snapshot of your finances with intuitive visualizations and budget tracking.'
    },
    {
        icon: ArrowLeftRight,
        title: 'Transaction Tracking',
        description: 'Easily log income and expenses with powerful filtering and search capabilities.'
    },
    {
        icon: PiggyBank,
        title: 'Smart Budgeting',
        description: 'Follow the proven 50/30/20 methodology to balance needs, wants, and savings.'
    },
    {
        icon: Tags,
        title: 'Category System',
        description: 'Organize transactions with custom categories and automatic priority assignment.'
    },
    {
        icon: BarChart3,
        title: 'Reports & Analytics',
        description: 'Visualize spending trends with charts and track your financial health score.'
    },
    {
        icon: Globe,
        title: 'Multi-Currency',
        description: 'Manage finances across multiple currencies with automatic exchange rate conversion.'
    }
]

export default function Features() {
    return (
        <section id="features" className="section-padding bg-gray-50">
            <div className="container-width">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-h2 text-gray-900 mb-4">
                        Everything You Need to Manage Your Money
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        BudgetWise comes packed with powerful features to help you take control of your finances and reach your goals.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <FeatureCard
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
