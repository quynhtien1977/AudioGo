let fakeCategories = [
  { id: "CAT-001", name: "Food & Drink", pois: 24 },
  { id: "CAT-002", name: "Entertainment", pois: 18 },
  { id: "CAT-003", name: "Culture", pois: 12 },
  { id: "CAT-004", name: "Shopping", pois: 9 },
  { id: "CAT-005", name: "Nature", pois: 15 },
];

// 🟢 LẤY DANH SÁCH
export const getCategoriesApi = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...fakeCategories]), 500);
  });

// 🟢 TẠO MỚI
export const createCategoryApi = (data) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const newCat = {
        id: "CAT-" + Math.floor(1000 + Math.random() * 9000), // Tạo ID 4 số ngẫu nhiên
        name: data.name,
        pois: 0,
      };
      fakeCategories = [newCat, ...fakeCategories];
      resolve(newCat);
    }, 500);
  });

// 🟢 CẬP NHẬT (Sửa tên)
export const updateCategoryApi = (id, data) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = fakeCategories.findIndex((c) => c.id === id);
      if (index === -1) return reject("Category not found");

      fakeCategories[index] = { ...fakeCategories[index], ...data };
      resolve(fakeCategories[index]);
    }, 400);
  });

// 🟢 XÓA HẲN (Thay thế cho toggle)
export const deleteCategoryApi = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = fakeCategories.some((c) => c.id === id);
      if (!exists) return reject("Category not found");

      fakeCategories = fakeCategories.filter((c) => c.id !== id);
      resolve({ success: true, id });
    }, 400);
  });