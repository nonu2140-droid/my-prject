const FALLBACK_ARTICLES = [
  { id: "fallback-1", category:"金融", title:"日銀が政策金利の見通しを見直す理由", summary:"物価上昇が続く中、日銀の金融政策正常化に注目が集まっています。政策金利は住宅ローンや企業の借入コスト、円相場にも影響します。", source:"日本銀行", url:"https://www.boj.or.jp/", published:"基礎記事", image:"https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80" },
  { id: "fallback-2", category:"経済", title:"名目GDPと実質GDPの違い", summary:"名目GDPは当時の物価で、実質GDPは基準年の物価で生産量を比較します。日経TESTではこの違いが頻出です。", source:"内閣府", url:"https://www.esri.cao.go.jp/", published:"基礎記事", image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80" },
  { id: "fallback-3", category:"政治", title:"政府の経済政策と財政負担の論点", summary:"政府の成長戦略では、歳出、税制、賃上げ支援の効果と財源が主要な論点になります。", source:"首相官邸", url:"https://www.kantei.go.jp/", published:"基礎記事", image:"https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&w=900&q=80" },
  { id: "fallback-4", category:"国際", title:"ドルと円の為替変動が企業収益に与える影響", summary:"円安は輸出企業にプラスになりやすい一方、輸入コストを押し上げます。業種ごとの影響が重要です。", source:"財務省", url:"https://www.mof.go.jp/", published:"基礎記事", image:"https://images.unsplash.com/photo-1520930813514-7a89d8c1ec46?auto=format&fit=crop&w=900&q=80" },
  { id: "fallback-5", category:"社会", title:"少子高齢化が社会保障費に与える影響", summary:"現役世代の縮小は年金、医療、介護の制度改革と、将来の保険料負担を巡る議論につながります。", source:"厚生労働省", url:"https://www.mhlw.go.jp/", published:"基礎記事", image:"https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?auto=format&fit=crop&w=900&q=80" }
];

const QUIZZES = [
  { question:"政策金利を引き上げた場合、一般的に企業に起こりやすい影響はどれですか。", options:["借入コストが上がりやすい","借入コストが必ずゼロになる","為替が必ず円安になる"], answer:0, explanation:"政策金利の上昇は市場金利の上昇につながり、企業の借入コストを押し上げやすいです。" },
  { question:"物価変動の影響を除いて経済規模を比較する指標はどれですか。", options:["名目GDP","実質GDP","消費税率"], answer:1, explanation:"実質GDPは基準年の物価で計算し、物価変動の影響を調整します。" },
  { question:"円安が進むと輸出企業の円換算収益は一般にどうなりやすいですか。", options:["増えやすい","必ずゼロになる","輸入コストが必ず減る"], answer:0, explanation:"円安ではドル建て売上を円換算した額が増えやすい一方、輸入コストも上がりやすいです。" }
];

const RSS_FEEDS = [
  { name:"NHK", category:"社会", url:"https://www3.nhk.or.jp/rss/news/cat0.xml" },
  { name:"Yahoo!ニュース", category:"経済", url:"https://news.yahoo.co.jp/rss/topics/top-picks.xml" },
  { name:"Google News 経済", category:"経済", url:"https://news.google.com/rss/search?q=日本+経済+金融+when:2d&hl=ja&gl=JP&ceid=JP:ja" },
  { name:"Google News 政治", category:"政治", url:"https://news.google.com/rss/search?q=日本+政府+政治+政策+when:2d&hl=ja&gl=JP&ceid=JP:ja" },
  { name:"Google News 国際", category:"国際", url:"https://news.google.com/rss/search?q=国際+世界+日本+when:2d&hl=ja&gl=JP&ceid=JP:ja" },
];

const state = JSON.parse(localStorage.getItem("nikkei-daily-state") || "{}");
state.read = state.read || [];
state.saved = state.saved || [];
state.progress = state.progress || {};

let articles = [...FALLBACK_ARTICLES];
let activeCategory = "すべて";
let quizIndex = 0;
let quizAnswered = false;

const $ = (selector) => document.querySelector(selector);
const grid = $("#articleGrid");

function saveState() { localStorage.setItem("nikkei-daily-state", JSON.stringify(state)); }
function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value || "";
  return element.innerHTML;
}
function cleanText(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}
function classify(title, description) {
  const text = `${title} ${description}`;
  if (/スポーツ|野球|サッカー|ゴルフ|テニス|競馬|競輪|オリンピック|Jリーグ|プロ野球|芸能|エンタメ|アイドル|俳優|女優|映画|ドラマ|音楽|コンサート|天気|気象|台風|地震|津波|動物|ペット|旅行|グルメ|レシピ/.test(text)) {
    return null;
  }
  if (/日銀|金融|金利|為替|円安|円高|株価|インフレ/.test(text)) return "金融";
  if (/首相|政府|政権|国会|税制|予算|選挙/.test(text)) return "政治";
  if (/海外|米国|中国|欧州|世界|輸出|貿易|為替/.test(text)) return "国際";
  if (/少子|高齢|社会保障|教育|雇用|労働|医療|介護/.test(text)) return "社会";
  return "経済";
}

function categoryImage(category) {
  const images = {
    "金融": "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
    "経済": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
    "政治": "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&w=900&q=80",
    "国際": "https://images.unsplash.com/photo-1520930813514-7a89d8c1ec46?auto=format&fit=crop&w=900&q=80",
    "社会": "https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?auto=format&fit=crop&w=900&q=80"
  };
  return images[category] || images["経済"];
}

function extractThumbnail(item) {
  if (item.thumbnail) return item.thumbnail;
  if (item.enclosure && item.enclosure.link) return item.enclosure.link;
  const match = (item.description || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

async function loadLiveNews() {
  const status = $("#newsStatus");
  status.innerHTML = '<span class="live-dot"></span><span>最新ニュースを取得中...</span>';
  const cache = JSON.parse(localStorage.getItem("nikkei-daily-news-cache") || "null");
  if (cache && Date.now() - cache.updatedAt < 30 * 60 * 1000 && Array.isArray(cache.articles) && cache.articles.length) {
    const cachedRelevant = cache.articles.filter((item) => classify(item.title, item.summary));
    articles = [...new Map([...cachedRelevant, ...FALLBACK_ARTICLES].map((item) => [item.title, item])).values()];
    if (!articles.length) articles = [...FALLBACK_ARTICLES];
    status.innerHTML = '<span class="live-dot"></span><span>保存された試験関連ニュースを表示中（最大30分更新）</span>';
    renderArticles();
    return;
  }
  const collected = [];
  const requests = RSS_FEEDS.map(async (feed) => {
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=12`;
      const response = await fetch(proxyUrl);
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data.items)) return [];
      return data.items.map((item) => {
        const title = item.title || "";
        const description = cleanText(item.description).slice(0, 420);
        const category = classify(title, description);
        if (!category) return null;
        const date = item.pubDate ? new Date(item.pubDate) : new Date();
        return {
          id: item.link,
          category,
          title,
          summary: description || "ニュースの要点を確認し、公式記事で詳細を確認しましょう。",
          source: feed.name,
          url: item.link,
          published: date.toLocaleString("ja-JP", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }),
          publishedAt: date.getTime(),
          image: extractThumbnail(item) || categoryImage(category)
        };
      });
    } catch (error) {
      console.warn("RSS取得エラー", feed.name, error);
      return [];
    }
  });
  const groups = await Promise.all(requests);
  for (const group of groups) {
    collected.push(...group.filter(Boolean));
  }

  const unique = [...new Map(collected.map((item) => [item.id, item])).values()];
  if (unique.length) {
    const liveArticles = unique.sort((a, b) => b.publishedAt - a.publishedAt);
    const withFallback = [...liveArticles, ...FALLBACK_ARTICLES];
    articles = [...new Map(withFallback.map((item) => [item.title, item])).values()].slice(0, 30);
    localStorage.setItem("nikkei-daily-news-cache", JSON.stringify({ updatedAt: Date.now(), articles }));
    status.innerHTML = '<span class="live-dot"></span><span>複数のニュースソースから試験関連ニュースを集約しました</span>';
  } else {
    status.innerHTML = '<span class="live-dot"></span><span>ネットワーク制限のため基礎記事を表示中</span>';
  }
  renderArticles();
  updateGoal();
}

function renderFilters() {
  const categories = ["すべて", "金融", "経済", "政治", "国際", "社会"];
  $("#categoryFilters").innerHTML = categories.map((category) =>
    `<button class="filter ${category === activeCategory ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
  ).join("");
}

function renderArticles(containerId = "articleGrid", onlySaved = false) {
  const target = document.getElementById(containerId);
  let list = onlySaved ? articles.filter((article) => state.saved.includes(article.id)) : articles;
  if (!onlySaved && activeCategory !== "すべて") list = list.filter((article) => article.category === activeCategory);
  if (!list.length) {
    target.innerHTML = '<div class="empty-state">保存した記事はまだありません。</div>';
    return;
  }
  target.innerHTML = list.map((article, index) => `
    <article class="article-card ${containerId === "articleGrid" && index === 0 && activeCategory === "すべて" ? "featured" : ""}" data-id="${escapeHtml(article.id)}">
      <button class="save-button ${state.saved.includes(article.id) ? "saved" : ""}" type="button" data-save="${escapeHtml(article.id)}" aria-label="記事を保存">${state.saved.includes(article.id) ? "♥" : "♡"}</button>
      <div class="article-image ${containerId === "articleGrid" && index === 0 && activeCategory === "すべて" ? "featured-image" : ""}">
        <img src="${escapeHtml(article.image || categoryImage(article.category))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">
      </div>
      <span class="category">${escapeHtml(article.category)}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <div class="card-meta"><span>${escapeHtml(article.source)}</span><span>・</span><span>${escapeHtml(article.published)}</span></div>
    </article>
  `).join("");
}

async function loadArticleDetail(article) {
  const loading = document.getElementById("detailLoading");
  const container = document.getElementById("detailExtract");
  if (!loading || !container) return;

  if (article.detail) {
    loading.hidden = true;
    container.hidden = false;
    container.innerHTML = article.detail.map((text) => `<p>${escapeHtml(text)}</p>`).join("");
    return;
  }

  if (!/^https?:\/\//.test(article.url)) {
    loading.textContent = "元記事の本文を取得できないため、RSS要約と分野別ポイントを表示しています。";
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(`https://r.jina.ai/${article.url}`, {
      signal: controller.signal,
      headers: { "Accept": "text/plain" }
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`detail status ${response.status}`);

    const markdown = await response.text();
    const candidates = markdown
      .split(/\n+/)
      .map((line) => line
        .replace(/^#{1,6}\s*/, "")
        .replace(/\[[^\]]+\]\([^)]+\)/g, "")
        .replace(/[*_`>#]/g, "")
        .replace(/\s+/g, " ")
        .trim())
      .filter((line) =>
        line.length >= 28 &&
        line.length <= 220 &&
        !/^(title|url|source|published|image|contents?)/i.test(line)
      );

    const details = [];
    for (const line of candidates) {
      if (details.some((text) => text === line || line.startsWith(text.slice(0, 25)))) continue;
      details.push(line);
      if (details.join(" ").length >= 650 || details.length >= 4) break;
    }

    if (!details.length) throw new Error("no article details");
    article.detail = details;
    loading.hidden = true;
    container.hidden = false;
    container.innerHTML = details.map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  } catch (error) {
    loading.textContent = "本文の取得が制限されています。下の要約・分野別ポイント・元記事リンクで確認できます。";
  }
}

function openArticle(id) {
  const article = articles.find((item) => item.id === id);
  if (!article) return;
  const detailSets = {
    "金融": ["政策金利・市場金利・貸出金利の関係", "物価・為替・株価への伝播経路", "企業の資金調達と家計の住宅ローンへの影響"],
    "経済": ["名目・実質、成長率・物価の区別", "企業収益・賃金・消費への影響", "政府・日銀の政策との関係"],
    "政治": ["政策の目的と対象となる制度", "財源・実施時期・国会審議の論点", "家計・企業・地方自治体への影響"],
    "国際": ["日本と相手国の経済的な関係", "為替・輸出入・資源価格への影響", "国際条約・安全保障との接点"],
    "社会": ["制度の対象者と現状の課題", "税・保険料・財政負担の関係", "労働市場・地域社会への影響"]
  };
  const points = detailSets[article.category] || detailSets["経済"];
  const related = articles
    .filter((item) => item.id !== article.id && item.category === article.category)
    .slice(0, 3);
  $("#modalContent").innerHTML = `
    <span class="category">${escapeHtml(article.category)}</span>
    <h2 id="modalTitle">${escapeHtml(article.title)}</h2>
    ${article.image ? `<img class="modal-news-image" src="${escapeHtml(article.image)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
    <p class="article-summary">${escapeHtml(article.summary)}</p>
    <h3>記事の詳細ポイント</h3>
    <div class="detail-loading" id="detailLoading">複数ソースの記事内容を短く確認しています...</div>
    <div class="detail-extract" id="detailExtract" hidden></div>
    <h3>なぜ起きたのか・何が変わるのか</h3>
    <ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
    <h3>日経TESTで確認するポイント</h3>
    <p>①事実 ②影響を受ける主体 ③制度や指標 ④今後の展望、の4点に分けて元記事を読みましょう。</p>
    ${related.length ? `<h3>関連する同分野ニュース</h3><div class="related-links">${related.map((item) => `<button type="button" data-related-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}<small>${escapeHtml(item.source)}・${escapeHtml(item.published)}</small></button>`).join("")}</div>` : ""}
    <div class="modal-meta"><strong>情報元：</strong>${escapeHtml(article.source)} ／ ${escapeHtml(article.published)}</div>
    <a class="source-link-card" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">元記事を別タブで読む →</a>
  `;
  $("#articleModal").hidden = false;
  loadArticleDetail(article);
  if (!state.read.includes(id)) {
    state.read.push(id);
    state.progress[article.category] = Math.min(100, (state.progress[article.category] || 0) + 10);
    saveState();
    updateGoal();
  }
}

function updateGoal() {
  const count = state.read.length;
  const percent = Math.min(100, Math.round(count / 5 * 100));
  $("#goalPercent").textContent = `${percent}%`;
  $("#remainingCount").textContent = Math.max(0, 5 - count);
  $("#goalText").textContent = count >= 5 ? "今日の目標達成" : `あと${5 - count}記事読みましょう`;
}

function renderProgress() {
  $("#progressGrid").innerHTML = ["金融","経済","政治","国際","社会"].map((category) => {
    const value = state.progress[category] || 0;
    return `<div class="progress-card"><div class="progress-card-header"><strong>${category}</strong><span>${value}%</span></div><div class="progress-track"><div style="width:${value}%"></div></div></div>`;
  }).join("");
}

function renderQuiz() {
  quizAnswered = false;
  const quiz = QUIZZES[quizIndex];
  $("#quizCard").innerHTML = `
    <div class="quiz-top"><span>確認クイズ</span><span>${quizIndex + 1} / ${QUIZZES.length}</span></div>
    <h2>${escapeHtml(quiz.question)}</h2>
    <div class="quiz-options">${quiz.options.map((option,index) => `<button class="quiz-option" type="button" data-answer="${index}"><span class="option-key">${["A","B","C"][index]}</span><span>${escapeHtml(option)}</span></button>`).join("")}</div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    <button class="quiz-next" id="quizNext" type="button">${quizIndex === QUIZZES.length - 1 ? "最初に戻る" : "次の問題へ"}</button>
  `;
}

function answerQuiz(index) {
  if (quizAnswered) return;
  quizAnswered = true;
  const quiz = QUIZZES[quizIndex];
  const correct = index === quiz.answer;
  document.querySelectorAll(".quiz-option").forEach((button) => {
    button.disabled = true;
    const answer = Number(button.dataset.answer);
    if (answer === quiz.answer) button.classList.add("correct");
    if (answer === index && !correct) button.classList.add("wrong");
  });
  $("#quizFeedback").textContent = `${correct ? "正解です。" : "不正解です。"} ${quiz.explanation}`;
  $("#quizFeedback").classList.add("show");
  $("#quizNext").classList.add("show");
}

function switchView(view) {
  document.querySelectorAll(".view").forEach((element) => element.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((element) => element.classList.remove("active"));
  const names = { today:["todayView","今日のニュース"], quiz:["quizView","クイズ"], progress:["progressView","学習状況"], saved:["savedView","保存した記事"] };
  $("#" + names[view][0]).classList.add("active");
  $(`[data-view="${view}"]`).classList.add("active");
  $("#pageTitle").textContent = names[view][1];
  if (view === "progress") renderProgress();
  if (view === "saved") renderArticles("savedGrid", true);
  if (view === "quiz") renderQuiz();
}

$("#categoryFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderFilters();
  renderArticles();
});
grid.addEventListener("click", (event) => {
  const save = event.target.closest("[data-save]");
  if (save) {
    event.stopPropagation();
    const id = save.dataset.save;
    state.saved = state.saved.includes(id) ? state.saved.filter((savedId) => savedId !== id) : [...state.saved, id];
    saveState();
    renderArticles();
    return;
  }
  const card = event.target.closest("[data-id]");
  if (card) openArticle(card.dataset.id);
});
$("#savedGrid").addEventListener("click", (event) => {
  const save = event.target.closest("[data-save]");
  if (save) {
    const id = save.dataset.save;
    state.saved = state.saved.filter((savedId) => savedId !== id);
    saveState();
    renderArticles("savedGrid", true);
    return;
  }
  const card = event.target.closest("[data-id]");
  if (card) openArticle(card.dataset.id);
});
$(".nav").addEventListener("click", (event) => {
  const item = event.target.closest("[data-view]");
  if (item) switchView(item.dataset.view);
});
$("#modalClose").addEventListener("click", () => $("#articleModal").hidden = true);
$("#articleModal").addEventListener("click", (event) => {
  const related = event.target.closest("[data-related-id]");
  if (related) {
    openArticle(related.dataset.relatedId);
    return;
  }
  if (event.target === event.currentTarget) event.currentTarget.hidden = true;
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") $("#articleModal").hidden = true; });
$("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("nikkei-daily-theme", document.body.classList.contains("dark") ? "dark" : "light");
});
$("#refreshButton").addEventListener("click", () => {
  localStorage.removeItem("nikkei-daily-news-cache");
  articles = [...FALLBACK_ARTICLES];
  renderArticles();
  loadLiveNews();
});
$("#quizCard").addEventListener("click", (event) => {
  const option = event.target.closest("[data-answer]");
  if (option) answerQuiz(Number(option.dataset.answer));
  if (event.target.closest("#quizNext")) {
    quizIndex = (quizIndex + 1) % QUIZZES.length;
    renderQuiz();
  }
});
$(".brand").addEventListener("click", () => switchView("today"));

if (localStorage.getItem("nikkei-daily-theme") === "dark") document.body.classList.add("dark");
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker登録エラー", error));
  });
}
const now = new Date();
$("#todayLabel").textContent = `${now.getMonth()+1}月${now.getDate()}日（${["日","月","火","水","木","金","土"][now.getDay()]}）`;
renderFilters();
renderArticles();
renderProgress();
renderQuiz();
updateGoal();
loadLiveNews();
