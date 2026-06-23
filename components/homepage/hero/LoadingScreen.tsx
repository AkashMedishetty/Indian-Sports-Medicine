'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#f5f0e8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#852016] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#25406b]/50 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
