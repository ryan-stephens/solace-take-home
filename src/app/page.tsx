"use client";

import AdvocatesTable from "../components/AdvocatesTable";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-[#1a4d3e] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#1a4d3e] font-bold text-lg sm:text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Solace</h1>
              <p className="text-xs sm:text-sm text-gray-200 mt-0.5 sm:mt-1">Mental Health Advocates Directory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1 sm:mb-2">Find Your Advocate</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Browse our directory of mental health professionals with various specialties and credentials.
          </p>
        </div>

        <AdvocatesTable />
      </div>
    </main>
  );
}
