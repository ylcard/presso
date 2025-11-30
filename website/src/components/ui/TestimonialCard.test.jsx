import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import TestimonialCard from './TestimonialCard'

/**
 * **Feature: marketing-website, Property 2: Testimonial Completeness**
 * **Validates: Requirements 5.2, 5.3**
 * 
 * *For any* Testimonial component rendered in the testimonials section, 
 * the component SHALL contain a non-empty author name, a non-empty role/occupation, 
 * a non-empty quote text, and either an avatar image or a placeholder element.
 */
describe('TestimonialCard Component - Property Tests', () => {
    it('Property 2: Testimonial Completeness - all testimonials contain author, role, quote, and avatar/placeholder', () => {
        const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        const avatarArb = fc.option(fc.constant('/images/avatar.jpg'), { nil: undefined })

        fc.assert(
            fc.property(nonEmptyStringArb, nonEmptyStringArb, nonEmptyStringArb, avatarArb, (quote, author, role, avatar) => {
                const { container, unmount } = render(
                    <TestimonialCard
                        quote={quote}
                        author={author}
                        role={role}
                        avatar={avatar}
                    />
                )

                // Quote should be present in blockquote
                const blockquote = container.querySelector('blockquote')
                expect(blockquote).toBeInTheDocument()
                expect(blockquote.textContent).toContain(quote)

                // Author should be present
                const authorEl = container.querySelector('.font-semibold.text-gray-900')
                expect(authorEl).toBeInTheDocument()
                expect(authorEl.textContent).toBe(author)

                // Role should be present
                const roleEl = container.querySelector('.text-sm.text-gray-500')
                expect(roleEl).toBeInTheDocument()
                expect(roleEl.textContent).toBe(role)

                // Either avatar image or placeholder should be present
                const avatarImg = container.querySelector('img')
                const placeholder = container.querySelector('[data-testid="avatar-placeholder"]')
                expect(avatarImg || placeholder).toBeTruthy()

                unmount()
            }),
            { numRuns: 100 }
        )
    })
})
