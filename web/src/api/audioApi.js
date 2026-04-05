// src/api/audioApi.js

let fakeAudios = [
  {
    id: 1,
    name: "The Truffle Cellar Intro",
    poi: "The Golden Truffle",
    duration: "01:45",
    format: "MP3",
    url: ""
  },
  {
    id: 2,
    name: "Chef's Table Welcome",
    poi: "Main Kitchen",
    duration: "00:32",
    format: "WAV",
    url: ""
  },
  {
    id: 3,
    name: "Artisan Bakery History",
    poi: "Old Town Bakery",
    duration: "02:12",
    format: "MP3",
    url: ""
  }
]

export const getAudios = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...fakeAudios])
    }, 500) // giả lập delay network
  })
}

export const uploadAudio = (files) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAudios = files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        poi: "Unassigned",
        duration: "00:00",
        format: file.name.split(".").pop().toUpperCase(),
        url: URL.createObjectURL(file)
      }))

      fakeAudios = [...newAudios, ...fakeAudios]

      resolve(newAudios)
    }, 500)
  })
}

export const generateAudio = (script, voice) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAudio = {
        id: Date.now(),
        name: `AI_${script.slice(0, 10)}...`,
        poi: "AI Generated",
        duration: "00:45",
        format: "MP3",
        voice
      }

      fakeAudios = [newAudio, ...fakeAudios]

      resolve(newAudio)
    }, 800)
  })
}

export const deleteAudio = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fakeAudios = fakeAudios.filter(a => a.id !== id)
      resolve(true)
    }, 300)
  })
}