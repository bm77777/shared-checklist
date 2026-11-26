import { createSession, openHome, dataUrlBlob, parseBackup, importedPhotoId } from "./backend.js";

"use strict";

const sources = {
  contractguide: ["LX Z:IN 리모델링 계약·공사 준비", "https://www.lxzin.com/styling/style-guide/detail/7159?listButton=true"],
  consumer: ["한국소비자원 주택 인테리어 피해 사례와 계약·하자 확인", "https://www.kca.go.kr/home/sub.do?menukey=4005&mode=view&no=1001947436"],
  condo: ["찾기쉬운 생활법령정보 아파트 인테리어 공사", "https://www.easylaw.go.kr/CSP/OnhunqueansInfoRetrieve.laf?onhunqnaAstSeq=84&onhunqueSeq=5334&pagingType=&sortType=&targetRow=1"],
  asbestos: ["환경부 석면조사 안내", "https://asbestos.mcee.go.kr/u23/contents2023/868Page.do"],
  wet: ["LX Z:IN 난방·욕실·수도 시공 가이드", "https://www.lxzin.com/styling/expert-style/detail/2547"],
  dishwasher: ["LG전자 식기세척기 설치가이드", "https://www.lge.co.kr/story/user-guide/dishwashers-install-guide"],
  induction: ["LG전자 전기레인지 설치가이드", "https://www.lge.co.kr/story/user-guide/electric-ranges-install-guide"],
  robot: ["LG전자 로봇청소기 설치가이드", "https://www.lge.co.kr/story/user-guide/robot-vacuum-cleaners-install-guide"],
  process: ["LX Z:IN 공정별 체크리스트", "https://www.lxzin.com/styling/style-guide/detail/7398"],
  prepare: ["LX Z:IN 상담 준비 가이드", "https://www.lxzin.com/styling/style-guide/detail/3697?listButton=true"],
  demolition: ["LX Z:IN 철거·창호·목공", "https://www.lxzin.com/styling/expert-style/detail/2516"],
  law: ["찾기쉬운 생활법령정보 발코니 확장공사", "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=2&cciNo=1&cnpClsNo=2&csmSeq=1222"],
  acoustic: ["크나우프 차음 솔루션", "https://knauf.com/ko-KR/performance/acoustics/knauf-gypsum"],
  window: ["LX Z:IN 공간별 창호 선택", "https://www.lxzin.com/styling/expert-style/detail/2795"],
  door: ["LX Z:IN 도어 종류·부자재", "https://www.lxzin.com/styling/style-guide/detail/7500"],
  middle: ["예림 중문 제품 분류", "https://www.yerim.net/kor/products/products-list.html?depth1=2"],
  built: ["LX Z:IN 공간별 빌트인 시스템", "https://www.lxzin.com/styling/life-book/detail/7360"],
  molding: ["LX Z:IN 몰딩 종류·시공", "https://www.lxzin.com/styling/style-guide/detail/120"],
  electric: ["르그랑코리아 배선기구 자료", "https://www.legrand.co.kr/sites/g/files/ocwmcr496/files/files/collection_detail_2/Taviang%20Brochure2022_%EC%88%98%EC%A0%95_0104_0.pdf"],
  smart: ["현대에이치티 스마트홈", "https://www.hyundaiht.co.kr/kr/product/smart_home/solution.php"],
  lighting: ["LEDVANCE 벽·천장 직부 조명", "https://www.ledvance.com/ko-kr/professional-lighting/lighting-insights/product-stories/led-luminaires-online-special/products/led-surface-luminaires"],
  lighting2: ["LEDVANCE 스폿·다운라이트", "https://www.ledvance.com/ko-kr/home-lighting/products/indoor-luminaires/seupoteulaiteuwa-daun-laiteu-c421190"],
  hvac: ["LG전자 시스템에어컨 구매가이드", "https://www.lge.co.kr/story/buying-guide/lg-system-air-conditioners-guide"],
  vent: ["하츠 환기 카탈로그", "https://www.haatz.com/upload/catalog/202601/1767252845_m0287014_20260101163405.pdf"],
  kitchen: ["IKEA 주방 플래닝 가이드", "https://www.ikea.com/kr/ko/files/pdf/97/42/9742dbd1/ikea_kitchen_planning_guide_kr.pdf"],
  kitchenstyle: ["LX Z:IN 주방 배치·조명", "https://www.lxzin.com/styling/style-guide/detail/2341?listButton=true"],
  island: ["IKEA 아일랜드 식탁·카트", "https://www.ikea.com/kr/ko/cat/kitchen-islands-trolleys-10471/"],
  bath: ["LX Z:IN 욕실 리모델링 가이드", "https://www.lxzin.com/styling/style-guide/detail/7719"],
  bathcatalog: ["대림 바스앤키친 욕실 카탈로그", "https://www.daelimbath.com/upload/down/2025_bk_bath_catalog_2.pdf"],
  tile: ["LX Z:IN 타일 인테리어 가이드", "https://www.lxzin.com/styling/style-guide/detail/3532?listButton=true"],
  floor: ["LX Z:IN 바닥재 종류·시공", "https://www.lxzin.com/styling/style-guide/detail/6619?listButton=true"],
  baseboard: ["예림 30·40 mm 걸레받이", "https://yerim.net/kor/products/products-view.html?depth1=5&depth2=48&depth3=148&uid=1320"],
  wallpaper: ["LX Z:IN 벽지 종류·관리", "https://www.lxzin.com/styling/style-guide/detail/5959"],
  film: ["LX Z:IN 인테리어 필름 가이드", "https://www.lxzin.com/styling/style-guide/detail/4690"],
  curtain: ["IKEA 커튼·블라인드", "https://www.ikea.com/kr/ko/cat/curtains-blinds-tl002/"]
};

const defaultRooms = ["전체·공통", "현관", "복도", "거실", "주방", "다이닝", "안방", "작은방", "방 2", "방 3", "드레스룸", "화장실", "안방욕실", "다용도실", "발코니", "테라스"];
const existingRoomNames = { "방 1": "작은방", "공용욕실": "화장실" };
const finishes = ["천장·목공·몰딩", "타일·줄눈·석재", "바닥·걸레받이", "벽·벽지·도장·필름"];
const roomCategories = {
  "발코니": ["발코니·세탁·다용도실", "창호·유리·방충망", "타일·줄눈·석재", "벽·벽지·도장·필름", "냉난방·환기·배관", "맞춤가구·수납"],
  "거실": ["조명·스위치 회로", "거실·침실·창 가림", "창호·유리·방충망", "냉난방·환기·배관", "맞춤가구·수납", ...finishes],
  "주방": ["주방 배치·아일랜드", "주방 가구·상판·가전", "냉난방·환기·배관", "창호·유리·방충망", "맞춤가구·수납", ...finishes],
  "안방": ["거실·침실·창 가림", "맞춤가구·수납", "실내문·문틀", "창호·유리·방충망", "냉난방·환기·배관", ...finishes],
  "작은방": ["거실·침실·창 가림", "맞춤가구·수납", "실내문·문틀", "창호·유리·방충망", "냉난방·환기·배관", ...finishes],
  "화장실": ["욕실·방수·도기", "타일·줄눈·석재", "실내문·문틀", "천장·목공·몰딩", "냉난방·환기·배관"],
  "현관": ["현관·중문", "타일·줄눈·석재", "맞춤가구·수납", ...finishes]
};
const sharedRoomCategories = new Set(["철거·구조·단열", "전기·통신·스마트홈", "조명·스위치 회로", "안전·접근성·특수 공간", "공사 중 중간검수", "준공·하자 확인"]);
const stages = {
  brief: "첫 상담",
  design: "실측·설계",
  contract: "견적·계약",
  pre: "착공 전",
  work: "공사 중",
  handover: "준공·인수"
};
const categoryStages = {
  "범위·생활 계획": "brief",
  "현장 실측·착공 준비": "pre",
  "견적·시공 인계": "contract",
  "공사 중 중간검수": "work",
  "준공·하자 확인": "handover"
};
const catalog = [];
for (const line of document.getElementById("catalog").textContent.trim().split(/\r?\n/)) {
  if (line.startsWith("# ")) {
    const [name, room, refs] = line.slice(2).split("|");
    catalog.push({ name, room: existingRoomNames[room] ?? room, refs: refs.split(","), items: [] });
  } else if (line.trim()) {
    const category = catalog.at(-1);
    const [name, options, stage = categoryStages[category.name] || "design", guidance] = line.split("|");
    category.items.push({ name, options: options.split(" / "), stage, guidance });
  }
}

let data = { rooms: [], entries: {} };
let photos = {};
let sessionHome;
let membership;
let planBlob;
let planUrl;
let planRegions = [];
const photoDrafts = new Map();
const pendingPhotoIds = new WeakMap();
const savingPhotos = new Set();
const noteDrafts = new Map();
const pendingChoices = new Map();
const privatePhotoUrls = new Map();
let incomingDraw = 0;

function referencePhotoKey(room) {
  return JSON.stringify(["reference", room]);
}
const roomSelect = document.getElementById("room");
const categorySelect = document.getElementById("categorySelect");
const nav = document.getElementById("categoryNav");
const search = document.getElementById("search");
const stageFilter = document.getElementById("stageFilter");
const results = document.getElementById("catalogResults");
const showSelection = document.getElementById("showSelection");
const selectionView = document.getElementById("selectionView");
const catalogView = document.getElementById("catalogView");
const feedback = document.getElementById("feedback");
let activeCategory = 0;
let activeRoom = defaultRooms[0];
let followCategoryRoom = true;
let planRoom = "";
let referenceRoom = "";
const planRoomList = document.getElementById("planRoomList");
const workspace = document.getElementById("workspace");
const workspaceTitle = document.getElementById("workspaceTitle");

function categoryApplies(category, room) {
  if (!room) return true;
  return sharedRoomCategories.has(category) || roomCategories[room].includes(category);
}

function itemApplies(category, item) {
  if (!planRoom || category.name !== "거실·침실·창 가림") return true;
  if (planRoom === "거실") return !["방 용도·가구 배치", "침대·서재 편의"].includes(item.name);
  return item.name !== "거실 생활 배치";
}

function moveToOptions() {
  workspaceTitle.focus({ preventScroll: true });
  workspace.scrollIntoView({ block: "start" });
}

function selectPlanRoom(room) {
  planRoom = room;
  activeRoom = room;
  followCategoryRoom = !room;
  const preferredCategory = room ? roomCategories[room][0] : catalog[0].name;
  openCategory(catalog.findIndex(category => category.name === preferredCategory));
  moveToOptions();
}

function highlightPlanRoom(room, highlighted) {
  const region = planRegions.find(node => node.dataset.planRoom === room);
  const shortcut = Array.from(planRoomList.children).find(node => node.dataset.planRoom === room);
  region.toggleAttribute("data-highlighted", highlighted);
  shortcut.toggleAttribute("data-highlighted", highlighted);
}

function renderPlanState() {
  workspace.toggleAttribute("data-room-selected", Boolean(planRoom));
  if (planRoom) workspace.dataset.planRoom = planRoom;
  else delete workspace.dataset.planRoom;
  workspaceTitle.textContent = planRoom ? planRoom + " 체크리스트" : "전체 공정 체크리스트";
  document.getElementById("scopeHint").textContent = planRoom
    ? "단계와 검색어는 선택한 공간의 공정에서 찾아요."
    : "단계와 검색어는 전체 공정에서 찾아요.";
  for (const region of planRegions) {
    if (region.dataset.planRoom === planRoom) region.setAttribute("aria-current", "true");
    else region.removeAttribute("aria-current");
  }
  for (const shortcut of planRoomList.children) {
    shortcut.setAttribute("aria-pressed", String(shortcut.dataset.planRoom === planRoom));
  }
}

function make(tag, content, className) {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  if (className) node.className = className;
  return node;
}
function button(text, action) {
  const node = make("button", text);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}
function sourceLink(key) {
  const [name, url] = sources[key];
  const link = make("a", name);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}
function recordKey(category, item, room) {
  return JSON.stringify([category.name, item.name, room]);
}
function entry(category, item, room) {
  return data.entries[recordKey(category, item, room)] ?? { choices: [], custom: [], note: "", revision: 0 };
}
function renderRooms() {
  roomSelect.replaceChildren(new Option("공정 기본 공간", ""));
  for (const room of [...defaultRooms, ...data.rooms]) {
    roomSelect.append(new Option(room, room));
  }
  roomSelect.value = followCategoryRoom ? "" : activeRoom;
}
function updateCounts() {
  const counts = new Map();
  const roomCounts = new Map();
  let total = 0;
  for (const [key, value] of Object.entries(data.entries)) {
    const [category, , room] = JSON.parse(key);
    total += value.choices.length;
    counts.set(category, (counts.get(category) ?? 0) + value.choices.length);
    roomCounts.set(room, (roomCounts.get(room) ?? 0) + value.choices.length);
  }
  document.getElementById("selectedCount").textContent = total;
  catalog.forEach((category, index) => {
    nav.children[index].querySelector(".nav-count").textContent = counts.get(category.name) || "";
  });
  for (const shortcut of planRoomList.children) {
    const count = roomCounts.get(shortcut.dataset.planRoom);
    shortcut.querySelector(".plan-room-count").textContent = count ? count + "개" : "";
  }
}
function openCategory(index) {
  activeCategory = index;
  if (followCategoryRoom) activeRoom = catalog[index].room;
  roomSelect.value = followCategoryRoom ? "" : activeRoom;
  search.value = "";
  stageFilter.value = "";
  renderCatalog();
}
function renderNav() {
  catalog.forEach((category, index) => {
    const navButton = button(category.name, () => openCategory(index));
    navButton.append(make("span", "", "nav-count"));
    nav.append(navButton);
    categorySelect.append(new Option(category.name, index));
  });
}
function wirePlan() {
  for (const region of planRegions) {
    const room = region.dataset.planRoom;
    const shortcut = button(room, () => selectPlanRoom(room));
    shortcut.dataset.planRoom = room;
    shortcut.append(make("span", "", "plan-room-count"));
    planRoomList.append(shortcut);
    region.addEventListener("click", event => {
      event.preventDefault();
      selectPlanRoom(room);
    });
    region.addEventListener("keydown", event => {
      if (event.key !== " ") return;
      event.preventDefault();
      selectPlanRoom(room);
    });
    for (const control of [region, shortcut]) {
      control.addEventListener("pointerenter", () => highlightPlanRoom(room, true));
      control.addEventListener("pointerleave", () => highlightPlanRoom(room, false));
      control.addEventListener("focus", () => highlightPlanRoom(room, true));
      control.addEventListener("blur", () => highlightPlanRoom(room, false));
    }
  }
  document.getElementById("browseFromPlan").addEventListener("click", event => {
    event.preventDefault();
    selectPlanRoom("");
  });
}
function photoGallery(images, interactive = true, onDelete) {
  const gallery = make("div", undefined, "photo-grid");
  images.slice().reverse().forEach((source, index) => {
    const image = make("img");
    image.src = source;
    image.alt = "첨부 사진 " + (index + 1);
    if (interactive) {
      image.loading = "lazy";
      const thumb = button("", () => {
        document.getElementById("fullPhoto").src = source;
        document.getElementById("photoViewer").showModal();
      });
      thumb.className = "photo-thumb";
      thumb.setAttribute("aria-label", image.alt + " 확대");
      thumb.append(image);
      if (onDelete) {
        const tile = make("div", undefined, "photo-tile");
        const remove = button("×", () => onDelete(images.length - index - 1, source, index));
        remove.className = "photo-delete";
        remove.title = "사진 삭제";
        remove.setAttribute("aria-label", image.alt + " 삭제");
        tile.append(thumb, remove);
        gallery.append(tile);
      } else {
        gallery.append(thumb);
      }
    } else {
      gallery.append(image);
    }
  });
  return gallery;
}

async function encodePhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = make("img");
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = make("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", .86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function refreshPhotos(key, message) {
  for (const section of document.querySelectorAll(".photo-section")) {
    if (section.dataset.photoKey === key) section.dispatchEvent(new CustomEvent("photos-changed", { detail: message }));
  }
  if (!selectionView.hidden) renderSelection();
}

function confirmPhotoDelete(onConfirm) {
  const dialog = document.getElementById("deletePhotoDialog");
  dialog.returnValue = "cancel";
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "delete") onConfirm();
  }, { once: true });
  dialog.showModal();
}

function attachPhotoTools(key, updateHeading) {
  const wrapper = make("div", undefined, "photo-section");
  wrapper.dataset.photoKey = key;
  const paste = make("textarea", undefined, "photo-paste");
  paste.rows = 1;
  paste.placeholder = "여기를 클릭하고 Ctrl+V 또는 ⌘V로 사진 붙여넣기";
  paste.setAttribute("aria-label", "사진 붙여넣기");
  const controls = make("div", undefined, "inline");
  const status = make("p", "", "photo-status hint");
  status.setAttribute("role", "status");
  const gallerySlot = make("div");
  const picker = make("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.multiple = true;
  picker.hidden = true;
  const save = button("사진 저장", async () => {
    const files = photoDrafts.get(key) ?? [];
    if (!files.length || savingPhotos.has(key)) return;
    savingPhotos.add(key);
    save.disabled = true;
    status.textContent = "사진을 저장하는 중…";
    const room = JSON.parse(key)[1];
    const failed = [];
    let stored = 0;
    for (const file of files) {
      try {
        const encoded = await encodePhoto(file);
        if (!pendingPhotoIds.has(file)) pendingPhotoIds.set(file, crypto.randomUUID().replaceAll("-", ""));
        await sessionHome.addPhoto(room, dataUrlBlob(encoded), pendingPhotoIds.get(file));
        stored++;
      } catch {
        failed.push(file);
      }
    }
    const remaining = [...failed, ...(photoDrafts.get(key) ?? []).slice(files.length)];
    if (remaining.length) photoDrafts.set(key, remaining);
    else photoDrafts.delete(key);
    savingPhotos.delete(key);
    refreshPhotos(key, [stored ? stored + "장 저장됨." : "", failed.length ? failed.length + "장 저장 실패. 다시 시도할 수 있어요." : ""].filter(Boolean).join(" "));
  });

  function removePhoto(_index, source, position) {
    confirmPhotoDelete(async () => {
      const photo = findPhoto(source);
      if (!photo) return;
      try {
        const cleaned = await sessionHome.deletePhoto(photo);
        refreshPhotos(key, cleaned ? "사진을 삭제했어요." : "목록에서 삭제했습니다. 저장소 정리는 다시 확인해 주세요.");
        const buttons = gallerySlot.querySelectorAll(".photo-delete");
        (buttons[Math.min(position, buttons.length - 1)] ?? paste).focus({ preventScroll: true });
      } catch {
        refreshPhotos(key, "삭제 요청을 저장하지 못했어요. 연결을 확인하고 다시 시도하세요.");
      }
    });
  }

  function renderGallery() {
    const images = photos[key] ?? [];
    gallerySlot.replaceChildren();
    if (images.length) gallerySlot.append(photoGallery(images, true, removePhoto));
    save.disabled = savingPhotos.has(key) || !(photoDrafts.get(key)?.length);
  }
  function queue(files) {
    if (!files.length) return;
    const pending = [...(photoDrafts.get(key) ?? []), ...files];
    photoDrafts.set(key, pending);
    status.textContent = pending.length + "장 저장 대기 중. ‘사진 저장’을 누르세요.";
    save.disabled = savingPhotos.has(key);
  }
  wrapper.addEventListener("photos-changed", event => {
    renderGallery();
    updateHeading();
    if (event.detail !== undefined) status.textContent = event.detail;
  });

  wrapper.addEventListener("paste", event => {
    const files = Array.from(event.clipboardData?.files ?? []).filter(file => file.type.startsWith("image/"));
    if (files.length || event.target === paste) event.preventDefault();
    queue(files);
    if (!files.length && event.target === paste) status.textContent = "복사한 이미지가 없어요. 이미지를 복사하거나 파일을 선택하세요.";
  });
  paste.addEventListener("input", () => { paste.value = ""; });
  picker.addEventListener("change", () => {
    queue(Array.from(picker.files).filter(file => file.type.startsWith("image/")));
    picker.value = "";
  });
  controls.append(button("사진 파일 선택", () => picker.click()), save, picker);
  wrapper.append(paste, controls, status, gallerySlot);
  const waiting = photoDrafts.get(key)?.length;
  if (waiting) status.textContent = waiting + "장 저장 대기 중.";
  renderGallery();
  return wrapper;
}

function renderReferencePhotos(room) {
  if (room === referenceRoom) return;
  referenceRoom = room;
  const key = referencePhotoKey(room);
  const title = document.getElementById("referencePhotosTitle");
  const slot = document.getElementById("referencePhotoTools");
  function updateHeading() {
    if (referenceRoom !== room) return;
    title.textContent = "레퍼런스 사진 · " + room + " · " + (photos[key]?.length ?? 0) + "장";
  }
  updateHeading();
  slot.replaceChildren(attachPhotoTools(key, updateHeading));
}

function renderCard(category, item, room) {
  const key = recordKey(category, item, room);
  const value = entry(category, item, room);
  const card = make("article", undefined, "card");
  card.dataset.recordKey = key;
  const fields = make("fieldset");
  const legend = make("legend", item.name);
  const stage = make("span", stages[item.stage], "item-stage");
  stage.setAttribute("aria-hidden", "true");
  legend.append(stage);
  const options = make("div", undefined, "options");
  fields.append(legend);
  if (item.guidance) fields.append(make("p", item.guidance, "hint item-guidance"));
  fields.append(options);
  function appendChoice(option) {
    const label = make("label", undefined, "option");
    const checkbox = make("input");
    checkbox.type = "checkbox";
    checkbox.value = option;
    const rowKey = JSON.stringify([...JSON.parse(key), option]);
    checkbox.checked = pendingChoices.get(rowKey) ?? entry(category, item, room).choices.includes(option);
    checkbox.disabled = pendingChoices.has(rowKey);
    checkbox.addEventListener("change", () => saveChoice(key, option, checkbox.checked, !item.options.includes(option)));
    label.append(checkbox, make("span", option));
    options.append(label);
  }

  const extra = make("details");
  const extraTitle = make("summary");
  const inputs = make("div", undefined, "extra");
  const noteLabel = make("label", "상담 메모 (치수, 모델, 질문, 참고 링크 등)");
  const note = make("textarea");
  note.rows = 2;
  note.maxLength = 3000;
  note.value = noteDrafts.get(key)?.text ?? value.note;
  noteLabel.append(note);
  const noteStatus = make("p", "", "note-status hint");
  noteStatus.setAttribute("role", "status");
  const noteSave = button("메모 저장", () => saveNote(key, false));
  noteSave.className = "note-save";
  const noteRetry = button("최신 버전에 내 메모 저장", () => saveNote(key, true));
  const latestNote = make("p", "", "note-status hint");
  function refreshCard() {
    const latest = entry(category, item, room);
    const draft = noteDrafts.get(key);
    const displayed = new Set([...options.querySelectorAll("input")].map(input => input.value));
    for (const option of [...new Set([...item.options, ...latest.custom])]) {
      if (!displayed.has(option)) appendChoice(option);
    }
    for (const input of options.querySelectorAll("input")) {
      const pending = pendingChoices.get(JSON.stringify([...JSON.parse(key), input.value]));
      input.checked = pending ?? latest.choices.includes(input.value);
      input.disabled = pending !== undefined;
    }
    const conflict = draft && draft.revision !== latest.revision;
    const nextNote = draft?.text ?? latest.note;
    if (note.value !== nextNote) note.value = nextNote;
    extraTitle.textContent = nextNote.trim() ? "직접 추가 · 메모 있음" : "직접 추가 · 메모";
    noteStatus.textContent = draft?.saving ? "메모 저장 중…" : conflict
      ? "다른 사람이 이 메모를 먼저 수정했어요. 입력 내용은 그대로 두었습니다."
      : draft?.error || (draft ? "저장할 변경 사항이 있어요." : "");
    latestNote.hidden = !conflict;
    latestNote.textContent = conflict ? "현재 공유 메모 · " + (latest.note || "비어 있음") : "";
    noteSave.disabled = !draft || Boolean(draft.saving || conflict);
    noteRetry.hidden = !conflict;
    noteRetry.disabled = Boolean(draft?.saving);
  }
  card.addEventListener("shared-records", refreshCard);
  note.addEventListener("input", () => {
    const old = noteDrafts.get(key);
    const latest = entry(category, item, room);
    if (note.value === latest.note && !old?.saving) noteDrafts.delete(key);
    else noteDrafts.set(key, { ...old, text: note.value, revision: old?.revision ?? latest.revision, error: "" });
    refreshCard();
  });
  refreshCard();

  const addForm = make("form", undefined, "inline");
  const custom = make("input");
  custom.type = "text";
  custom.maxLength = 100;
  custom.required = true;
  custom.placeholder = "새 옵션 (예: 45 mm)";
  custom.setAttribute("aria-label", item.name + "에 직접 추가할 옵션");
  const add = make("button", "옵션 추가");
  add.type = "submit";
  custom.addEventListener("input", () => custom.setCustomValidity(""));
  addForm.addEventListener("submit", async event => {
    event.preventDefault();
    const option = custom.value.trim();
    if (!option || [...item.options, ...entry(category, item, room).custom].includes(option)) {
      custom.setCustomValidity(option ? "이미 있는 옵션입니다." : "옵션 이름을 입력하세요.");
      custom.reportValidity();
      return;
    }
    if (await saveChoice(key, option, true, true)) custom.value = "";
    if (custom.isConnected) custom.focus();
  });
  addForm.append(custom, add);
  inputs.append(addForm, noteLabel, noteSave, noteRetry, noteStatus, latestNote);
  extra.append(extraTitle, inputs);
  card.append(fields, extra);
  return card;
}
function renderCatalog() {
  const aliases = { 샷시: "창호", 샤시: "창호", 베란다: "발코니", 매립등: "다운라이트" };
  const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const stage = stageFilter.value;
  const filterAcrossCategories = words.length > 0 || stage !== "";
  renderPlanState();
  renderReferencePhotos(followCategoryRoom ? catalog[activeCategory].room : activeRoom);
  categorySelect.value = activeCategory;
  Array.from(nav.children).forEach((node, index) => {
    const available = categoryApplies(catalog[index].name, planRoom);
    node.hidden = !available;
    categorySelect.options[index].hidden = !available;
    categorySelect.options[index].disabled = !available;
    if (!filterAcrossCategories && index === activeCategory) node.setAttribute("aria-current", "true");
    else node.removeAttribute("aria-current");
  });
  results.replaceChildren();
  for (const [index, category] of catalog.entries()) {
    if (!categoryApplies(category.name, planRoom)) continue;
    if (!filterAcrossCategories && index !== activeCategory) continue;
    const room = followCategoryRoom ? category.room : activeRoom;
    const items = category.items.filter(item => {
      if (!itemApplies(category, item)) return false;
      if (stage && item.stage !== stage) return false;
      const own = entry(category, item, room);
      const haystack = [category.name, item.name, item.guidance, ...item.options, ...own.custom].join(" ").toLowerCase();
      const normalized = haystack.replaceAll(" ", "");
      return words.every(word => normalized.includes(word) || (aliases[word] && normalized.includes(aliases[word])));
    });
    if (!items.length) continue;
    const section = make("section");
    const heading = make("div", undefined, "heading");
    heading.append(make("h2", category.name), make("span", room + " · " + items.length + "개 항목", "meta"));
    const refs = make("p", undefined, "group-sources");
    category.refs.forEach(key => refs.append(sourceLink(key)));
    section.append(heading, refs);
    items.forEach(item => section.append(renderCard(category, item, room)));
    results.append(section);
  }
  if (!results.children.length) results.append(make("p", "해당 조건의 항목을 찾지 못했어요.", "hint"));
}
function chosenRooms() {
  const rooms = [];
  for (const room of [...defaultRooms, ...data.rooms]) {
    const groups = [];
    const images = photos[referencePhotoKey(room)] ?? [];
    for (const category of catalog) {
      const items = category.items.map(item => ({ item, value: entry(category, item, room) }))
        .filter(({ value }) => value.choices.length || value.note.trim());
      if (items.length) groups.push({ category, items });
    }
    if (groups.length || images.length) rooms.push({ room, groups, images });
  }
  return rooms;
}
function summaryFragment(rooms, editable = false) {
  const fragment = document.createDocumentFragment();
  for (const { room, groups, images } of rooms) {
    const section = make("section", undefined, "summary-room");
    section.append(make("h3", room));
    if (images.length) {
      section.append(make("h4", "레퍼런스 사진"), photoGallery(images, editable));
    }
    for (const { category, items } of groups) {
      const heading = make("h4", category.name);
      const list = make("ul");
      for (const { item, value } of items) {
        const row = make("li");
        row.append(make("strong", item.name));
        if (value.choices.length) row.append(" — " + value.choices.join(", "));
        if (value.note.trim()) row.append(make("span", value.note.trim(), "memo"));
        list.append(row);
      }
      if (editable) {
        heading.append(" ", button("수정", () => {
          planRoom = "";
          followCategoryRoom = false;
          activeRoom = room;
          openCategory(catalog.indexOf(category));
          setView(false);
          results.querySelector("h2").scrollIntoView({ block: "nearest" });
        }));
      }
      section.append(heading, list);
    }
    fragment.append(section);
  }
  return fragment;
}
function renderSelection() {
  const rooms = chosenRooms();
  const summary = document.getElementById("selectionResults");
  const enabled = rooms.length > 0;
  const photoCount = Object.values(photos).reduce((sum, images) => sum + images.length, 0);
  document.getElementById("selectionMeta").textContent = enabled
    ? rooms.length + "개 공간 · 체크한 옵션 " + document.getElementById("selectedCount").textContent + "개 · 사진 " + photoCount + "장"
    : "옵션을 체크하거나 메모 또는 사진을 추가하면 여기에 표시됩니다.";
  summary.replaceChildren(summaryFragment(rooms, true));
  document.getElementById("download").disabled = !enabled;
  document.getElementById("print").disabled = !enabled;
}
function setView(show) {
  showSelection.setAttribute("aria-pressed", String(show));
  catalogView.hidden = show;
  selectionView.hidden = !show;
  feedback.textContent = "";
  if (show) renderSelection();
}
function downloadFile(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = make("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadSelection() {
  const lines = ["우리 집 인테리어 체크리스트"];
  for (const { room, groups, images } of chosenRooms()) {
    lines.push("", "[" + room + "]");
    if (images.length) lines.push("레퍼런스 사진 " + images.length + "장 (HTML에서 확인)");
    for (const { category, items } of groups) {
      lines.push("", category.name);
      for (const { item, value } of items) {
        lines.push("- " + item.name + (value.choices.length ? " — " + value.choices.join(", ") : ""));
        if (value.note.trim()) lines.push(...value.note.trim().split("\n").map(line => "  " + line));
      }
    }
  }
  downloadFile(lines.join("\n") + "\n", "text/plain;charset=utf-8", "내-인테리어-목록.txt");
}

const photoViewer = document.getElementById("photoViewer");
document.getElementById("closePhoto").addEventListener("click", () => photoViewer.close());
photoViewer.addEventListener("click", event => {
  if (event.target === photoViewer) photoViewer.close();
});
document.getElementById("exportHtml").addEventListener("click", exportChecklist);
roomSelect.addEventListener("change", () => {
  followCategoryRoom = roomSelect.value === "";
  activeRoom = roomSelect.value || catalog[activeCategory].room;
  renderCatalog();
});
categorySelect.addEventListener("change", () => openCategory(Number(categorySelect.value)));
search.addEventListener("input", renderCatalog);
stageFilter.addEventListener("change", renderCatalog);
showSelection.addEventListener("click", () => setView(selectionView.hidden));
document.getElementById("backToCatalog").addEventListener("click", () => setView(false));
document.getElementById("download").addEventListener("click", downloadSelection);
document.getElementById("print").addEventListener("click", () => {
  const sheet = document.getElementById("printSheet");
  sheet.replaceChildren(make("h2", "우리 집 인테리어 체크리스트"), summaryFragment(chosenRooms()));
  window.print();
});

const roomDialog = document.getElementById("roomDialog");
const roomName = document.getElementById("roomName");
document.getElementById("addRoom").addEventListener("click", () => {
  roomName.value = "";
  roomName.setCustomValidity("");
  roomDialog.showModal();
  roomName.focus();
});
document.getElementById("cancelRoom").addEventListener("click", () => roomDialog.close());
roomName.addEventListener("input", () => roomName.setCustomValidity(""));
document.getElementById("roomForm").addEventListener("submit", async event => {
  event.preventDefault();
  const room = roomName.value.trim();
  if (!room || [...defaultRooms, ...data.rooms].includes(room)) {
    roomName.setCustomValidity(room ? "이미 있는 공간입니다." : "공간 이름을 입력하세요.");
    roomName.reportValidity();
    return;
  }
  try {
    await sessionHome.write("room", [room], {});
    followCategoryRoom = false;
    planRoom = "";
    activeRoom = room;
    renderRooms();
    renderCatalog();
    roomDialog.close();
  } catch {
    roomName.setCustomValidity("공간을 저장하지 못했습니다. 연결을 확인하고 다시 시도하세요.");
    roomName.reportValidity();
  }
});

for (const key of Object.keys(sources)) {
  const item = make("li");
  item.append(sourceLink(key));
  document.getElementById("sourceList").append(item);
}
renderNav();
for (const [value, label] of Object.entries(stages)) stageFilter.append(new Option(label, value));

const loginPanel = document.getElementById("loginPanel");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const loginSignOut = document.getElementById("loginSignOut");
const loginRetry = make("button", "연결 다시 시도");
loginRetry.type = "button";
loginRetry.hidden = true;
loginSignOut.before(loginRetry);
const header = document.getElementById("appHeader");
const main = document.getElementById("appMain");
const importButton = document.getElementById("importHtml");
const importFile = document.getElementById("importFile");
let loginClient;
let signedInUser;
let connectionId = 0;
let recordList = [];
let syncText = "";
let busyLabel = "";
let photoOrder = [];

function status(message) {
  syncText = message;
  document.getElementById("syncStatus").textContent = busyLabel || syncText;
}

function activity(message) {
  busyLabel = message;
  status(syncText);
}

function renderPrivatePlan(profile, image) {
  const svg = document.getElementById("sharedPlan");
  const svgNamespace = "http://www.w3.org/2000/svg";
  function element(tag, attributes, contents) {
    const node = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (contents !== undefined) node.textContent = contents;
    return node;
  }
  if (!Array.isArray(profile?.zones) || !/^[\d .-]+$/.test(profile.viewBox) ||
      !Number.isFinite(profile.width) || !Number.isFinite(profile.height) ||
      profile.zones.some(zone => !Object.hasOwn(roomCategories, zone.room) || !/^[MLHVZ\d .-]+$/i.test(zone.path))) {
    throw new Error("도면 설정을 확인해 주세요.");
  }
  planBlob = image;
  planUrl = URL.createObjectURL(image);
  document.getElementById("planTitle").replaceChildren(document.createTextNode(profile.title + " "), make("span", profile.size));
  svg.setAttribute("viewBox", profile.viewBox);
  svg.replaceChildren(element("image", { href: planUrl, width: profile.width, height: profile.height, "aria-hidden": "true" }));
  if (/^[MLHVZ\d .-]+$/i.test(profile.divider ?? "")) svg.append(element("path", { class: "plan-divider", d: profile.divider, "aria-hidden": "true" }));
  planRegions = profile.zones.map(zone => {
    const region = element("a", { class: "plan-zone", href: "#workspace", "data-plan-room": zone.room, "aria-label": zone.room });
    region.append(element("path", { class: "zone-surface", d: zone.path }),
      element("text", { x: Number(zone.x), y: Number(zone.y) }, zone.room));
    svg.append(region);
    return region;
  });
  planRoomList.replaceChildren();
  wirePlan();
}

function resetSession() {
  incomingDraw++;
  sessionHome?.close();
  sessionHome = undefined;
  membership = undefined;
  photoViewer.close();
  document.getElementById("fullPhoto").removeAttribute("src");
  if (planUrl) URL.revokeObjectURL(planUrl);
  planUrl = undefined;
  planBlob = undefined;
  for (const value of privatePhotoUrls.values()) URL.revokeObjectURL(value.url);
  privatePhotoUrls.clear();
  data = { rooms: [], entries: {} };
  photos = {};
  recordList = [];
  photoOrder = [];
  photoDrafts.clear();
  savingPhotos.clear();
  pendingChoices.clear();
  noteDrafts.clear();
  activeCategory = 0;
  activeRoom = defaultRooms[0];
  followCategoryRoom = true;
  planRoom = "";
  referenceRoom = "";
  document.getElementById("planTitle").textContent = "평면도";
  document.getElementById("sharedPlan").replaceChildren();
  document.getElementById("referencePhotoTools").replaceChildren();
  document.getElementById("referencePhotosTitle").textContent = "레퍼런스 사진";
  planRoomList.replaceChildren();
  planRegions = [];
  results.replaceChildren();
  document.getElementById("selectionResults").replaceChildren();
  document.getElementById("printSheet").replaceChildren();
  roomSelect.replaceChildren();
  search.value = "";
  stageFilter.value = "";
  setView(false);
  header.hidden = true;
  main.hidden = true;
  loginPanel.hidden = false;
  activity("");
  status("");
}

function showRecords(rows) {
  recordList = rows;
  const next = { rooms: [], entries: {} };
  for (const row of rows) {
    const [category, item, room, option] = row.record_key;
    if (row.kind === "room") next.rooms.push(category);
    if (row.kind !== "choice" && row.kind !== "note") continue;
    const id = JSON.stringify([category, item, room]);
    const value = next.entries[id] ??= { choices: [], custom: [], note: "", revision: 0 };
    if (row.kind === "note") {
      value.note = row.payload.text;
      value.revision = row.revision;
    } else {
      if (row.payload.selected) value.choices.push(option);
      if (row.payload.custom) value.custom.push(option);
    }
  }
  for (const value of Object.values(next.entries)) {
    value.choices.sort((a, b) => a.localeCompare(b, "ko"));
    value.custom.sort((a, b) => a.localeCompare(b, "ko"));
  }
  next.rooms.sort((a, b) => a.localeCompare(b, "ko"));
  const roomsChanged = JSON.stringify(next.rooms) !== JSON.stringify(data.rooms);
  data = next;
  if (!sessionHome) return;
  if (roomsChanged) renderRooms();
  refreshCards();
  void drawPhotos();
}

function refreshCards() {
  for (const card of results.querySelectorAll(".card")) card.dispatchEvent(new Event("shared-records"));
  updateCounts();
  if (!selectionView.hidden) renderSelection();
}

function activePhotoRows() {
  return recordList.filter(row => row.kind === "photo" && !row.payload.deleted)
    .sort((a, b) => a.payload.created.localeCompare(b.payload.created) || a.record_key[1].localeCompare(b.record_key[1]));
}

async function drawPhotos() {
  const generation = ++incomingDraw;
  const api = sessionHome;
  const rows = activePhotoRows();
  const order = rows.map(row => row.payload.path);
  if (order.length === photoOrder.length && order.every((path, i) => path === photoOrder[i])) return;
  const loaded = await Promise.all(rows.map(async row => {
    const path = row.payload.path;
    const cached = privatePhotoUrls.get(path);
    if (cached) return [row, cached];
    try {
      const blob = await api.download(path);
      if (generation !== incomingDraw || api !== sessionHome) return null;
      const entry = { url: URL.createObjectURL(blob), blob };
      privatePhotoUrls.set(path, entry);
      return [row, entry];
    } catch {
      return null;
    }
  }));
  if (generation !== incomingDraw || api !== sessionHome) return;
  const next = {};
  for (const data of loaded.filter(Boolean)) {
    const [row, image] = data;
    const key = referencePhotoKey(row.record_key[0]);
    (next[key] ??= []).push(image.url);
  }
  photoOrder = loaded.every(Boolean) ? order : [];
  const changed = new Set([...Object.keys(photos), ...Object.keys(next)]);
  photos = next;
  for (const [path, image] of privatePhotoUrls) {
    if (!order.includes(path)) {
      URL.revokeObjectURL(image.url);
      privatePhotoUrls.delete(path);
    }
  }
  if (referenceRoom && changed.has(referencePhotoKey(referenceRoom))) refreshPhotos(referencePhotoKey(referenceRoom));
  else if (!selectionView.hidden) renderSelection();
}

function findPhoto(url) {
  return activePhotoRows().find(row => privatePhotoUrls.get(row.payload.path)?.url === url);
}

async function saveChoice(key, option, selected, custom) {
  const record = [...JSON.parse(key), option];
  const id = JSON.stringify(record);
  if (pendingChoices.has(id)) return false;
  const api = sessionHome;
  pendingChoices.set(id, selected);
  refreshCards();
  try {
    await api.write("choice", record, { selected, custom });
    return true;
  } catch {
    status("선택을 저장하지 못했어요. 연결을 확인하고 다시 선택해 주세요.");
    return false;
  } finally {
    pendingChoices.delete(id);
    refreshCards();
  }
}

async function saveNote(key, overwrite) {
  const draft = noteDrafts.get(key);
  if (!draft || draft.saving) return;
  const revision = overwrite ? data.entries[key]?.revision ?? 0 : draft.revision;
  const api = sessionHome;
  draft.saving = true;
  draft.error = "";
  refreshCards();
  try {
    const saved = await api.write("note", JSON.parse(key), { text: draft.text }, revision);
    const current = noteDrafts.get(key);
    if (current?.text === draft.text) noteDrafts.delete(key);
    else if (current) noteDrafts.set(key, { text: current.text, revision: saved.revision });
  } catch (error) {
    const current = noteDrafts.get(key);
    if (current) {
      current.saving = false;
      current.error = "저장하지 못했어요. 입력 내용은 이 화면에 남아 있어요.";
    }
    if (error.message === "note_conflict") await api.sync()?.catch(() => {});
  } finally {
    refreshCards();
  }
}

async function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function exportChecklist() {
  if (!sessionHome) return;
  const api = sessionHome;
  const action = document.getElementById("exportHtml");
  action.disabled = true;
  try {
    activity("사진이 포함된 HTML을 만드는 중…");
    const output = {};
    for (const photo of activePhotoRows()) {
      const blob = privatePhotoUrls.get(photo.payload.path)?.blob ?? await api.download(photo.payload.path);
      (output[referencePhotoKey(photo.record_key[0])] ??= []).push(await fileToDataUrl(blob));
    }
    const visible = document.createElement("div");
    visible.append(make("h1", document.getElementById("planTitle").textContent));
    const image = make("img");
    image.src = await fileToDataUrl(planBlob);
    image.alt = "평면도";
    image.className = "backup-plan";
    const rooms = new Map(chosenRooms().map(room => [room.room, room]));
    for (const [key, images] of Object.entries(output)) {
      const room = JSON.parse(key)[1];
      rooms.set(room, { room, groups: rooms.get(room)?.groups ?? [], images });
    }
    visible.append(image, make("p", "공유 체크리스트 백업"), summaryFragment([...rooms.values()]));
    const profile = membership.profile;
    const snapshot = JSON.stringify({ data, photos: output, profile }).replaceAll("<", "\\u003c");
    const styles = "body{font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:18px;color:#1c322a} .backup-plan{width:100%;max-width:700px} .photo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.photo-grid img{width:100%;aspect-ratio:1;object-fit:cover}.memo{display:block;white-space:pre-wrap}";
    if (sessionHome !== api) return;
    downloadFile('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>체크리스트 백업</title><style>' +
      styles + '</style><body>' + visible.outerHTML + '<script id="embeddedState" type="application/json">' +
      snapshot + '</script></body></html>', "text/html;charset=utf-8", "우리집-인테리어-체크리스트-백업.html");
    status("사진 포함 HTML을 저장했어요.");
  } catch {
    status("백업을 저장하지 못했어요. 연결을 확인하고 다시 시도하세요.");
  } finally {
    action.disabled = false;
    activity("");
  }
}

async function importChecklist(file) {
  if (!file || !sessionHome || !membership?.isOwner) return;
  const api = sessionHome;
  importButton.disabled = true;
  try {
    if (file.size > 70 * 1024 * 1024) throw new Error("가져올 HTML 파일이 너무 큽니다.");
    const state = parseBackup(await file.text());
    const normalizeRoom = room => existingRoomNames[room] ?? room;
    const roomNames = new Set(defaultRooms);
    for (const name of state.data.rooms) {
      if (typeof name !== "string" || !name.trim() || name.length > 40) throw new Error("공간 이름을 확인해 주세요.");
      roomNames.add(normalizeRoom(name));
    }
    const entries = Object.entries(state.data.entries).map(([key, value]) => {
      const [category, item, room] = JSON.parse(key);
      const target = catalog.find(group => group.name === category)?.items.find(candidate => candidate.name === item);
      if (!target || !roomNames.has(normalizeRoom(room)) || !Array.isArray(value?.choices) ||
        !Array.isArray(value?.custom) || typeof value.note !== "string" || value.note.length > 3000 ||
        [...value.custom, ...value.choices].some(choice => typeof choice !== "string" || !choice.trim() || choice.length > 100)) {
        throw new Error("백업에 인식할 수 없는 항목이 있어요.");
      }
      return { key: [category, item, normalizeRoom(room)], value };
    });
    const albums = new Map();
    for (const [key, files] of Object.entries(state.photos)) {
      const parts = JSON.parse(key);
      const room = normalizeRoom(parts.length === 2 && parts[0] === "reference" ? parts[1] : parts[2]);
      if (!roomNames.has(room) || !Array.isArray(files)) throw new Error("백업의 사진 공간을 확인해 주세요.");
      for (const source of files) {
        const images = albums.get(room) ?? [];
        images.push({ source, blob: dataUrlBlob(source) });
        albums.set(room, images);
      }
    }
    activity("기존 체크·메모를 가져오는 중…");
    for (const room of roomNames) if (!defaultRooms.includes(room)) await api.write("room", [room], {}, null, true);
    for (const { key, value } of entries) {
      for (const option of new Set([...value.choices, ...value.custom])) {
        await api.write("choice", [...key, option], { selected: value.choices.includes(option), custom: value.custom.includes(option) }, null, true);
      }
      if (value.note.trim()) await api.write("note", key, { text: value.note }, 0, true);
    }
    let count = 0;
    const total = [...albums.values()].reduce((sum, images) => sum + images.length, 0);
    const start = new Date("2000-01-01T00:00:00Z").getTime();
    for (const [room, images] of albums) {
      const occurrences = new Map();
      for (const [index, image] of images.entries()) {
        const occurrence = occurrences.get(image.source) ?? 0;
        occurrences.set(image.source, occurrence + 1);
        const id = await importedPhotoId(room, image.source, occurrence);
        activity("기존 사진을 가져오는 중 · " + (count + 1) + "/" + total);
        await api.addPhoto(room, image.blob, id, new Date(start + index).toISOString());
        count++;
      }
    }
    status("기존 기록 가져오기 완료 · 사진 " + count + "장 확인");
  } catch (error) {
    status(error.message?.startsWith("백업") || error.message?.startsWith("지원")
      ? error.message : "가져오기를 끝내지 못했어요. 같은 백업을 다시 선택하면 저장된 항목은 유지됩니다.");
  } finally {
    importButton.disabled = false;
    importFile.value = "";
    activity("");
  }
}

async function boot() {
  const submit = loginForm.querySelector("button");
  async function handleSession(user, client) {
    const generation = ++connectionId;
    resetSession();
    signedInUser = user;
    loginSignOut.hidden = !user;
    loginRetry.hidden = true;
    submit.disabled = Boolean(user);
    loginStatus.textContent = user ? "공유 프로젝트를 확인하고 있어요." : "등록된 이메일과 비밀번호로 로그인하세요.";
    if (!user) return;
    let bufferedRows = [];
    try {
      const receive = rows => {
        if (generation !== connectionId) return;
        if (sessionHome) showRecords(rows);
        else bufferedRows = rows;
      };
      const connectionStatus = message => { if (generation === connectionId) status(message); };
      const accessLost = () => {
        if (generation !== connectionId) return;
        ++connectionId;
        resetSession();
        loginStatus.textContent = "공유 프로젝트에 접근할 수 없어요.";
      };
      let opened;
      for (let attempt = 0; generation === connectionId; attempt++) {
        try {
          opened = await openHome(client, user, receive, connectionStatus, accessLost);
          break;
        } catch (error) {
          if (error.code === "home_access_denied" || attempt >= 2) throw error;
          loginStatus.textContent = "잠시 연결이 늦어져 공유 프로젝트에 다시 접속하고 있어요.";
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
      if (!opened) return;
      if (generation !== connectionId) {
        opened.api.close();
        return;
      }
      membership = opened;
      sessionHome = opened.api;
      renderPrivatePlan(opened.profile, opened.plan);
      showRecords(bufferedRows);
      renderRooms();
      renderCatalog();
      updateCounts();
      importButton.hidden = !opened.isOwner;
      document.getElementById("saveStatus").textContent = "저장한 변경은 두 계정에 공유됩니다.";
      loginPanel.hidden = true;
      header.hidden = false;
      main.hidden = false;
    } catch (error) {
      if (generation !== connectionId) return;
      resetSession();
      loginSignOut.hidden = false;
      loginRetry.hidden = false;
      loginStatus.textContent = error.code === "home_access_denied"
        ? "이 계정에 연결된 체크리스트가 없어요. 등록된 계정인지 확인하세요."
        : "공유 서버에 일시적으로 연결할 수 없어요. 연결을 확인하고 다시 시도하세요.";
    }
  }
  loginRetry.addEventListener("click", () => { if (signedInUser && loginClient) void handleSession(signedInUser, loginClient); });
  try {
    loginClient = await createSession(handleSession);
    if (!loginClient) {
      loginStatus.textContent = "공유 서버 연결을 준비 중입니다.";
      return;
    }
  } catch {
    loginStatus.textContent = "로그인 연결을 시작하지 못했습니다.";
    return;
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const fields = new FormData(loginForm);
    submit.disabled = true;
    loginStatus.textContent = "로그인 중…";
    try {
      const { error } = await loginClient.auth.signInWithPassword({ email: fields.get("email").trim(), password: fields.get("password") });
      if (error) throw error;
      loginForm.reset();
    } catch {
      loginStatus.textContent = "로그인하지 못했어요. 이메일과 비밀번호를 확인하세요.";
      submit.disabled = false;
    }
  });
  async function logout() {
    try {
      const { error } = await loginClient.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      if (sessionHome) status("로그아웃을 완료하지 못했어요. 다시 시도해 주세요.");
      else loginStatus.textContent = "로그아웃을 완료하지 못했어요.";
    }
  }
  loginSignOut.addEventListener("click", logout);
  document.getElementById("signOut").addEventListener("click", logout);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => importChecklist(importFile.files[0]));
}

boot();
