export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  const gearSize = {
    sm: 24,
    md: 40,
    lg: 64
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Main rotating gear with teeth */}
        <svg 
          className="animate-spin" 
          width={gearSize[size]} 
          height={gearSize[size]} 
          viewBox="0 0 100 100" 
          fill="none"
          style={{ animationDuration: '3s' }}
        >
          {/* Gear teeth */}
          <path
            d="M50 5 L55 5 L55 15 L60 15 L60 5 L65 5 L65 15 L70 15 L70 20 L80 20 L80 15 L85 15 L85 20 L95 20 L95 25 L85 25 L85 30 L95 30 L95 35 L85 35 L85 40 L80 40 L80 50 L85 50 L85 55 L95 55 L95 60 L85 60 L85 65 L95 65 L95 70 L85 70 L85 75 L80 75 L80 85 L75 85 L75 95 L70 95 L70 85 L65 85 L65 95 L60 95 L60 85 L55 85 L55 95 L50 95 L45 95 L45 85 L40 85 L40 95 L35 95 L35 85 L30 85 L30 95 L25 95 L25 85 L20 85 L20 80 L15 80 L15 75 L5 75 L5 70 L15 70 L15 65 L5 65 L5 60 L15 60 L15 55 L5 55 L5 50 L15 50 L15 45 L5 45 L5 40 L15 40 L15 35 L5 35 L5 30 L15 30 L15 25 L5 25 L5 20 L15 20 L15 15 L20 15 L20 5 L25 5 L25 15 L30 15 L30 5 L35 5 L35 15 L40 15 L40 5 L45 5 L45 15 L50 15 Z"
            fill="currentColor"
            className="text-indigo-600"
          />
          {/* Inner circle */}
          <circle cx="50" cy="50" r="15" fill="white" />
          <circle cx="50" cy="50" r="8" fill="currentColor" className="text-gray-300" />
        </svg>
        
        {/* Secondary smaller gear with teeth */}
        <svg 
          className="absolute -top-2 -right-2 animate-spin" 
          width={gearSize[size] * 0.6} 
          height={gearSize[size] * 0.6} 
          viewBox="0 0 80 80" 
          fill="none"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
        >
          {/* Smaller gear teeth */}
          <path
            d="M40 8 L44 8 L44 16 L48 16 L48 8 L52 8 L52 16 L56 16 L56 20 L64 20 L64 16 L68 16 L68 20 L72 20 L72 24 L68 24 L68 28 L72 28 L72 32 L68 32 L68 36 L64 36 L64 44 L68 44 L68 48 L72 48 L72 52 L68 52 L68 56 L72 56 L72 60 L68 60 L68 64 L64 64 L64 72 L60 72 L60 68 L56 68 L56 72 L52 72 L52 68 L48 68 L48 72 L44 72 L44 68 L40 68 L36 68 L36 72 L32 72 L32 68 L28 68 L28 72 L24 72 L24 68 L20 68 L20 72 L16 72 L16 64 L12 64 L12 60 L8 60 L8 56 L12 56 L12 52 L8 52 L8 48 L12 48 L12 44 L8 44 L8 40 L12 40 L12 36 L8 36 L8 32 L12 32 L12 28 L8 28 L8 24 L12 24 L12 20 L16 20 L16 16 L20 16 L20 8 L24 8 L24 16 L28 16 L28 8 L32 8 L32 16 L36 16 L36 8 Z"
            fill="currentColor"
            className="text-gray-500"
          />
          {/* Inner circle */}
          <circle cx="40" cy="40" r="12" fill="white" />
          <circle cx="40" cy="40" r="6" fill="currentColor" className="text-gray-400" />
        </svg>
      </div>
    </div>
  );
}