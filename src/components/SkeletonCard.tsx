export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="w-full aspect-square bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3 mb-4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-5 animate-pulse"></div>
        <div className="mt-auto h-12 bg-gray-200 dark:bg-slate-800 rounded-xl w-full animate-pulse"></div>
      </div>
    </div>
  );
}
