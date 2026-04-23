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