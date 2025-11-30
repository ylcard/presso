import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

/**
 * **Feature: marketing-website, Property 5: Dynamic Copyright Year**
 * **Validates: Requirements 10.5**
 * 
 * *For any* render of the Footer component, the copyright text SHALL contain 
 * the current calendar year as returned by `new Date().getFullYear()`.
 */
describe('Footer Component - Property Tests', () => {
    it('Property 5: Dynamic Copyright Year - footer displays current year', () => {
        const currentYear = new Date().getFullYear()

        render(<Footer />)

        const copyright = screen.getByTestId('copyright')
        expect(copyright.textContent).toContain(currentYear.toString())
    })

    it('footer contains all required elements', () => {
        render(<Footer />)

        // Check for privacy policy link
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument()

        // Check for terms of service link
        expect(screen.getByText('Terms of Service')).toBeInTheDocument()

        // Check for contact email
        expect(screen.getByText('hello@budgetwise.app')).toBeInTheDocument()

        // Check for social links (by aria-label)
        expect(screen.getByLabelText('Twitter')).toBeInTheDocument()
        expect(screen.getByLabelText('GitHub')).toBeInTheDocument()
        expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    })
})
