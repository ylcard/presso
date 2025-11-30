import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import Button from './Button'

/**
 * **Feature: marketing-website, Property 3: CTA Button Styling Consistency**
 * **Validates: Requirements 7.3**
 * 
 * *For any* CTA_Button component rendered on the Marketing_Website, 
 * the button SHALL have the same base styling classes (background color, 
 * text color, padding, border-radius) as all other CTA_Buttons of the same variant.
 */
describe('Button Component - Property Tests', () => {
    it('Property 3: CTA Button Styling Consistency - buttons of same variant have consistent styling', () => {
        const variantArb = fc.constantFrom('primary', 'secondary', 'outline')
        const sizeArb = fc.constantFrom('sm', 'md', 'lg')
        const textArb = fc.string({ minLength: 1, maxLength: 50 })

        fc.assert(
            fc.property(variantArb, sizeArb, textArb, textArb, (variant, size, text1, text2) => {
                // Render two buttons with the same variant and size but different text
                const { unmount: unmount1 } = render(
                    <Button variant={variant} size={size} data-testid="btn1">
                        {text1 || 'Button 1'}
                    </Button>
                )
                const btn1 = screen.getByTestId('btn1')
                const classes1 = btn1.className

                unmount1()

                const { unmount: unmount2 } = render(
                    <Button variant={variant} size={size} data-testid="btn2">
                        {text2 || 'Button 2'}
                    </Button>
                )
                const btn2 = screen.getByTestId('btn2')
                const classes2 = btn2.className

                unmount2()

                // Both buttons should have identical class names (same styling)
                expect(classes1).toBe(classes2)
            }),
            { numRuns: 100 }
        )
    })

    it('all variants include base styling classes', () => {
        const variants = ['primary', 'secondary', 'outline']

        variants.forEach(variant => {
            const { unmount } = render(
                <Button variant={variant} data-testid={`btn-${variant}`}>
                    Test
                </Button>
            )
            const btn = screen.getByTestId(`btn-${variant}`)

            // All buttons should have base classes
            expect(btn.className).toContain('inline-flex')
            expect(btn.className).toContain('rounded-lg')
            expect(btn.className).toContain('font-semibold')
            expect(btn.className).toContain('transition-all')

            unmount()
        })
    })
})
