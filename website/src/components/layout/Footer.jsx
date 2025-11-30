import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/budgetwise', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/budgetwise', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/budgetwise', label: 'LinkedIn' },
]

const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
]

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container-width py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">B</span>
                            </div>
                            <span className="font-bold text-xl">BudgetWise</span>
                        </div>
                        <p className="text-gray-400 max-w-md">
                            Take control of your finances with the proven 50/30/20 budgeting methodology.
                            Track expenses, set goals, and build a better financial future.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <a
                            href="mailto:hello@budgetwise.app"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            hello@budgetwise.app
                        </a>
                        <div className="flex gap-4 mt-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p data-testid="copyright">© {currentYear} BudgetWise. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
