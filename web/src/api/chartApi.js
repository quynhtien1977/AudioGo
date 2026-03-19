export const getTrendingData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: 'Mon', listens: 550 },
        { name: 'Tue', listens: 750 },
        { name: 'Wed', listens: 1400 },
        { name: 'Thu', listens: 1100 },
        { name: 'Fri', listens: 1650 },
        { name: 'Sat', listens: 2200 },
        { name: 'Sun', listens: 2500 },
        { name: 'Today', listens: 1900 },
      ])
    }, 800)
  })
}