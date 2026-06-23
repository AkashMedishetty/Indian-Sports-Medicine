export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-sapphire-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 px-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-24 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-24 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}


