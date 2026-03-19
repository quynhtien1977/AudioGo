export const getDashboardData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: {
          pois: {
            total: 67,
            percent: "+5.2%",
          },
          audio: {
            total: "12,345",
            percent: "+12.5%",
          },
        },
        chart: [
          { day: "Mon", value: 500 },
          { day: "Tue", value: 750 },
          { day: "Wed", value: 1400 },
          { day: "Thu", value: 1100 },
          { day: "Fri", value: 1650 },
          { day: "Sat", value: 2200 },
          { day: "Sun", value: 2500 },
          { day: "Today", value: 1900 },
        ],
        pois: [
          {
            name: "The Pastel Bistro",
            location: "Sector 7, Central",
            category: "Restaurant",
            listen: "1,240 hrs",
          },
        ],
      })
    }, 800)
  })
}