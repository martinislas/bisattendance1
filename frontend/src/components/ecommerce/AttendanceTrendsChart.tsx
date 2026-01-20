import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import { getAttendanceByDate } from "../../services/attendanceService";

export default function AttendanceTrendsChart() {
  const [period, setPeriod] = useState<1 | 3 | 6>(1);
  const [chartData, setChartData] = useState<{
    categories: string[];
    present: number[];
    excused: number[];
    unexcused: number[];
    late: number[];
  }>({
    categories: [],
    present: [],
    excused: [],
    unexcused: [],
    late: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let dates: Date[] = [];
        let categories: string[] = [];

        if (period === 1) {
          // Current month - get all days up to today (not future dates)
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const currentDay = today.getDate();
          const maxDay = Math.min(currentDay, daysInMonth); // Don't go beyond today
          
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          for (let i = 1; i <= maxDay; i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            // Set time to noon to avoid timezone issues when converting to ISO string
            date.setHours(12, 0, 0, 0);
            dates.push(date);
            const dayName = dayNames[date.getDay()];
            categories.push(`${dayName} ${i}`);
          }
        } else if (period === 3) {
          // Last 3 months
          for (let i = 2; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            dates.push(date);
            categories.push(date.toLocaleDateString('en-US', { month: 'short' }));
          }
        } else {
          // Last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            dates.push(date);
            categories.push(date.toLocaleDateString('en-US', { month: 'short' }));
          }
        }

        // Fetch attendance for each period
        const attendanceData = await Promise.all(
          dates.map(async (date, index) => {
            try {
              let startDate, endDate;
              
              if (period === 1) {
                // Daily data
                startDate = date.toISOString().split('T')[0];
                endDate = startDate;
              } else {
                // Monthly aggregation
                startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
              }

              const response = await getAttendanceByDate(startDate);
              const records = response.data;

              return {
                date,
                category: categories[index],
                present: records.filter(r => r.status === 'Present').length,
                late: records.filter(r => r.status === 'Late').length,
                excused: records.filter(r => r.status === 'Excused').length,
                unexcused: records.filter(r => r.status === 'Absent').length,
                hasRecords: records.length > 0,
              };
            } catch (err) {
              return { 
                date, 
                category: categories[index],
                present: 0, 
                late: 0, 
                excused: 0, 
                unexcused: 0,
                hasRecords: false,
              };
            }
          })
        );

        // Filter out days with no attendance records (weekends, holidays, no school days)
        const filteredData = period === 1 
          ? attendanceData.filter(d => d.hasRecords) 
          : attendanceData; // Keep all months for 3/6 month view

        setChartData({
          categories: filteredData.map(d => d.category),
          present: filteredData.map(d => d.present),
          late: filteredData.map(d => d.late),
          excused: filteredData.map(d => d.excused),
          unexcused: filteredData.map(d => d.unexcused),
        });
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const currentData = chartData;

  const options: ApexOptions = {
    colors: ["#465FFF", "#9CB9FF", "#ec4899", "#fde047"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 310,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2, 2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: currentData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: "14px",
      markers: {
        height: 10,
        radius: 12,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val} students`,
      },
    },
  };

  const series = [
    {
      name: "Present",
      data: currentData.present,
    },
    {
      name: "Excused Absent",
      data: currentData.excused,
    },
    {
      name: "Unexcused Absent",
      data: currentData.unexcused,
    },
    {
      name: "Late",
      data: currentData.late,
    },
  ];

  const getButtonClass = (option: 1 | 3 | 6) =>
    period === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Attendance Trends
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Track attendance patterns over time
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              onClick={() => setPeriod(1)}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
                1
              )}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod(3)}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
                3
              )}`}
            >
              3 Months
            </button>
            <button
              onClick={() => setPeriod(6)}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
                6
              )}`}
            >
              6 Months
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <div className="flex items-center justify-center h-[310px]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart data...</p>
            </div>
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
