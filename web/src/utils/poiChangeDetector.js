const normalizeAudio = (v) => {
  if (v == null) return ""
  return v.trim().split("?")[0].toLowerCase()
}
const isAudioChanged = (oldAudio, newAudio) => normalizeAudio(oldAudio) !== normalizeAudio(newAudio)

// Kiểm tra xem key có thực sự tồn tại trong proposedData (không phải undefined)
const hasKey = (obj, ...keys) => {
  if (obj == null) return false
  return keys.some(k => k in obj && obj[k] !== undefined)
}

/**
 * Compares current POI detail data and proposed update data to determine the changes.
 *
 * FIX: Chỉ đánh dấu field là "thay đổi" khi key đó THỰC SỰ có trong proposedData.
 * Tránh trường hợp Owner chỉ đổi 1 field nhưng bị đếm thừa các field khác.
 *
 * @param {Object} poiDetail     The current POI details from DB
 * @param {Object} proposedData  The proposed draft data (PoiDraftDto)
 * @param {Object} categoryMap   Map of categoryId to categoryName
 * @returns {Object} { oldPoi, newPoi, changedFields, changeCount }
 */
export function getPoiChanges(poiDetail, proposedData, categoryMap = {}) {
  const masterContent = poiDetail?.contents?.find(c => c.isMaster)
  const oldCategoryIds = poiDetail?.categoryIds || []
  const oldLanguageCode = masterContent?.languageCode || ""

  const oldPoi = {
    id: poiDetail?.poiId || "",
    name: masterContent?.title || "Không có tên",
    categoryId: oldCategoryIds[0] || "",
    categoryIds: oldCategoryIds,
    categoryNames: oldCategoryIds.map(id => categoryMap[id] || id).filter(Boolean),
    categoryName: oldCategoryIds.map(id => categoryMap[id] || id).join(", ") || "Không xác định",
    description: masterContent?.description || "",
    latitude: String(poiDetail?.latitude || ""),
    longitude: String(poiDetail?.longitude || ""),
    priority: Number(poiDetail?.priority ?? 2),
    language: (oldLanguageCode || "").toLowerCase(),
    audio: normalizeAudio(masterContent?.audioUrl),
    images: (() => {
      const gallery = poiDetail?.gallery?.map(g => g.imageUrl) || []
      const logo = poiDetail?.logoUrl
      if (logo) return [logo, ...gallery.filter(u => u !== logo)]
      return gallery
    })(),
  }

  const newCategoryIds = [
    ...(proposedData?.CategoryIds || []),
    ...(proposedData?.categoryIds || []),
  ].filter((v, i, a) => v && a.indexOf(v) === i)  // unique, non-empty
  const resolvedCategoryIds = newCategoryIds.length > 0 ? newCategoryIds : oldPoi.categoryIds
  const newLanguageCode = ((proposedData?.LanguageCode ?? proposedData?.Language ?? oldLanguageCode) || "").toLowerCase()

  const newPoi = {
    id: proposedData?.poiId || oldPoi.id,
    name: proposedData?.Title ?? oldPoi.name,
    categoryId: resolvedCategoryIds[0] || oldPoi.categoryId,
    categoryIds: resolvedCategoryIds,
    categoryNames: resolvedCategoryIds.map(id => categoryMap[id] || id).filter(Boolean),
    categoryName: resolvedCategoryIds.map(id => categoryMap[id] || id).join(", ") || oldPoi.categoryName,
    description: proposedData?.Description ?? oldPoi.description,
    latitude: proposedData?.Latitude != null ? String(proposedData.Latitude) : oldPoi.latitude,
    longitude: proposedData?.Longitude != null ? String(proposedData.Longitude) : oldPoi.longitude,
    priority: proposedData?.Priority != null ? Number(proposedData.Priority) : oldPoi.priority,
    language: newLanguageCode,
    audio: hasKey(proposedData, 'AudioUrl')
      ? normalizeAudio(proposedData.AudioUrl)
      : oldPoi.audio,
    images: hasKey(proposedData, 'GalleryImageUrls')
      ? (proposedData.GalleryImageUrls ?? [])
      : oldPoi.images,
  }

  // FIX: chỉ tính thay đổi khi key thực sự có trong proposedData
  const changedFields = {
    name: hasKey(proposedData, 'Title')
      && oldPoi.name !== newPoi.name,

    // So sánh mảng categoryIds (thành phần có thể thay đổi cả số lượng lẫn nội dung)
    category: hasKey(proposedData, 'CategoryIds', 'categoryIds')
      && JSON.stringify([...oldPoi.categoryIds].sort()) !== JSON.stringify([...newPoi.categoryIds].sort()),

    location: (hasKey(proposedData, 'Latitude') || hasKey(proposedData, 'Longitude'))
      && (oldPoi.latitude !== newPoi.latitude || oldPoi.longitude !== newPoi.longitude),

    priority: hasKey(proposedData, 'Priority')
      && oldPoi.priority !== newPoi.priority,

    language: hasKey(proposedData, 'LanguageCode', 'Language')
      && oldPoi.language !== newPoi.language,

    audio: hasKey(proposedData, 'AudioUrl')
      && isAudioChanged(oldPoi.audio, newPoi.audio),

    description: hasKey(proposedData, 'Description')
      && oldPoi.description !== newPoi.description,

    // So sánh mảng ảnh: loại bỏ query params (SAS token), sort để tránh false-positive do thứ tự
    images: hasKey(proposedData, 'GalleryImageUrls')
      && JSON.stringify([...oldPoi.images].map(v => v.split('?')[0].toLowerCase()).sort()) !== JSON.stringify([...(newPoi.images || [])].map(v => v.split('?')[0].toLowerCase()).sort()),
  }

  const changeCount = Object.values(changedFields).filter(Boolean).length

  return {
    oldPoi,
    newPoi,
    changedFields,
    changeCount,
  }
}
