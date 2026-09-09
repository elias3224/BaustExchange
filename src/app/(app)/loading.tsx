export default function AppLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse p-2 select-none">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 bg-gray-200 rounded-lg w-48" />
        <div className="h-9 bg-gray-200 rounded-xl w-32" />
      </div>
      
      {/* Search / Filter Bar Skeleton */}
      <div className="h-12 bg-gray-200 rounded-xl w-full" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4 shadow-sm">
            <div className="h-44 bg-gray-200 rounded-xl w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded-lg w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

