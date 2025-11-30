import '@testing-library/jest-dom'

// Mock IntersectionObserver for framer-motion
class IntersectionObserver {
    constructor(callback) {
        this.callback = callback
    }
    observe() { return null }
    unobserve() { return null }
    disconnect() { return null }
}

global.IntersectionObserver = IntersectionObserver

// Mock ResizeObserver
class ResizeObserver {
    observe() { return null }
    unobserve() { return null }
    disconnect() { return null }
}

global.ResizeObserver = ResizeObserver
