"use strict";

const audioInput = document.getElementById("audioFiles");
const videoInput = document.getElementById("videoFiles");
const imageInput = document.getElementById("imageFiles");
const musicContent = document.getElementById("musicContent");
const videoContent = document.getElementById("videoContent");
const videoList = document.getElementById("videoList");
const imageGallery = document.getElementById("imageGallery");
const audioStatus = document.getElementById("audioStatus");
const videoStatus = document.getElementById("videoStatus");
const imageStatus = document.getElementById("imageStatus");
const imageDialog = document.getElementById("imageDialog");
const largeImage = document.getElementById("largeImage");
const dialogCaption = document.getElementById("dialogCaption");

let tracks = [];
let trackIndex = -1;
let audioElement = null;
let audioSorted = false;
let shuffleEnabled = false;
let nextTrackOrder = 0;
let videoItems = [];
let currentVideoUrl = "";
let images = [];
let imageIndex = -1;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

function playTrack(index, autoplay = true) {
  if (!tracks.length || !audioElement) return;
  trackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  audioElement.src = track.url;
  document.getElementById("trackName").textContent = track.file.name;
  document.getElementById("trackInfo").textContent = `${trackIndex + 1} من ${tracks.length} · ${formatBytes(track.file.size)}`;
  musicContent.querySelectorAll(".track[data-track-index]").forEach((button, i) => button.setAttribute("aria-current", String(i === trackIndex)));
  if (autoplay) audioElement.play().catch(() => { audioStatus.textContent = "اضغط زر التشغيل في المشغّل لبدء الاستماع."; });
}

function advanceTrack() {
  if (shuffleEnabled && tracks.length > 1) {
    let nextIndex = trackIndex;
    while (nextIndex === trackIndex) nextIndex = Math.floor(Math.random() * tracks.length);
    playTrack(nextIndex);
  } else if (trackIndex < tracks.length - 1) {
    playTrack(trackIndex + 1);
  }
}

function renderTracks() {
  musicContent.replaceChildren();
  const sortButton = document.getElementById("sortAudio");
  const clearButton = document.getElementById("clearAudio");
  sortButton.disabled = tracks.length < 2;
  clearButton.disabled = tracks.length === 0;
  sortButton.textContent = audioSorted ? "ترتيب: أبجديًا" : "ترتيب: حسب الإضافة";
  if (!tracks.length) {
    musicContent.className = "empty";
    musicContent.textContent = "أضف ملفات صوتية من جهازك لبدء الاستماع.";
    audioElement = null;
    trackIndex = -1;
    return;
  }

  musicContent.className = "";
  const player = document.createElement("div");
  player.className = "music-player";
  const artwork = document.createElement("div");
  artwork.className = "music-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.textContent = "♫";
  const meta = document.createElement("div");
  meta.className = "music-meta";
  const name = document.createElement("strong");
  name.id = "trackName";
  const info = document.createElement("span");
  info.id = "trackInfo";
  audioElement = document.createElement("audio");
  audioElement.controls = true;
  audioElement.preload = "metadata";
  audioElement.setAttribute("aria-label", "مشغّل الموسيقى");
  audioElement.addEventListener("ended", advanceTrack);
  meta.append(name, info, audioElement);
  player.append(artwork, meta);

  const controls = document.createElement("div");
  controls.className = "player-actions";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "action-button secondary";
  previous.textContent = "السابق";
  previous.addEventListener("click", () => playTrack(trackIndex - 1));
  const next = document.createElement("button");
  next.type = "button";
  next.className = "action-button secondary";
  next.textContent = "التالي";
  next.addEventListener("click", () => playTrack(trackIndex + 1));
  const shuffle = document.createElement("button");
  shuffle.type = "button";
  shuffle.className = "action-button secondary";
  shuffle.textContent = shuffleEnabled ? "العشوائي: مفعّل" : "تشغيل عشوائي";
  shuffle.setAttribute("aria-pressed", String(shuffleEnabled));
  shuffle.addEventListener("click", () => {
    shuffleEnabled = !shuffleEnabled;
    shuffle.setAttribute("aria-pressed", String(shuffleEnabled));
    shuffle.textContent = shuffleEnabled ? "العشوائي: مفعّل" : "تشغيل عشوائي";
  });
  controls.append(previous, next, shuffle);
  meta.appendChild(controls);

  const playlist = document.createElement("div");
  playlist.className = "playlist";
  tracks.forEach((track, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "track";
    button.dataset.trackIndex = String(index);
    button.setAttribute("aria-current", "false");
    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("span");
    title.className = "track-name";
    title.textContent = track.file.name;
    button.append(number, title);
    button.addEventListener("click", () => playTrack(index));
    playlist.appendChild(button);
  });
  musicContent.append(player, playlist);
  if (trackIndex < 0) trackIndex = 0;
  playTrack(trackIndex, false);
}

audioInput.addEventListener("change", () => {
  const files = Array.from(audioInput.files || []).filter(file => file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name));
  files.forEach(file => tracks.push({ file, url: URL.createObjectURL(file), addedOrder: nextTrackOrder++ }));
  const activeTrack = tracks[trackIndex];
  if (audioSorted) tracks.sort((a, b) => a.file.name.localeCompare(b.file.name, "ar", { sensitivity: "base" }));
  if (activeTrack) trackIndex = tracks.indexOf(activeTrack);
  renderTracks();
  audioStatus.textContent = files.length ? `تمت إضافة ${files.length} ملفات صوتية.` : "لم يتم اختيار ملفات صوتية مدعومة.";
  audioInput.value = "";
});

document.getElementById("sortAudio").addEventListener("click", () => {
  const activeTrack = tracks[trackIndex];
  audioSorted = !audioSorted;
  tracks.sort((a, b) => audioSorted
    ? a.file.name.localeCompare(b.file.name, "ar", { sensitivity: "base" })
    : a.addedOrder - b.addedOrder);
  if (activeTrack) trackIndex = tracks.indexOf(activeTrack);
  renderTracks();
});

document.getElementById("clearAudio").addEventListener("click", () => {
  tracks.forEach(track => URL.revokeObjectURL(track.url));
  tracks = [];
  shuffleEnabled = false;
  renderTracks();
  audioStatus.textContent = "تم مسح قائمة الموسيقى.";
});

function selectVideo(index) {
  const item = videoItems[index];
  if (!item) return;
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = URL.createObjectURL(item.file);
  videoContent.className = "video-frame";
  videoContent.replaceChildren();
  const video = document.createElement("video");
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = currentVideoUrl;
  video.setAttribute("aria-label", item.file.name);
  videoContent.appendChild(video);
  videoStatus.textContent = `الفيديو الحالي: ${item.file.name}`;
  videoList.querySelectorAll("button").forEach((button, i) => button.setAttribute("aria-current", String(i === index)));
}

function renderVideos() {
  videoList.replaceChildren();
  videoItems.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "track";
    button.textContent = `${index + 1}. ${item.file.name}`;
    button.setAttribute("aria-current", "false");
    button.addEventListener("click", () => selectVideo(index));
    videoList.appendChild(button);
  });
  document.getElementById("clearVideo").disabled = videoItems.length === 0;
}

videoInput.addEventListener("change", () => {
  const files = Array.from(videoInput.files || []).filter(file => file.type.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v)$/i.test(file.name));
  const firstNewVideo = videoItems.length;
  files.forEach(file => videoItems.push({ file }));
  renderVideos();
  if (files.length) {
    selectVideo(firstNewVideo);
    videoStatus.textContent = `تمت إضافة ${files.length} فيديوهات.`;
  } else videoStatus.textContent = "لم يتم اختيار ملفات فيديو مدعومة.";
  videoInput.value = "";
});

document.getElementById("clearVideo").addEventListener("click", () => {
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = "";
  videoItems = [];
  videoList.replaceChildren();
  videoContent.className = "empty";
  videoContent.textContent = "اختر فيديو من جهازك لعرضه هنا.";
  document.getElementById("clearVideo").disabled = true;
  videoStatus.textContent = "تم مسح قائمة الفيديوهات.";
});

function renderImage(index) {
  if (!images.length) return;
  imageIndex = (index + images.length) % images.length;
  const image = images[imageIndex];
  largeImage.src = image.url;
  largeImage.alt = image.file.name;
  dialogCaption.textContent = `${image.file.name} · ${imageIndex + 1} من ${images.length}`;
}

imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files || []).filter(file => file.type.startsWith("image/"));
  if (files.length && images.length === 0) {
    imageGallery.replaceChildren();
    imageGallery.className = "gallery";
  }
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    images.push({ file, url });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-card";
    button.setAttribute("aria-label", `عرض الصورة ${file.name}`);
    const image = document.createElement("img");
    image.src = url;
    image.alt = file.name;
    image.loading = "lazy";
    const caption = document.createElement("span");
    caption.textContent = file.name;
    button.append(image, caption);
    const index = images.length - 1;
    button.addEventListener("click", () => {
      renderImage(index);
      if (typeof imageDialog.showModal === "function") imageDialog.showModal();
      else imageDialog.setAttribute("open", "");
    });
    imageGallery.appendChild(button);
  });
  document.getElementById("clearImages").disabled = images.length === 0;
  imageStatus.textContent = files.length ? `تمت إضافة ${files.length} صور.` : "لم يتم اختيار صور.";
  imageInput.value = "";
});

document.getElementById("previousImage").addEventListener("click", () => renderImage(imageIndex - 1));
document.getElementById("nextImage").addEventListener("click", () => renderImage(imageIndex + 1));
document.getElementById("closeDialog").addEventListener("click", () => {
  if (typeof imageDialog.close === "function") imageDialog.close();
  else imageDialog.removeAttribute("open");
});
document.getElementById("fullscreenImage").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (largeImage.requestFullscreen) await largeImage.requestFullscreen();
    else imageStatus.textContent = "ملء الشاشة غير مدعوم في هذا المتصفح.";
  } catch {
    imageStatus.textContent = "تعذر تفعيل وضع ملء الشاشة.";
  }
});
imageDialog.addEventListener("click", event => {
  if (event.target === imageDialog) {
    if (typeof imageDialog.close === "function") imageDialog.close();
    else imageDialog.removeAttribute("open");
  }
});
imageDialog.addEventListener("close", () => { largeImage.removeAttribute("src"); });
imageDialog.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") renderImage(imageIndex + 1);
  if (event.key === "ArrowRight") renderImage(imageIndex - 1);
  if (event.key === "Escape" && typeof imageDialog.close !== "function") imageDialog.removeAttribute("open");
});

document.getElementById("clearImages").addEventListener("click", () => {
  images.forEach(image => URL.revokeObjectURL(image.url));
  images = [];
  imageIndex = -1;
  imageGallery.replaceChildren();
  imageGallery.className = "empty";
  imageGallery.textContent = "اختر صورًا من جهازك لتكوين معرضك.";
  document.getElementById("clearImages").disabled = true;
  imageStatus.textContent = "تم مسح الصور.";
  if (imageDialog.open) imageDialog.close();
  else imageDialog.removeAttribute("open");
});

window.addEventListener("pagehide", () => {
  tracks.forEach(track => URL.revokeObjectURL(track.url));
  images.forEach(image => URL.revokeObjectURL(image.url));
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
});
