export default function AppLoader() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f3d66]/30 border-t-[#0f3d66]"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}

