// src/api/contentApi.js

export const getContentsByPOI = (poiId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          Content_ID: 1,
          POI_ID: 1,
          LanguageCode: "en",
          Title: "Le Petit Bistro Introduction",
          Description:
            "Welcome to Le Petit Bistro, a cornerstone of Parisian culinary elegance nestled in the historic district. Founded in 1924, this bistro has preserved the art of traditional French cuisine for over a century.",
          Audio_URL: "/audio/bistro-en.mp3",
          localAudio_Path: "",
          isMaster: true,
          CreatedAt: "2024-01-01",
          UpdatedAt: "2024-02-01",
        },
        {
          Content_ID: 2,
          POI_ID: 1,
          LanguageCode: "vi",
          Title: "Giới thiệu Le Petit Bistro",
          Description:
            "Chào mừng bạn đến với Le Petit Bistro, một biểu tượng ẩm thực Pháp với lịch sử hơn 100 năm. Nhà hàng nổi tiếng với phong cách truyền thống và không gian sang trọng.",
          Audio_URL: "/audio/bistro-vi.mp3",
          localAudio_Path: "",
          isMaster: false,
          CreatedAt: "2024-01-02",
          UpdatedAt: "2024-02-02",
        },

        // POI khác
        {
          Content_ID: 3,
          POI_ID: 2,
          LanguageCode: "en",
          Title: "Royal Art Gallery",
          Description:
            "This gallery showcases some of the finest artworks in the world.",
          Audio_URL: "/audio/gallery.mp3",
          isMaster: true,
        },
      ])
    }, 500)
  })
}