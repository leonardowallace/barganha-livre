export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-full border border-gray-100 animate-pulse overflow-hidden">
      <div className="w-full aspect-square bg-gray-200"></div>
      <div className="p-4 flex flex-col flex-grow bg-gray-50/50">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="mt-auto">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-11 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
}
