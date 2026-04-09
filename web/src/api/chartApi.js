export const getTrendingData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: 'Thứ 2', listens: 550 },
        { name: 'Thứ 3', listens: 750 },
        { name: 'Thứ 4', listens: 1400 },
        { name: 'Thứ 5', listens: 1100 },
        { name: 'Thứ 6', listens: 1650 },
        { name: 'Thứ 7', listens: 2200 },
        { name: 'Chủ nhật', listens: 2500 },
        { name: 'Hôm nay', listens: 1900 },
      ])
    }, 800)
  })
}