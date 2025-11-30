import { motion } from 'framer-motion'

const categories = [
    {
        name: 'Needs',
        percentage: 50,
        color: '#3B82F6',
        bgColor: 'bg-primary-50',
        textColor: 'text-primary-600',
        borderColor: 'border-primary-200',
        description: 'Essential expenses you cannot avoid',
        examples: ['Rent/Mortgage', 'Utilities', 'Groceries', 'Insurance', 'Transportation']
    },
    {
        name: 'Wants',
        percentage: 30,
        color: '#8B5CF6',
        bgColor: 'bg-secondary-50',
        textColor: 'text-secondary-600',
        borderColor: 'border-secondary-200',
        description: 'Non-essential spending for enjoyment',
        examples: ['Dining Out', 'Entertainment', 'Shopping', 'Subscriptions', 'Hobbies']
    },
    {
        name: 'Savings',
        percentage: 20,
        color: '#10B981',
        bgColor: 'bg-success-50',
        textColor: 'text-success-600',
        borderColor: 'border-success-200',
        description: 'Building your financial future',
        examples: ['Emergency Fund', 'Investments', 'Retirement', 'Debt Payoff', 'Goals']
    }
]

function DonutChart() {
    const total = categories.reduce((sum, cat) => sum + cat.percentage, 0)
    let currentAngle = -90

    return (
        <div className="relative w-64 h-64 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {categories.map((category, index) => {
                    const angle = (category.percentage / total) * 360
                    const startAngle = currentAngle
                    currentAngle += angle

                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = ((startAngle + angle) * Math.PI) / 180

                    const x1 = 50 + 40 * Math.cos(startRad)
                    const y1 = 50 + 40 * Math.sin(startRad)
                    const x2 = 50 + 40 * Math.cos(endRad)
                    const y2 = 50 + 40 * Math.sin(endRad)

                    const largeArc = angle > 180 ? 1 : 0

                    return (
                        <motion.path
                            key={category.name}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={category.color}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                        />
                    )
                })}
                {/* Center circle for donut effect */}
                <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">50/30/20</span>
                    <p className="text-sm text-gray-500">Rule</p>
                </div>
            </div>
        </div>
    )
}

export default function Methodology() {
    return (
        <section id="methodology" className="section-padding bg-gray-50">
            <div className="container-width">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-h2 text-gray-900 mb-4">
                        The 50/30/20 Budgeting Method
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        A simple, proven approach to managing your money. Divide your after-tax income into three categories for balanced financial health.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <DonutChart />
                    </motion.div>

                    {/* Category Cards */}
                    <div className="space-y-4">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.name}
                                className={`${category.bgColor} ${category.borderColor} border rounded-xl p-6`}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`text-xl font-semibold ${category.textColor}`}>
                                        {category.name}
                                    </h3>
                                    <span className={`text-2xl font-bold ${category.textColor}`}>
                                        {category.percentage}%
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-3">{category.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {category.examples.map((example) => (
                                        <span
                                            key={example}
                                            className="px-3 py-1 bg-white rounded-full text-sm text-gray-600"
                                        >
                                            {example}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
