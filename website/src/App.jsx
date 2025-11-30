import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import Features from './components/sections/Features'
import Screenshots from './components/sections/Screenshots'
import Methodology from './components/sections/Methodology'
import Testimonials from './components/sections/Testimonials'
import CTA from './components/sections/CTA'

function App() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Screenshots />
                <Methodology />
                <Testimonials />
                <CTA />
            </main>
            <Footer />
        </div>
    )
}

export default App
