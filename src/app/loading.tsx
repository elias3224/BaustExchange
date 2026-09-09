export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="flex flex-col items-center gap-3">
        {/* Animated Brand Spinner */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-75" />
          <div className="w-10 h-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        </div>
        
        <div className="text-center mt-2">
          <span className="font-bold text-gray-800 text-sm tracking-tight block">
            BAUST <span className="text-emerald-600">Exchange</span>
          </span>
          <span className="text-xs text-gray-400 font-medium">Loading, please wait...</span>
        </div>
      </div>
    </div>
  );
}

