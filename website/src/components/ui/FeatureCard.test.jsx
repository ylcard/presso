import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import FeatureCard from './FeatureCard'

// Mock icon component
const MockIcon = ({ className }) => <svg data-testid="icon" className={className} />

/**
 * **Feature: marketing-website, Property 1: Feature Card Completeness**
 * **Validates: Requirements 2.2**
 * 
 * *For any* Feature_Card component rendered in the features section, 
 * the component SHALL contain a non-empty icon element, a non-empty title string, 
 * and a non-empty description string.
 */
describe('FeatureCard Component - Property Tests', () => {
    it('Property 1: Feature Card Completeness - all cards contain icon, title, and description', () => {
        const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)

        fc.assert(
            fc.property(nonEmptyStringArb, nonEmptyStringArb, (title, description) => {
                const { container, unmount } = render(
                    <FeatureCard
                        icon={MockIcon}
                        title={title}
                        description={description}
                    />
                )

                // Icon should be present
                const icon = container.querySelector('[data-testid="icon"]')
                expect(icon).toBeInTheDocument()

                // Title should be present and non-empty
                const titleEl = container.querySelector('h3')
                expect(titleEl).toBeInTheDocument()
                expect(titleEl.textContent).toBe(title)

                // Description should be present and non-empty
                const descEl = container.querySelector('p')
                expect(descEl).toBeInTheDocument()
                expect(descEl.textContent).toBe(description)

                unmount()
            }),
            { numRuns: 100 }
        )
    })
})
