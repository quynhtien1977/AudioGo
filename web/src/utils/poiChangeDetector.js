const normalizeAudio = (v) => (v == null ? "" : v.trim())
const isAudioChanged = (oldAudio, newAudio) => normalizeAudio(oldAudio) !== normalizeAudio(newAudio)

/**
 * Compares current POI detail data and proposed update data to determine the changes.
 * 
 * @param {Object} poiDetail The current POI details from DB
 * @param {Object} proposedData The proposed draft data (PoiDraftDto)
 * @param {Object} categoryMap Map of categoryId to categoryName
 * @returns {Object} { oldPoi, newPoi, changedFields, changeCount }
 */
export function getPoiChanges(poiDetail, proposedData, categoryMap = {}) {
  const masterContent = poiDetail?.contents?.find(c => c.isMaster)
  const oldCategoryId = poiDetail?.categoryIds?.[0] || ""
  const oldLanguageCode = masterContent?.languageCode || ""

  const oldPoi = {
    id: poiDetail?.poiId || "",
    name: masterContent?.title || "Không có tên",
    categoryId: oldCategoryId,
    categoryName: categoryMap[oldCategoryId] || poiDetail?.category || "Không xác định",
    description: masterContent?.description || "",
    latitude: String(poiDetail?.latitude || ""),
    longitude: String(poiDetail?.longitude || ""),
    priority: Number(poiDetail?.priority ?? 2),
    language: oldLanguageCode,
    audio: normalizeAudio(masterContent?.audioUrl),
    images: (() => {
      const gallery = poiDetail?.gallery?.map(g => g.imageUrl) || []
      const logo = poiDetail?.logoUrl
      if (logo) return [logo, ...gallery.filter(u => u !== logo)]
      return gallery
    })(),
  }

  const newCategoryId = proposedData?.CategoryIds?.[0] ?? oldCategoryId
  const newLanguageCode = proposedData?.LanguageCode ?? proposedData?.Language ?? oldLanguageCode

  const newPoi = {
    id: proposedData?.poiId || oldPoi.id,
    name: proposedData?.Title ?? oldPoi.name,
    categoryId: newCategoryId,
    categoryName: categoryMap[newCategoryId] || oldPoi.categoryName,
    description: proposedData?.Description ?? oldPoi.description,
    latitude: proposedData?.Latitude != null ? String(proposedData.Latitude) : oldPoi.latitude,
    longitude: proposedData?.Longitude != null ? String(proposedData.longitude ?? proposedData.Longitude) : oldPoi.longitude,
    priority: proposedData?.Priority != null ? Number(proposedData.Priority) : oldPoi.priority,
    language: newLanguageCode,
    audio: proposedData?.AudioUrl !== undefined
      ? normalizeAudio(proposedData.AudioUrl)
      : oldPoi.audio,
    images: proposedData?.GalleryImageUrls ?? oldPoi.images,
  }

  const changedFields = {
    name: oldPoi.name !== newPoi.name,
    category: oldPoi.categoryId !== newPoi.categoryId,
    location: oldPoi.latitude !== newPoi.latitude || oldPoi.longitude !== newPoi.longitude,
    priority: oldPoi.priority !== newPoi.priority,
    language: oldPoi.language !== newPoi.language,
    audio: isAudioChanged(oldPoi.audio, newPoi.audio),
    description: oldPoi.description !== newPoi.description,
    images: JSON.stringify(oldPoi.images) !== JSON.stringify(newPoi.images)
  }

  const changeCount = Object.values(changedFields).filter(Boolean).length

  return {
    oldPoi,
    newPoi,
    changedFields,
    changeCount
  }
}
