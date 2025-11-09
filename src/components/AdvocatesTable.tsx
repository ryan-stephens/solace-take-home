"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import MultiSelectDropdown from "./MultiSelectDropdown";

interface Advocate {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AdvocatesTableProps {
  onDataFetch?: (data: Advocate[], pagination: PaginationInfo) => void;
}

export default function AdvocatesTable({ onDataFetch }: AdvocatesTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const [rowData, setRowData] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastName", desc: false },
  ]);
  const [hasSearched, setHasSearched] = useState(false);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    specialties: string[];
    x: number;
    y: number;
  } | null>(null);

  // Single specialty tooltip state
  const [singleSpecialtyTooltip, setSingleSpecialtyTooltip] = useState<{
    specialty: string;
    x: number;
    y: number;
  } | null>(null);

  // Filter states
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Dynamic options from database
  const [availableDegrees, setAvailableDegrees] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Available specialties list
  const availableSpecialties = [
    "Bipolar",
    "LGBTQ",
    "Medication/Prescribing",
    "Suicide History/Attempts",
    "General Mental Health (anxiety, depression, stress, grief, life transitions)",
    "Men's issues",
    "Relationship Issues (family, friends, couple, etc)",
    "Trauma & PTSD",
    "Personality disorders",
    "Personal growth",
    "Substance use/abuse",
    "Pediatrics",
    "Women's issues (post-partum, infertility, family planning)",
    "Chronic pain",
    "Weight loss & nutrition",
    "Eating disorders",
    "Diabetic Diet and nutrition",
    "Coaching (leadership, career, academic and wellness)",
    "Life coaching",
    "Obsessive-compulsive disorders",
    "Neuropsychological evaluations & testing (ADHD testing)",
    "Attention and Hyperactivity (ADHD)",
    "Sleep issues",
    "Schizophrenia and psychotic disorders",
    "Learning disorders",
    "Domestic abuse",
  ];

  // Fetch available degrees and cities on component mount
  useEffect(() => {
    // Prevent duplicate calls in development mode (React StrictMode)
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchDegrees = async () => {
      try {
        const response = await fetch("/api/advocates/degrees");
        const data = await response.json();
        setAvailableDegrees(data.degrees || []);
      } catch (error) {
        console.error("Error fetching degrees:", error);
        setAvailableDegrees([]);
      }
    };

    const fetchCities = async () => {
      try {
        const response = await fetch("/api/advocates/cities");
        const data = await response.json();
        setAvailableCities(data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setAvailableCities([]);
      }
    };

    fetchDegrees();
    fetchCities();
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDef<Advocate>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: "First Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "degree",
        header: "Degree",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "specialties",
        header: "Specialties",
        enableSorting: false,
        cell: (info) => {
          const specialties = info.getValue() as string[];
          if (!specialties || !Array.isArray(specialties)) return "";

          const displayCount = 2;
          const hasMore = specialties.length > displayCount;
          const displaySpecialties = specialties.slice(0, displayCount);
          const remainingCount = specialties.length - displayCount;

          const handleAllSpecialtiesMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipData({
              specialties,
              x: rect.left,
              y: rect.bottom + 8,
            });
          };

          const handleAllSpecialtiesMouseLeave = () => {
            setTooltipData(null);
          };

          const handleSingleSpecialtyMouseEnter = (specialty: string, e: React.MouseEvent<HTMLSpanElement>) => {
            const element = e.currentTarget;
            // Only show tooltip if text is truncated
            if (element.scrollWidth > element.clientWidth) {
              const rect = element.getBoundingClientRect();
              setSingleSpecialtyTooltip({
                specialty,
                x: rect.left,
                y: rect.bottom + 8,
              });
            }
          };

          const handleSingleSpecialtyMouseLeave = () => {
            setSingleSpecialtyTooltip(null);
          };

          return (
            <div className="flex flex-nowrap gap-1 items-center overflow-hidden">
              {displaySpecialties.map((specialty: string, index: number) => (
                <span
                  key={index}
                  className="inline-block bg-[#1a4d3e] text-white text-xs px-2 py-1 rounded overflow-hidden text-ellipsis whitespace-nowrap flex-shrink-0 cursor-default"
                  style={{ maxWidth: "120px" }}
                  onMouseEnter={(e) => handleSingleSpecialtyMouseEnter(specialty, e)}
                  onMouseLeave={handleSingleSpecialtyMouseLeave}
                >
                  {specialty}
                </span>
              ))}
              {hasMore && (
                <span
                  className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded cursor-help font-medium whitespace-nowrap flex-shrink-0"
                  onMouseEnter={handleAllSpecialtiesMouseEnter}
                  onMouseLeave={handleAllSpecialtiesMouseLeave}
                >
                  +{remainingCount} more
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "yearsOfExperience",
        header: "Years of Experience",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone Number",
        enableSorting: false,
        cell: (info) => {
          const phoneValue = info.getValue() as number;
          if (!phoneValue) return "";
          const phoneStr = String(phoneValue);
          if (phoneStr.length === 10) {
            return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
          }
          return phoneStr;
        },
      },
    ],
    []
  );

  // Fetch data from API
  const fetchData = useCallback(
    async (
      page: number,
      pageSize: number,
      search: string,
      sortBy: string,
      sortOrder: string,
      filters: {
        degrees?: string[];
        cities?: string[];
        minExp?: string;
        maxExp?: string;
        specialties?: string[];
      }
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder,
          ...(search && { search }),
          ...(filters.minExp && { minExperience: filters.minExp }),
          ...(filters.maxExp && { maxExperience: filters.maxExp }),
        });

        // Add multiple degree filters
        if (filters.degrees && filters.degrees.length > 0) {
          filters.degrees.forEach((degree) => {
            params.append("degrees", degree);
          });
        }

        // Add multiple city filters
        if (filters.cities && filters.cities.length > 0) {
          filters.cities.forEach((city) => {
            params.append("cities", city);
          });
        }

        // Add multiple specialty filters
        if (filters.specialties && filters.specialties.length > 0) {
          filters.specialties.forEach((specialty) => {
            params.append("specialties", specialty);
          });
        }

        const response = await fetch(`/api/advocates?${params}`);
        const result = await response.json();

        setRowData(result.data || []);
        setPagination(result.pagination);

        if (onDataFetch) {
          onDataFetch(result.data || [], result.pagination);
        }
      } catch (error) {
        console.error("Error fetching advocates:", error);
        setRowData([]);
      } finally {
        setLoading(false);
      }
    },
    [onDataFetch]
  );

  // Handle manual search button click
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setHasSearched(true);
      const sortBy = sorting[0]?.id || "lastName";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";
      fetchData(1, pagination.pageSize, searchTerm, sortBy, sortOrder, {
        degrees: selectedDegrees,
        cities: selectedCities,
        minExp: minExperience,
        maxExp: maxExperience,
        specialties: selectedSpecialties,
      });
    },
    [
      fetchData,
      pagination.pageSize,
      searchTerm,
      sorting,
      selectedDegrees,
      selectedCities,
      minExperience,
      maxExperience,
      selectedSpecialties,
    ]
  );

  // Handle sorting change
  const handleSortingChange = useCallback(
    async (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      if (!hasSearched) return;

      // Save current scroll positions - both page and table
      const currentScrollTop = tableContainerRef.current?.scrollTop || 0;
      const currentPageScrollY = window.scrollY;

      const newSorting = typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting)
        : updaterOrValue;

      setSorting(newSorting);
      setIsSorting(true);

      const sortBy = newSorting[0]?.id || "lastName";
      const sortOrder = newSorting[0]?.desc ? "desc" : "asc";

      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          pageSize: pagination.pageSize.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder,
          ...(searchTerm && { search: searchTerm }),
          ...(minExperience && { minExperience: minExperience }),
          ...(maxExperience && { maxExperience: maxExperience }),
        });

        if (selectedDegrees && selectedDegrees.length > 0) {
          selectedDegrees.forEach((degree) => params.append("degrees", degree));
        }
        if (selectedCities && selectedCities.length > 0) {
          selectedCities.forEach((city) => params.append("cities", city));
        }
        if (selectedSpecialties && selectedSpecialties.length > 0) {
          selectedSpecialties.forEach((specialty) => params.append("specialties", specialty));
        }

        const response = await fetch(`/api/advocates?${params}`);
        const result = await response.json();

        setRowData(result.data || []);
        setPagination(result.pagination);

        if (onDataFetch) {
          onDataFetch(result.data || [], result.pagination);
        }

        // Restore scroll positions after data loads
        requestAnimationFrame(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = currentScrollTop;
          }
          window.scrollTo(0, currentPageScrollY);
        });
      } catch (error) {
        console.error("Error sorting advocates:", error);
      } finally {
        setIsSorting(false);
      }
    },
    [
      hasSearched,
      sorting,
      pagination.page,
      pagination.pageSize,
      searchTerm,
      selectedDegrees,
      selectedCities,
      minExperience,
      maxExperience,
      selectedSpecialties,
      onDataFetch,
    ]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!hasSearched) return;
      const sortBy = sorting[0]?.id || "lastName";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";
      fetchData(newPage, pagination.pageSize, searchTerm, sortBy, sortOrder, {
        degrees: selectedDegrees,
        cities: selectedCities,
        minExp: minExperience,
        maxExp: maxExperience,
        specialties: selectedSpecialties,
      });
    },
    [
      hasSearched,
      fetchData,
      pagination.pageSize,
      searchTerm,
      sorting,
      selectedDegrees,
      selectedCities,
      minExperience,
      maxExperience,
      selectedSpecialties,
    ]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      if (!hasSearched) return;
      const sortBy = sorting[0]?.id || "lastName";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";
      fetchData(1, newPageSize, searchTerm, sortBy, sortOrder, {
        degrees: selectedDegrees,
        cities: selectedCities,
        minExp: minExperience,
        maxExp: maxExperience,
        specialties: selectedSpecialties,
      });
    },
    [
      hasSearched,
      fetchData,
      searchTerm,
      sorting,
      selectedDegrees,
      selectedCities,
      minExperience,
      maxExperience,
      selectedSpecialties,
    ]
  );

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDegrees([]);
    setSelectedCities([]);
    setMinExperience("");
    setMaxExperience("");
    setSelectedSpecialties([]);
    setHasSearched(false);
    setRowData([]);
    setSorting([{ id: "lastName", desc: false }]);
    setPagination({
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }, []);

  // Create table instance
  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  return (
    <div className="w-full">
      {/* Search and Filter Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Search & Filter Advocates
        </h3>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label
              htmlFor="search"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Keyword Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, city, degree..."
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a4d3e] focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Degree Multi-Select */}
          <div className="lg:col-span-2">
            <MultiSelectDropdown
              options={availableDegrees}
              selectedValues={selectedDegrees}
              onChange={setSelectedDegrees}
              placeholder="Select degrees"
              label="Degree"
            />
          </div>

          {/* City Multi-Select */}
          <div className="lg:col-span-2">
            <MultiSelectDropdown
              options={availableCities}
              selectedValues={selectedCities}
              onChange={setSelectedCities}
              placeholder="Select cities"
              label="City"
            />
          </div>

          {/* Min Experience */}
          <div className="lg:col-span-2">
            <label
              htmlFor="minExp"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Min Exp (yrs)
            </label>
            <input
              id="minExp"
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a4d3e] focus:border-transparent outline-none transition-all"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            />
          </div>

          {/* Max Experience */}
          <div className="lg:col-span-2">
            <label
              htmlFor="maxExp"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
            >
              Max Exp (yrs)
            </label>
            <input
              id="maxExp"
              type="number"
              min="0"
              placeholder="50"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a4d3e] focus:border-transparent outline-none transition-all"
              value={maxExperience}
              onChange={(e) => setMaxExperience(e.target.value)}
            />
          </div>

          {/* Specialty Multi-Select */}
          <div className="sm:col-span-2 lg:col-span-12">
            <MultiSelectDropdown
              options={availableSpecialties}
              selectedValues={selectedSpecialties}
              onChange={setSelectedSpecialties}
              placeholder="Select specialties"
              label="Specialties"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base bg-[#1a4d3e] text-white font-medium rounded-md hover:bg-[#134032] focus:ring-2 focus:ring-[#1a4d3e] focus:ring-offset-2 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!hasSearched && rowData.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: "500px" }}>
            <div className="text-center px-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search for Advocates
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Use the search and filter options above to find mental health advocates
                that match your needs.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div ref={tableContainerRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1a4d3e] sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-[#1a4d3e]"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? "cursor-pointer select-none flex items-center gap-2 hover:text-gray-200"
                                  : ""
                              }
                              onClick={(e) => {
                                if (!header.column.getCanSort()) return;
                                e.preventDefault();
                                e.stopPropagation();
                                const handler = header.column.getToggleSortingHandler();
                                if (handler) handler(e);
                              }}
                              onMouseDown={(e) => {
                                // Prevent any default focus/scroll behavior
                                e.preventDefault();
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span className="text-sm">
                                  {{
                                    asc: "↑",
                                    desc: "↓",
                                  }[header.column.getIsSorted() as string] ?? "⇅"}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className={`bg-white divide-y divide-gray-200 ${isSorting ? 'opacity-60 pointer-events-none' : ''}`}>
                  {loading && !isSorting ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4d3e]"></div>
                          <span className="ml-3">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No advocates found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Custom Pagination Controls */}
            {hasSearched && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                    Showing{" "}
                    {rowData.length > 0
                      ? (pagination.page - 1) * pagination.pageSize + 1
                      : 0}{" "}
                    to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}{" "}
                    of {pagination.totalCount} advocates
                    {rowData.length < pagination.pageSize &&
                      pagination.totalCount <= pagination.pageSize && (
                        <span className="text-gray-500 ml-1">(all results shown)</span>
                      )}
                  </span>
                  <select
                    className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-[#1a4d3e] focus:border-transparent outline-none w-full sm:w-auto"
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-2 sm:px-4 py-1 text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* All Specialties Tooltip Portal */}
      {tooltipData &&
        createPortal(
          <div
            className="fixed bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl w-72 max-h-60 overflow-y-auto specialty-tooltip"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y}px`,
              zIndex: 9999,
            }}
          >
            <div className="font-semibold mb-2 text-sm border-b border-gray-700 pb-2">
              All Specialties ({tooltipData.specialties.length}):
            </div>
            <div className="space-y-1.5">
              {tooltipData.specialties.map((specialty: string, idx: number) => (
                <div key={idx} className="py-0.5 text-gray-100">
                  • {specialty}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* Single Specialty Tooltip Portal */}
      {singleSpecialtyTooltip &&
        createPortal(
          <div
            className="fixed bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs"
            style={{
              left: `${singleSpecialtyTooltip.x}px`,
              top: `${singleSpecialtyTooltip.y}px`,
              zIndex: 9999,
            }}
          >
            {singleSpecialtyTooltip.specialty}
          </div>,
          document.body
        )}

      {/* Scrollbar styles for tooltip */}
      <style jsx global>{`
        .specialty-tooltip::-webkit-scrollbar {
          width: 6px;
        }

        .specialty-tooltip::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }

        .specialty-tooltip::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }

        .specialty-tooltip::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
