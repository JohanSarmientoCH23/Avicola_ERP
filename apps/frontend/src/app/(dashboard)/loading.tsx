export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 h-72 bg-gray-100 rounded-xl" />
        <div className="lg:col-span-5 h-72 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
