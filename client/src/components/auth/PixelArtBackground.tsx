export function PixelArtBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Water */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-cyan-400 via-cyan-300 to-cyan-200">
        {/* Water ripples */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-1/4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-1/3 w-6 h-6 bg-white/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-12 left-1/2 w-10 h-10 bg-white/20 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute top-6 right-1/4 w-4 h-4 bg-white/20 rounded-full animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Stone Bridge */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-full shadow-lg">
          {/* Bridge arch */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
        </div>
      </div>

      {/* Ancient Architecture - Right Side */}
      <div className="absolute right-0 top-1/4 w-1/3 h-1/2">
        {/* Main Building */}
        <div className="absolute bottom-0 right-0 w-24 h-32 bg-gradient-to-t from-stone-300 to-stone-200 shadow-xl">
          {/* Columns */}
          <div className="absolute top-0 left-2 w-3 h-24 bg-gradient-to-t from-stone-400 to-stone-300"></div>
          <div className="absolute top-0 left-8 w-3 h-24 bg-gradient-to-t from-stone-400 to-stone-300"></div>
          <div className="absolute top-0 left-14 w-3 h-24 bg-gradient-to-t from-stone-400 to-stone-300"></div>
          <div className="absolute top-0 left-20 w-3 h-24 bg-gradient-to-t from-stone-400 to-stone-300"></div>
          
          {/* Windows */}
          <div className="absolute top-8 left-4 w-4 h-6 bg-gray-600"></div>
          <div className="absolute top-8 left-10 w-4 h-6 bg-gray-600"></div>
          <div className="absolute top-8 left-16 w-4 h-6 bg-gray-600"></div>
        </div>

        {/* Terraces */}
        <div className="absolute bottom-0 right-0 w-32 h-8 bg-gradient-to-t from-stone-200 to-stone-100"></div>
        <div className="absolute bottom-8 right-0 w-28 h-6 bg-gradient-to-t from-stone-200 to-stone-100"></div>
        
        {/* Potted Plants */}
        <div className="absolute bottom-2 right-4 w-4 h-4 bg-amber-600 rounded-full"></div>
        <div className="absolute bottom-2 right-8 w-3 h-3 bg-green-500 rounded-full"></div>
        <div className="absolute bottom-2 right-12 w-4 h-4 bg-amber-600 rounded-full"></div>
        <div className="absolute bottom-2 right-16 w-3 h-3 bg-green-500 rounded-full"></div>
        
        <div className="absolute bottom-10 right-6 w-4 h-4 bg-amber-600 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-green-500 rounded-full"></div>
        <div className="absolute bottom-10 right-14 w-4 h-4 bg-amber-600 rounded-full"></div>
      </div>

      {/* Foliage - Left Side */}
      <div className="absolute left-0 top-1/3 w-1/4 h-1/3">
        {/* Trees */}
        <div className="absolute bottom-0 left-4 w-8 h-16 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full"></div>
        <div className="absolute bottom-0 left-12 w-6 h-12 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full"></div>
        <div className="absolute bottom-0 left-20 w-8 h-16 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full"></div>
        
        {/* Bushes */}
        <div className="absolute bottom-0 left-2 w-6 h-8 bg-gradient-to-t from-green-500 to-green-400 rounded-full"></div>
        <div className="absolute bottom-0 left-16 w-5 h-6 bg-gradient-to-t from-green-500 to-green-400 rounded-full"></div>
        <div className="absolute bottom-0 left-24 w-6 h-8 bg-gradient-to-t from-green-500 to-green-400 rounded-full"></div>
      </div>

      {/* Foliage - Right Side */}
      <div className="absolute right-1/4 top-1/2 w-1/6 h-1/4">
        <div className="absolute bottom-0 left-2 w-6 h-10 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full"></div>
        <div className="absolute bottom-0 left-8 w-5 h-8 bg-gradient-to-t from-green-500 to-green-400 rounded-full"></div>
      </div>

      {/* Floating particles for atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  )
}
