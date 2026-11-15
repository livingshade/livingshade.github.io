import { inspectAssignment } from './assignment.mjs';

const canvas = document.querySelector('#search-field');
const context = canvas.getContext('2d');
const denseButton = document.querySelector('#dense-mode');
const indexedButton = document.querySelector('#indexed-mode');
const probeInput = document.querySelector('#probe-count');
const probeValue = document.querySelector('#probe-value');
const countLabel = document.querySelector('#distance-count');
const detailLabel = document.querySelector('#check-detail');

const fieldWidth = 920;
const fieldHeight = 360;
const queryStart = { x: 505, y: 184 };
let query = queryStart;
let dense = false;

function sample(index) {
  const value = Math.sin(index * 78.233 + 43.21) * 43758.5453123;
  return value - Math.floor(value);
}

const cellCenters = [
  [117, 59], [327, 76], [557, 55], [800, 65],
  [157, 130], [386, 155], [583, 130], [769, 149],
  [106, 208], [313, 233], [511, 206], [801, 224],
  [177, 293], [382, 294], [618, 301], [785, 298],
];
const cells = cellCenters.map(([x, y], index) => ({
  x, y,
  centroids: Array.from({ length: 14 }, (_, pointIndex) => {
    const seed = 20 + index * 53 + pointIndex * 3;
    const angle = Math.PI * 2 * sample(seed);
    const radius = Math.sqrt(sample(seed + 1));
    return { x: x + 55 * radius * Math.cos(angle), y: y + 30 * radius * Math.sin(angle) };
  }),
}));
const centroids = cells.flatMap(cell => cell.centroids);

function line(from, to) {
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

function dot(point, radius, color) {
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function render() {
  const result = inspectAssignment(cells, query, dense ? null : Number(probeInput.value));
  const selected = new Set(result.selected);
  const candidates = new Set(result.candidates);
  context.clearRect(0, 0, fieldWidth, fieldHeight);

  for (let x = 22; x < fieldWidth; x += 28) {
    for (let y = 18; y < fieldHeight; y += 28) dot({ x, y }, 0.8, '#e3e7dc');
  }

  if (!dense) {
    for (const cell of result.selected) {
      context.beginPath();
      context.ellipse(cell.x, cell.y, 66, 36, 0, 0, Math.PI * 2);
      context.fillStyle = '#e9f0c5';
      context.fill();
      context.strokeStyle = '#d9e2b2';
      context.stroke();
    }
    context.setLineDash([3, 6]);
    for (const cell of cells) {
      context.strokeStyle = selected.has(cell) ? '#83974f' : '#ccd2c2';
      context.lineWidth = selected.has(cell) ? 1.4 : 1;
      line(query, cell);
    }
    context.setLineDash([]);
  }

  context.lineWidth = 1;
  context.strokeStyle = dense ? 'rgba(56, 67, 42, .13)' : 'rgba(68, 90, 35, .24)';
  for (const point of result.candidates) line(query, point);
  for (const point of centroids) {
    const checked = candidates.has(point);
    dot(point, checked ? 3.15 : 2.75, checked ? '#7c9150' : '#cdd3c7');
  }

  if (!dense) {
    for (const cell of cells) {
      context.strokeStyle = selected.has(cell) ? '#536926' : '#aeb8a2';
      line({ x: cell.x - 6, y: cell.y }, { x: cell.x + 6, y: cell.y });
      line({ x: cell.x, y: cell.y - 6 }, { x: cell.x, y: cell.y + 6 });
    }
  }

  if (result.nearest) {
    dot(result.nearest, 10, '#fdfdfa');
    context.strokeStyle = '#4a6217';
    context.lineWidth = 1.6;
    context.stroke();
    dot(result.nearest, 4.2, '#b5d33f');
    context.strokeStyle = '#536926';
    line(query, result.nearest);
  }
  dot(query, 10.2, '#fdfdfa');
  dot(query, 6.4, '#202818');

  const count = String(result.cellChecks + result.candidates.length);
  if (countLabel.textContent !== count) countLabel.textContent = count;
  const detail = dense
    ? String(result.candidates.length) + ' centroid distances'
    : String(result.cellChecks) + ' cell centers + ' + String(result.candidates.length) + ' centroids';
  if (detailLabel.textContent !== detail) detailLabel.textContent = detail;
}

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  const scale = Math.min(2, window.devicePixelRatio || 1);
  if (width < 1 || height < 1) return;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(canvas.width / fieldWidth, 0, 0, canvas.height / fieldHeight, 0, 0);
  render();
}

function moveQuery(x, y) {
  query = {
    x: Math.max(12, Math.min(fieldWidth - 12, x)),
    y: Math.max(12, Math.min(fieldHeight - 12, y)),
  };
  render();
}

function pointer(event) {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  moveQuery((event.clientX - left) * fieldWidth / width, (event.clientY - top) * fieldHeight / height);
}

function mode(fullScan) {
  dense = fullScan;
  denseButton.setAttribute('aria-pressed', String(dense));
  indexedButton.setAttribute('aria-pressed', String(!dense));
  probeInput.disabled = dense;
  render();
}

const arrowKeys = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};
canvas.addEventListener('pointermove', event => {
  if (event.pointerType !== 'touch') pointer(event);
});
canvas.addEventListener('pointerdown', pointer);
canvas.addEventListener('keydown', event => {
  const delta = arrowKeys[event.key];
  if (!delta && event.key !== 'Escape') return;
  event.preventDefault();
  if (delta) moveQuery(query.x + 14 * delta[0], query.y + 14 * delta[1]);
  else moveQuery(queryStart.x, queryStart.y);
});
denseButton.addEventListener('click', () => mode(true));
indexedButton.addEventListener('click', () => mode(false));
probeInput.addEventListener('input', () => {
  probeValue.value = probeInput.value;
  render();
});
new ResizeObserver(resize).observe(canvas);
resize();
