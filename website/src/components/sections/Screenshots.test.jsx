import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Screenshots from './Screenshots'

/**
 * **Feature: marketing-website, Property 4: Image Lazy Loading**
 * **Validates: Requirements 8.3**
 * 
 * *For any* image element rendered on the Marketing_Website (excluding above-the-fold hero images), 
 * the image SHALL have the `loading="lazy"` attribute set.
 */
describe('Screenshots Component - Property Tests', () => {
    it('Property 4: Image Lazy Loading - all screenshot images have lazy loading', () => {
        const { container } = render(<Screenshots />)

        // Get all images in the screenshots section
        const images = container.querySelectorAll('img')

        // Each image should have loading="lazy" attribute
        images.forEach((img) => {
            expect(img.getAttribute('loading')).toBe('lazy')
        })
    })
})
