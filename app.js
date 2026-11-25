const FAVORITES_KEY = "cantus-favoritos";
const FONT_SIZE_KEY = "cantus-tamanho-letra";
const THEME_KEY = "cantus-tema";
const DATA_URL = "data/hinario.json";
const THEMES = ["claro", "escuro", "alto-contraste"];
const THEME_LABELS = {
  claro: "Claro",
  escuro: "Escuro",
  "alto-contraste": "Alto contraste",
};
const DEFAULT_FONT_SIZE = 20;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 30;
const FONT_SIZE_STEP = 2;

const elements = {
  tabs: [...document.querySelectorAll(".tab")],
  library: document.querySelector("#library-view"),
  reader: document.querySelector("#reader-view"),
  search: document.querySelector("#search"),
  subject: document.querySelector("#subject"),
  clearSubject: document.querySelector("#clear-subject"),
  results: document.querySelector("#results"),
  resultsTitle: document.querySelector("#results-title"),
  resultsCount: document.querySelector("#results-count"),
  status: document.querySelector("#status"),
  readerNumber: document.querySelector("#reader-number"),
  readerTitle: document.querySelector("#reader-title"),
  readerKey: document.querySelector("#reader-key"),
  readerFavorite: document.querySelector("#reader-favorite"),
  lyrics: document.querySelector("#lyrics"),
  metadata: document.querySelector("#song-metadata"),
  fontDecrease: document.querySelector("#font-decrease"),
  fontIncrease: document.querySelector("#font-increase"),
  fontSize: document.querySelector("#font-size"),
  themeToggles: [...document.querySelectorAll("[data-theme-toggle]")],
};

let songs = [];
let favoriteNumbers = new Set();
let activeSection = "todos";
let currentSong = null;
let fontSize = DEFAULT_FONT_SIZE;
let currentTheme = "claro";

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("is-error", isError);
}

function updateTheme(theme) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const icons = {
    claro: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
    escuro: '<svg viewBox="0 0 24 24"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>',
    "alto-contraste": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z"/></svg>',
  };
  for (const button of elements.themeToggles) {
    button.querySelector(".theme-icon").innerHTML = icons[theme];
    button.querySelector(".theme-label").textContent = THEME_LABELS[theme];
    button.setAttribute("aria-label", `Tema atual: ${THEME_LABELS[theme]}. Toque para alternar para ${THEME_LABELS[nextTheme]}.`);
    button.title = `Alternar para ${THEME_LABELS[nextTheme]}`;
  }
  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor.content = theme === "escuro" ? "#0f172a" : theme === "alto-contraste" ? "#000000" : "#f6f7f5";
}

function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === null) return "claro";
    if (THEMES.includes(stored)) return stored;
    setStatus("O tema salvo não é reconhecido. O modo Claro foi aplicado.", true);
  } catch {
    setStatus("O navegador não permitiu ler a preferência de tema.", true);
  }
  return "claro";
}

function setTheme(theme, persist = false) {
  updateTheme(theme);
  if (!persist) return;
  try {
    localStorage.setItem(THEME_KEY, theme);
    setStatus("");
  } catch {
    setStatus("O tema foi aplicado, mas não foi possível salvar essa preferência.", true);
  }
}

function cycleTheme() {
  const nextTheme = THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length];
  setTheme(nextTheme, true);
}

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(stored) || stored.some((number) => !Number.isInteger(number))) {
      throw new TypeError("Formato de favoritos inválido.");
    }
    return new Set(stored);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      setStatus("Não foi possível ler os favoritos salvos. A lista foi iniciada vazia.", true);
    } else {
      setStatus("O navegador não permitiu acessar os favoritos salvos.", true);
    }
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteNumbers]));
    setStatus("");
    return true;
  } catch {
    setStatus("Não foi possível salvar favoritos neste navegador.", true);
    return false;
  }
}

function readFontSize() {
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored === null) return DEFAULT_FONT_SIZE;
    const value = Number(stored);
    if (!Number.isInteger(value) || value < MIN_FONT_SIZE || value > MAX_FONT_SIZE) {
      throw new TypeError("Tamanho de letra salvo inválido.");
    }
    return value;
  } catch (error) {
    if (error instanceof TypeError) {
      setStatus("A preferência de tamanho da letra não é válida. O tamanho padrão foi aplicado.", true);
    } else {
      setStatus("O navegador não permitiu acessar a preferência de tamanho da letra.", true);
    }
    return DEFAULT_FONT_SIZE;
  }
}

function saveFontSize() {
  try {
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
    setStatus("");
  } catch {
    setStatus("Não foi possível salvar o tamanho da letra neste navegador.", true);
  }
}

function updateFontControls() {
  elements.lyrics.style.setProperty("--lyric-font-size", `${fontSize}px`);
  elements.fontSize.value = `${fontSize}px`;
  elements.fontDecrease.disabled = fontSize <= MIN_FONT_SIZE;
  elements.fontIncrease.disabled = fontSize >= MAX_FONT_SIZE;
}

function changeFontSize(amount) {
  fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize + amount));
  updateFontControls();
  saveFontSize();
}

function toggleFavorite(song) {
  if (favoriteNumbers.has(song.numero)) favoriteNumbers.delete(song.numero);
  else favoriteNumbers.add(song.numero);
  saveFavorites();
  renderSongs();
  if (currentSong?.numero === song.numero) syncReaderFavorite(song);
}

function syncReaderFavorite(song) {
  const isFavorite = favoriteNumbers.has(song.numero);
  elements.readerFavorite.classList.toggle("is-favorite", isFavorite);
  elements.readerFavorite.setAttribute("aria-label", `${isFavorite ? "Remover" : "Adicionar"} ${song.titulo} ${isFavorite ? "dos" : "aos"} favoritos`);
  elements.readerFavorite.setAttribute("aria-pressed", String(isFavorite));
}

function addMetadataRow(label, value) {
  if (!value) return;
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  elements.metadata.append(term, description);
}

function renderMetadata(song) {
  elements.metadata.replaceChildren();
  const authorName = song.autor?.trim();
  const hasYear = song.ano !== null && song.ano !== undefined && song.ano !== "";
  let author = authorName || "";
  if (authorName && hasYear) author = `${authorName} (${song.ano})`;
  else if (!authorName && hasYear) author = String(song.ano);
  addMetadataRow("Autor", author);
  addMetadataRow("Título original", song.titulo_original);
  addMetadataRow("Referência bíblica", song.referencia_biblica);

  const otherHymnals = (song.outros_hinarios || [])
    .map(({ sigla, numero }) => [sigla, numero].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" · ");
  addMetadataRow("Outros hinários", otherHymnals);

  const subjects = (song.assuntos || [])
    .map(({ grupo, subgrupo }) => [grupo, subgrupo].filter(Boolean).join(" / "))
    .filter(Boolean)
    .join(" · ");
  addMetadataRow("Assuntos", subjects);
  elements.metadata.hidden = elements.metadata.childElementCount === 0;
}

function renderLyrics(song) {
  const fragment = document.createDocumentFragment();
  for (const block of song.blocos || []) {
    const section = document.createElement("section");
    const isRefrain = block.tipo === "refrao";
    section.className = `lyric-block${isRefrain ? " is-refrain" : ""}`;
    if (isRefrain) {
      const label = document.createElement("h2");
      label.className = "refrain-label";
      label.textContent = "Refrão";
      section.append(label);
    }
    for (const line of block.linhas || []) {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      section.append(paragraph);
    }
    fragment.append(section);
  }
  elements.lyrics.replaceChildren(fragment);
}

function showSong(song) {
  currentSong = song;
  elements.library.hidden = true;
  elements.reader.hidden = false;
  elements.readerNumber.textContent = String(song.numero).padStart(3, "0");
  elements.readerTitle.textContent = song.titulo;
  elements.readerKey.textContent = `Tom: ${song.tom || "—"}`;
  syncReaderFavorite(song);
  renderLyrics(song);
  renderMetadata(song);
  updateFontControls();
  window.scrollTo(0, 0);
}

function showLibrary() {
  currentSong = null;
  elements.reader.hidden = true;
  elements.library.hidden = false;
  renderSongs();
}

function addSubjectOptions() {
  const groups = new Map();
  for (const { grupo, subgrupo } of window.cantusData.assuntos) {
    if (!groups.has(grupo)) groups.set(grupo, new Set());
    groups.get(grupo).add(subgrupo);
  }

  for (const [group, subgroups] of groups) {
    const groupOption = document.createElement("option");
    groupOption.value = JSON.stringify({ grupo: group });
    groupOption.textContent = group;
    elements.subject.append(groupOption);

    const optionGroup = document.createElement("optgroup");
    optionGroup.label = group;
    for (const subgroup of subgroups) {
      const option = document.createElement("option");
      option.value = JSON.stringify({ grupo: group, subgrupo: subgroup });
      option.textContent = `— ${subgroup}`;
      optionGroup.append(option);
    }
    elements.subject.append(optionGroup);
  }

  elements.subject.disabled = false;
}

function matchesSubject(song, selection) {
  if (!selection) return true;
  const subject = JSON.parse(selection);
  return song.assuntos.some((item) =>
    item.grupo === subject.grupo &&
    (!subject.subgrupo || item.subgrupo === subject.subgrupo)
  );
}

function getVisibleSongs() {
  const query = normalize(elements.search.value);
  const subject = elements.subject.value;

  return songs.filter((song) => {
    if (activeSection === "favoritos" && !favoriteNumbers.has(song.numero)) return false;
    if (activeSection !== "todos" && activeSection !== "favoritos" && song.secao !== activeSection) return false;
    if (!matchesSubject(song, subject)) return false;
    if (!query) return true;

    const searchableText = normalize([
      song.numero,
      String(song.numero).padStart(3, "0"),
      song.titulo,
      ...song.blocos.flatMap((block) => block.linhas),
    ].join(" "));
    return searchableText.includes(query);
  }).sort((first, second) =>
    first.titulo.localeCompare(second.titulo, "pt-BR", { sensitivity: "base" })
  );
}

function createFavoriteButton(song) {
  const isFavorite = favoriteNumbers.has(song.numero);
  const button = document.createElement("button");
  button.className = `favorite-button${isFavorite ? " is-favorite" : ""}`;
  button.type = "button";
  button.setAttribute("aria-label", `${isFavorite ? "Remover" : "Adicionar"} ${song.titulo} ${isFavorite ? "dos" : "aos"} favoritos`);
  button.setAttribute("aria-pressed", String(isFavorite));
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.75 5.57 6.15.89-4.45 4.34 1.05 6.13L12 17.04l-5.5 2.89 1.05-6.13L3.1 9.46l6.15-.89L12 3Z"/></svg>';
  button.addEventListener("click", () => toggleFavorite(song));
  return button;
}

function renderSongs() {
  const visibleSongs = getVisibleSongs();
  elements.results.replaceChildren();
  elements.resultsCount.textContent = `${visibleSongs.length} ${visibleSongs.length === 1 ? "música" : "músicas"}`;

  if (visibleSongs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const heading = document.createElement("strong");
    heading.textContent = activeSection === "favoritos" && favoriteNumbers.size === 0
      ? "Seus favoritos aparecem aqui"
      : "Nenhuma música encontrada";
    const copy = document.createElement("p");
    copy.textContent = activeSection === "favoritos" && favoriteNumbers.size === 0
      ? "Toque na estrela de uma música para salvá-la."
      : "Tente mudar a busca ou limpar o filtro de assunto.";
    empty.append(heading, copy);
    elements.results.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const song of visibleSongs) {
    const row = document.createElement("article");
    row.className = "song-row";

    const link = document.createElement("a");
    link.className = "song-main";
    link.href = `#/musica/${song.numero}`;
    link.setAttribute("aria-label", `Abrir ${song.secao === "hino" ? "hino" : "cântico"} ${String(song.numero).padStart(3, "0")}: ${song.titulo}`);

    const details = document.createElement("span");
    details.className = "song-details";
    const title = document.createElement("span");
    title.className = "song-title";
    title.textContent = song.titulo;
    const meta = document.createElement("span");
    meta.className = "song-meta";
    const key = document.createElement("span");
    key.textContent = `Tom ${song.tom || "—"}`;
    meta.append(key);
    details.append(title, meta);
    link.append(details);

    row.append(link, createFavoriteButton(song));
    fragment.append(row);
  }
  elements.results.append(fragment);
}

function updateSection(section) {
  activeSection = section;
  for (const tab of elements.tabs) {
    const isActive = tab.dataset.section === section;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  }
  const titles = {
    todos: "Todas as músicas",
    hino: "Hinos",
    cantico: "Cânticos",
    favoritos: "Favoritos",
  };
  elements.resultsTitle.textContent = titles[section];
  renderSongs();
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => updateSection(tab.dataset.section));
});

elements.search.addEventListener("input", renderSongs);
elements.subject.addEventListener("change", () => {
  elements.clearSubject.hidden = !elements.subject.value;
  renderSongs();
});
elements.clearSubject.addEventListener("click", () => {
  elements.subject.value = "";
  elements.clearSubject.hidden = true;
  renderSongs();
});

elements.readerFavorite.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.75 5.57 6.15.89-4.45 4.34 1.05 6.13L12 17.04l-5.5 2.89 1.05-6.13L3.1 9.46l6.15-.89L12 3Z"/></svg>';
elements.readerFavorite.addEventListener("click", () => {
  if (currentSong) toggleFavorite(currentSong);
});
elements.fontDecrease.addEventListener("click", () => changeFontSize(-FONT_SIZE_STEP));
elements.fontIncrease.addEventListener("click", () => changeFontSize(FONT_SIZE_STEP));
elements.themeToggles.forEach((button) => button.addEventListener("click", cycleTheme));

window.addEventListener("hashchange", () => {
  const match = window.location.hash.match(/^#\/musica\/(\d+)$/);
  const song = match && songs.find((item) => item.numero === Number(match[1]));
  if (!song) {
    showLibrary();
    return;
  }
  setStatus("");
  showSong(song);
  window.dispatchEvent(new CustomEvent("cantus:open-music", { detail: song }));
});

window.addEventListener("storage", (event) => {
  if (event.key === THEME_KEY || event.key === null) {
    const storedTheme = event.key === null ? null : event.newValue;
    const theme = storedTheme === null ? "claro" : storedTheme;
    if (THEMES.includes(theme)) {
      updateTheme(theme);
    } else {
      setStatus("Não foi possível sincronizar o tema salvo em outra aba.", true);
    }
  }
  if (event.key !== FAVORITES_KEY && event.key !== null) return;
  try {
    const stored = JSON.parse(event.newValue || "[]");
    if (!Array.isArray(stored) || stored.some((number) => !Number.isInteger(number))) {
      throw new TypeError("Formato de favoritos inválido.");
    }
    favoriteNumbers = new Set(stored);
    renderSongs();
    if (currentSong) syncReaderFavorite(currentSong);
    setStatus("");
  } catch {
    setStatus("Não foi possível sincronizar os favoritos salvos em outra aba.", true);
  }
});

async function initialize() {
  updateTheme(readTheme());
  favoriteNumbers = readFavorites();
  fontSize = readFontSize();
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Falha ao carregar o hinário (${response.status}).`);
    window.cantusData = await response.json();
    songs = window.cantusData.musicas;
    addSubjectOptions();
    renderSongs();
    window.dispatchEvent(new Event("hashchange"));
  } catch (error) {
    setStatus(error instanceof Error
      ? `${error.message} Confira se o aplicativo está sendo servido por HTTP.`
      : "Não foi possível carregar os dados do hinário.", true);
    elements.results.replaceChildren();
    elements.resultsCount.textContent = "";
  }
}

initialize();
