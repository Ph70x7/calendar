const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const message = document.getElementById("message");
const todayLabel = document.getElementById("todayLabel");

const today = new Date();
let visibleYear = today.getFullYear();
let visibleMonth = today.getMonth();
let statuses = {};
const statusOrder = ["empty", "orange", "red", "green"];
const statusLabels = { empty: "Em aberto", orange: "Laranja", red: "Vermelho", green: "Verde" };
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(today);

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
async function loadMonth() {
  const month = `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}`;
  showMessage("Carregando marcações...");
  try {
    const response = await fetch(`api.php?action=list&month=${encodeURIComponent(month)}`);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Não foi possível carregar os dados.");
    statuses = data.statuses || {};
    renderCalendar();
    showMessage("Marcações sincronizadas.");
  } catch (error) {
    renderCalendar();
    showMessage(`${error.message} Confira se o servidor está configurado corretamente.`, true);
  }
}
function renderCalendar() {
  monthTitle.textContent = monthFormatter.format(new Date(visibleYear, visibleMonth, 1));
  calendarGrid.innerHTML = "";
  const firstDay = new Date(visibleYear, visibleMonth, 1).getDay();
  const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) {
      const spacer = document.createElement("div");
      spacer.className = "day outside";
      spacer.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(spacer);
      continue;
    }
    const key = dateKey(visibleYear, visibleMonth, day);
    const status = statuses[key] || "empty";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day ${status === "empty" ? "" : `status-${status}`}`;
    if (visibleYear === today.getFullYear() && visibleMonth === today.getMonth() && day === today.getDate()) {
      button.classList.add("is-today");
    }
    button.setAttribute("aria-label", `${day} de ${monthTitle.textContent}, status: ${statusLabels[status]}`);
    button.innerHTML = `<span class="number">${day}</span><span class="status-label">${status === "empty" ? "—" : statusLabels[status]}</span>`;
    button.addEventListener("click", () => changeStatus(key, status));
    calendarGrid.appendChild(button);
  }
  updateSummary();
}
async function changeStatus(key, currentStatus) {
  const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];
  statuses[key] = nextStatus;
  renderCalendar();
  showMessage("Salvando...");
  try {
    const response = await fetch("api.php?action=save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: key, status: nextStatus })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Falha ao salvar.");
    showMessage(`Dia ${Number(key.slice(-2))}: ${statusLabels[nextStatus].toLowerCase()} salvo.`);
  } catch (error) {
    statuses[key] = currentStatus;
    renderCalendar();
    showMessage(`${error.message} A marcação anterior foi restaurada.`, true);
  }
}
function updateSummary() {
  const counts = { orange: 0, red: 0, green: 0 };
  const prefix = `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}`;
  for (const [date, status] of Object.entries(statuses)) {
    if (date.startsWith(prefix) && Object.hasOwn(counts, status)) counts[status]++;
  }
  document.getElementById("orangeCount").textContent = counts.orange;
  document.getElementById("redCount").textContent = counts.red;
  document.getElementById("greenCount").textContent = counts.green;
}
document.getElementById("prevMonth").addEventListener("click", () => {
  visibleMonth--;
  if (visibleMonth < 0) { visibleMonth = 11; visibleYear--; }
  loadMonth();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  visibleMonth++;
  if (visibleMonth > 11) { visibleMonth = 0; visibleYear++; }
  loadMonth();
});
document.getElementById("todayBtn").addEventListener("click", () => {
  visibleYear = today.getFullYear();
  visibleMonth = today.getMonth();
  loadMonth();
});
loadMonth();
