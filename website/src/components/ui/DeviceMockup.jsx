export default function DeviceMockup({ type = 'desktop', children }) {
    if (type === 'mobile') {
        return (
            <div className="relative mx-auto">
                {/* Mobile device frame */}
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-10" />
                    {/* Screen */}
                    <div className="relative bg-white rounded-[2rem] overflow-hidden w-[280px] h-[580px]">
                        {children}
                    </div>
                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
                </div>
            </div>
        )
    }

    // Desktop frame
    return (
        <div className="relative mx-auto">
            {/* Monitor frame */}
            <div className="relative bg-gray-900 rounded-xl p-3 shadow-2xl">
                {/* Screen bezel */}
                <div className="relative bg-gray-800 rounded-lg p-1">
                    {/* Screen */}
                    <div className="relative bg-white rounded-md overflow-hidden aspect-video max-w-4xl">
                        {children}
                    </div>
                </div>
                {/* Camera dot */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full" />
            </div>
            {/* Stand */}
            <div className="mx-auto w-24 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg" />
            <div className="mx-auto w-40 h-2 bg-gray-900 rounded-full shadow-lg" />
        </div>
    )
}
