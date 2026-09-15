
const STORAGE_KEY = 'game-vault-archive';

function loadGames(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function saveGames(games){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

let games = loadGames();


function timeBucket(hour){
  if(hour >= 5 && hour < 12) return 'Morning';
  if(hour >= 12 && hour < 17) return 'Afternoon';
  if(hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function updateGreeting(){
  const now = new Date();
  const hour = now.getHours();
  const bucket = timeBucket(hour);
  document.getElementById('greeting').textContent = `${bucket}, gamers.`;

  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('dateLine').textContent = dateStr;

  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  document.getElementById('clock').textContent = timeStr;
}


function hashString(str){
  let hash = 0;
  for(let i = 0; i < str.length; i++){
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function coverGradient(title){
  const h = hashString(title || 'game');
  const hue1 = h % 360;
  const hue2 = (hue1 + 55) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 65%, 22%), hsl(${hue2}, 70%, 14%))`;
}


function renderStats(){
  const total = games.length;
  document.getElementById('statTotal').textContent = total;

  if(total === 0){
    document.getElementById('statAvg').textContent = '—';
    document.getElementById('statTopName').textContent = 'Nothing logged yet';
    return;
  }

  const avg = games.reduce((sum, g) => sum + g.rating, 0) / total;
  document.getElementById('statAvg').textContent = avg.toFixed(1);

  const top = [...games].sort((a, b) => b.rating - a.rating)[0];
  document.getElementById('statTopName').textContent = top.title;
}


function getFilteredSorted(){
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const sortMode = document.getElementById('sortSelect').value;

  let list = games.filter(g =>
    g.title.toLowerCase().includes(query) ||
    (g.platform || '').toLowerCase().includes(query) ||
    (g.genre || '').toLowerCase().includes(query)
  );

  switch(sortMode){
    case 'ratingHigh': list.sort((a,b) => b.rating - a.rating); break;
    case 'ratingLow': list.sort((a,b) => a.rating - b.rating); break;
    case 'az': list.sort((a,b) => a.title.localeCompare(b.title)); break;
    default: list.sort((a,b) => b.createdAt - a.createdAt);
  }
  return list;
}

function renderGrid(){
  const grid = document.getElementById('gameGrid');
  const emptyState = document.getElementById('emptyState');
  const list = getFilteredSorted();

  grid.innerHTML = '';

  if(games.length === 0){
    emptyState.classList.add('visible');
    grid.style.display = 'none';
  } else {
    emptyState.classList.remove('visible');
    grid.style.display = 'grid';
  }

  list.forEach(game => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Edit ${game.title}`);

    const metaParts = [];
    if(game.platform) metaParts.push(game.platform);
    if(game.genre) metaParts.push(game.genre);
    if(game.year) metaParts.push(game.year);

    card.innerHTML = `
      <div class="card-cover" style="background:${coverGradient(game.title)}">
        <span class="card-cover-letter">${(game.title[0] || '?').toUpperCase()}</span>
        <span class="card-rating">${game.rating.toFixed(1)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(game.title)}</h3>
        <div class="card-meta">${metaParts.map(m => `<span>${escapeHtml(String(m))}</span>`).join('')}</div>
        ${game.note ? `<p class="card-note">${escapeHtml(game.note)}</p>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openForm(game.id));
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') openForm(game.id);
    });

    grid.appendChild(card);
  });

  renderStats();
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


const overlay = document.getElementById('overlay');
const formPanel = document.getElementById('formPanel');
const gameForm = document.getElementById('gameForm');
const ratingInput = document.getElementById('ratingInput');
const ratingValue = document.getElementById('ratingValue');

function openForm(id = null){
  gameForm.reset();
  ratingInput.value = 7.5;
  ratingValue.textContent = '7.5';

  if(id){
    const game = games.find(g => g.id === id);
    document.getElementById('formTitle').textContent = 'Edit game';
    document.getElementById('gameId').value = game.id;
    document.getElementById('titleInput').value = game.title;
    document.getElementById('platformInput').value = game.platform;
    document.getElementById('yearInput').value = game.year || '';
    document.getElementById('genreInput').value = game.genre || '';
    document.getElementById('ratingInput').value = game.rating;
    document.getElementById('ratingValue').textContent = game.rating.toFixed(1);
    document.getElementById('noteInput').value = game.note || '';
    document.getElementById('deleteBtn').style.display = 'inline-block';
  } else {
    document.getElementById('formTitle').textContent = 'Add a game';
    document.getElementById('gameId').value = '';
    document.getElementById('deleteBtn').style.display = 'none';
  }

  overlay.classList.add('visible');
  formPanel.classList.add('visible');
  formPanel.setAttribute('aria-hidden', 'false');
  document.getElementById('titleInput').focus();
}

function closeForm(){
  overlay.classList.remove('visible');
  formPanel.classList.remove('visible');
  formPanel.setAttribute('aria-hidden', 'true');
}

document.getElementById('openFormBtn').addEventListener('click', () => openForm());
document.getElementById('closeFormBtn').addEventListener('click', closeForm);
overlay.addEventListener('click', closeForm);
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && formPanel.classList.contains('visible')) closeForm();
});

ratingInput.addEventListener('input', () => {
  ratingValue.textContent = parseFloat(ratingInput.value).toFixed(1);
});

gameForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('gameId').value;
  const data = {
    title: document.getElementById('titleInput').value.trim(),
    platform: document.getElementById('platformInput').value,
    year: document.getElementById('yearInput').value ? parseInt(document.getElementById('yearInput').value) : null,
    genre: document.getElementById('genreInput').value.trim(),
    rating: parseFloat(document.getElementById('ratingInput').value),
    note: document.getElementById('noteInput').value.trim(),
  };

  if(!data.title) return;

  if(id){
    const idx = games.findIndex(g => g.id === id);
    games[idx] = { ...games[idx], ...data };
  } else {
    games.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), createdAt: Date.now(), ...data });
  }

  saveGames(games);
  closeForm();
  renderGrid();
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  const id = document.getElementById('gameId').value;
  games = games.filter(g => g.id !== id);
  saveGames(games);
  closeForm();
  renderGrid();
});


document.getElementById('searchInput').addEventListener('input', renderGrid);
document.getElementById('sortSelect').addEventListener('change', renderGrid);


updateGreeting();
setInterval(updateGreeting, 30000);
renderGrid();
