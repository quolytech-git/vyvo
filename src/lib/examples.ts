export interface VyvoExample {
  id: string;
  name: string;
  description: string;
  badge: string;
  code: string;
}

export const VYVO_EXAMPLES: VyvoExample[] = [
  {
    id: "artisan-bakery",
    name: "Artisan Bakery Website",
    description: "Interactive café menu with cart, category filters, and reservation form",
    badge: "HTML",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solstice Bakery — Fresh Sourdough Daily</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF8F5;
      color: #1C1917;
      line-height: 1.6;
    }
    header {
      position: sticky; top: 0; z-index: 20;
      background: rgba(250, 248, 245, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #E7E5E4;
      padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { font-weight: 800; letter-spacing: -0.03em; font-size: 1.25rem; }
    .brand span { color: #B45309; }
    .cart-btn {
      background: #1C1917; color: #FAF8F5; border: none;
      padding: 10px 18px; border-radius: 999px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .cart-btn:hover { background: #292524; transform: translateY(-1px); }
    .hero {
      max-width: 980px; margin: 0 auto; padding: 64px 24px 40px;
      text-align: center;
    }
    .eyebrow {
      display: inline-block; font-size: 0.78rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: #B45309;
      background: #FEF3C7; padding: 6px 14px; border-radius: 999px; margin-bottom: 18px;
    }
    h1 {
      font-size: clamp(2.1rem, 5vw, 3.6rem); letter-spacing: -0.04em;
      line-height: 1.1; margin-bottom: 16px;
    }
    .hero p { color: #57534E; max-width: 560px; margin: 0 auto 28px; font-size: 1.05rem; }
    .filters { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
    .filter-btn {
      border: 1px solid #D6D3D1; background: #FFF; color: #44403C;
      padding: 8px 18px; border-radius: 999px; font-weight: 600; cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn.active { background: #1C1917; color: #FFF; border-color: #1C1917; }
    .grid {
      max-width: 980px; margin: 0 auto; padding: 0 24px 64px;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;
    }
    .card {
      background: #FFF; border: 1px solid #E7E5E4; border-radius: 18px;
      padding: 22px; display: flex; flex-direction: column; justify-content: space-between;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(28,25,23,0.06); }
    .emoji { font-size: 2.2rem; margin-bottom: 12px; }
    .card h3 { font-size: 1.1rem; margin-bottom: 6px; }
    .card p { font-size: 0.9rem; color: #78716C; margin-bottom: 18px; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .price { font-weight: 800; font-size: 1.1rem; }
    .add-btn {
      background: #F5F5F4; color: #1C1917; border: 1px solid #E7E5E4;
      padding: 8px 14px; border-radius: 10px; font-weight: 600; cursor: pointer;
      transition: all 0.15s ease;
    }
    .add-btn:hover { background: #B45309; color: #FFF; border-color: #B45309; }
    .drawer {
      position: fixed; inset: 0; background: rgba(28,25,23,0.45);
      display: none; justify-content: flex-end; z-index: 50;
    }
    .drawer.open { display: flex; }
    .drawer-panel {
      width: min(380px, 100%); background: #FFF; height: 100%;
      padding: 24px; display: flex; flex-direction: column;
    }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .drawer-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
    .cart-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px; background: #FAF8F5; border-radius: 12px;
    }
    .checkout-btn {
      width: 100%; background: #B45309; color: #FFF; border: none;
      padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem;
      cursor: pointer; margin-top: 16px;
    }
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1C1917; color: #FFF; padding: 12px 20px; border-radius: 999px;
      font-weight: 600; font-size: 0.9rem; opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease; z-index: 60;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Solstice<span>.</span></div>
    <button class="cart-btn" id="openCart">Bag (<span id="cartCount">0</span>)</button>
  </header>

  <section class="hero">
    <div class="eyebrow">Baked fresh at 5:00 AM</div>
    <h1>Slow-fermented sourdough & morning pastries.</h1>
    <p>Organic stone-milled flour, cultured butter, and small-batch espresso. Tap any item to add it to your morning order.</p>
    <div class="filters" id="filters">
      <button class="filter-btn active" data-cat="all">All</button>
      <button class="filter-btn" data-cat="bread">Sourdough</button>
      <button class="filter-btn" data-cat="pastry">Pastries</button>
      <button class="filter-btn" data-cat="coffee">Coffee</button>
    </div>
  </section>

  <section class="grid" id="menuGrid"></section>

  <div class="drawer" id="cartDrawer">
    <div class="drawer-panel">
      <div class="drawer-header">
        <h2>Your Morning Bag</h2>
        <button class="add-btn" id="closeCart">Close</button>
      </div>
      <div class="drawer-items" id="cartItems"></div>
      <div style="border-top:1px solid #E7E5E4;padding-top:16px;margin-top:16px;">
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;">
          <span>Total</span>
          <span id="cartTotal">$0.00</span>
        </div>
        <button class="checkout-btn" id="checkoutBtn">Place Pickup Order</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const MENU = [
      { id: 1, name: "Country Sourdough", cat: "bread", price: 9.5, emoji: "🍞", desc: "36-hour cold ferment with crisp caramelized crust." },
      { id: 2, name: "Cardamom Knot", cat: "pastry", price: 5.25, emoji: "🥐", desc: "Hand-twisted Swedish brioche dusted in pearl sugar." },
      { id: 3, name: "Pistachio Croissant", cat: "pastry", price: 6.5, emoji: "✨", desc: "Flaky laminated pastry filled with roasted Sicilian pistachio cream." },
      { id: 4, name: "Olive & Rosemary Boule", cat: "bread", price: 11.0, emoji: "🫒", desc: "Castelvetrano olives folded into rustic heritage wheat." },
      { id: 5, name: "Honey Oat Cortado", cat: "coffee", price: 5.0, emoji: "☕", desc: "Double ristretto, steamed oat milk, wildflower honey." },
      { id: 6, name: "Matcha Cold Foam", cat: "coffee", price: 6.25, emoji: "🍵", desc: "Ceremonial Uji matcha whisked over ice with vanilla cream." }
    ];

    let activeCat = "all";
    let cart = JSON.parse(localStorage.getItem("solstice_cart") || "[]");

    function showToast(msg) {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2200);
    }

    function renderMenu() {
      const grid = document.getElementById("menuGrid");
      const items = activeCat === "all" ? MENU : MENU.filter(i => i.cat === activeCat);
      grid.innerHTML = items.map(item => \`
        <article class="card">
          <div>
            <div class="emoji">\${item.emoji}</div>
            <h3>\${item.name}</h3>
            <p>\${item.desc}</p>
          </div>
          <div class="card-footer">
            <span class="price">$\${item.price.toFixed(2)}</span>
            <button class="add-btn" onclick="addToCart(\${item.id})">+ Add</button>
          </div>
        </article>
      \`).join("");
    }

    window.addToCart = function(id) {
      const found = cart.find(c => c.id === id);
      if (found) found.qty += 1;
      else cart.push({ ...MENU.find(m => m.id === id), qty: 1 });
      localStorage.setItem("solstice_cart", JSON.stringify(cart));
      updateCartUI();
      showToast("Added to your morning bag");
    };

    window.removeItem = function(id) {
      cart = cart.filter(c => c.id !== id);
      localStorage.setItem("solstice_cart", JSON.stringify(cart));
      updateCartUI();
    };

    function updateCartUI() {
      const count = cart.reduce((sum, i) => sum + i.qty, 0);
      const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      document.getElementById("cartCount").textContent = count;
      document.getElementById("cartTotal").textContent = "$" + total.toFixed(2);
      const container = document.getElementById("cartItems");
      if (cart.length === 0) {
        container.innerHTML = '<p style="color:#78716C;text-align:center;margin-top:40px;">Your bag is empty.</p>';
        return;
      }
      container.innerHTML = cart.map(item => \`
        <div class="cart-item">
          <div>
            <div style="font-weight:700;">\${item.name} × \${item.qty}</div>
            <div style="font-size:0.85rem;color:#78716C;">$\${(item.price * item.qty).toFixed(2)}</div>
          </div>
          <button class="add-btn" onclick="removeItem(\${item.id})">Remove</button>
        </div>
      \`).join("");
    }

    document.getElementById("filters").addEventListener("click", (e) => {
      if (!e.target.dataset.cat) return;
      activeCat = e.target.dataset.cat;
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      renderMenu();
    });

    document.getElementById("openCart").onclick = () => document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("closeCart").onclick = () => document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("checkoutBtn").onclick = () => {
      if (!cart.length) return showToast("Add an item first!");
      cart = [];
      localStorage.setItem("solstice_cart", "[]");
      updateCartUI();
      document.getElementById("cartDrawer").classList.remove("open");
      showToast("Order confirmed! Ready for pickup in 15 mins.");
    };

    renderMenu();
    updateCartUI();
  </script>
</body>
</html>`,
  },
  {
    id: "focus-planner-react",
    name: "Daily Focus & Habit App",
    description: "Interactive React + TypeScript app with live timer, tasks, and progress",
    badge: "React",
    code: `import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, Play, Pause, RotateCcw, Flame } from "lucide-react";

interface Task {
  id: number;
  title: string;
  done: boolean;
}

export default function FocusPlanner() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Review website launch checklist", done: true },
    { id: 2, title: "Write welcome message for customers", done: false },
    { id: 3, title: "Share live preview with the team", done: false },
  ]);
  const [input, setInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), title: input.trim(), done: false }]);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Daily Focus</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Today&apos;s Workspace</h1>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-full text-sm font-medium">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{progress}% done</span>
          </div>
        </header>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-400">Deep Work Timer</p>
            <div className="text-5xl font-mono font-bold tracking-tight mt-1">{mins}:{secs}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={() => { setRunning(false); setSecondsLeft(25 * 60); }}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Priority Tasks</h2>
            <span className="text-xs text-zinc-400">{completed} of {tasks.length} completed</span>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: \`\${progress}%\` }}
            />
          </div>

          <form onSubmit={addTask} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new goal for today..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80"
              >
                <button
                  onClick={() =>
                    setTasks((prev) =>
                      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                    )
                  }
                  className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                >
                  <span
                    className={\`w-5 h-5 rounded-md flex items-center justify-center border transition \${
                      task.done
                        ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                        : "border-zinc-700"
                    }\`}
                  >
                    {task.done && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className={task.done ? "line-through text-zinc-500" : "text-zinc-100"}>
                    {task.title}
                  </span>
                </button>
                <button
                  onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                  className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}`,
  },
  {
    id: "pricing-calculator",
    name: "Interactive Price Calculator",
    description: "Multi-block HTML + CSS + JavaScript combined automatically by VYVO",
    badge: "HTML + CSS + JS",
    code: `Here is your interactive project estimator!

### index.html
\`\`\`html
<div class="app">
  <div class="badge">Instant Quote</div>
  <h1>Project Cost Estimator</h1>
  <p class="subtitle">Adjust the sliders to calculate your custom design & launch package.</p>

  <div class="control">
    <div class="label-row">
      <label for="pages">Number of Pages</label>
      <strong id="pagesVal">5 pages</strong>
    </div>
    <input type="range" id="pages" min="1" max="20" value="5" />
  </div>

  <div class="toggles">
    <label class="toggle-card">
      <input type="checkbox" id="branding" checked />
      <span>Custom Brand Identity <em>+$600</em></span>
    </label>
    <label class="toggle-card">
      <input type="checkbox" id="seo" />
      <span>SEO & Analytics Setup <em>+$350</em></span>
    </label>
    <label class="toggle-card">
      <input type="checkbox" id="rush" />
      <span>48-Hour Rush Delivery <em>+$500</em></span>
    </label>
  </div>

  <div class="summary">
    <div>
      <span class="muted">Estimated Investment</span>
      <div class="total" id="totalPrice">$1,850</div>
    </div>
    <button id="bookBtn">Lock In Estimate →</button>
  </div>
  <p class="confirm" id="confirmMsg"></p>
</div>
\`\`\`

### styles.css
\`\`\`css
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0F172A;
  color: #F8FAFC;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.app {
  width: min(520px, 100%);
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 32px;
}
.badge {
  display: inline-block; font-size: 12px; font-weight: 700;
  color: #34D399; background: rgba(16, 185, 129, 0.14);
  padding: 4px 12px; border-radius: 999px; margin-bottom: 12px;
}
h1 { font-size: 1.75rem; letter-spacing: -0.03em; margin-bottom: 8px; }
.subtitle { color: #94A3B8; font-size: 0.95rem; margin-bottom: 24px; }
.control { margin-bottom: 22px; }
.label-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
input[type="range"] { width: 100%; accent-color: #10B981; cursor: pointer; }
.toggles { display: grid; gap: 10px; margin-bottom: 24px; }
.toggle-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; border-radius: 12px; background: #0F172A;
  border: 1px solid #334155; cursor: pointer; font-size: 0.92rem;
}
.toggle-card em { color: #34D399; font-style: normal; font-weight: 600; margin-left: 6px; }
.summary {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding-top: 20px; border-top: 1px solid #334155; flex-wrap: wrap;
}
.muted { font-size: 0.8rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; }
.total { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
button {
  background: #10B981; color: #052E16; border: none;
  padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer;
}
button:hover { background: #34D399; }
.confirm { margin-top: 14px; font-size: 0.9rem; color: #34D399; min-height: 20px; }
\`\`\`

### script.js
\`\`\`js
const pagesInput = document.getElementById("pages");
const pagesVal = document.getElementById("pagesVal");
const branding = document.getElementById("branding");
const seo = document.getElementById("seo");
const rush = document.getElementById("rush");
const totalPrice = document.getElementById("totalPrice");
const confirmMsg = document.getElementById("confirmMsg");

function calculate() {
  const pages = Number(pagesInput.value);
  pagesVal.textContent = pages + (pages === 1 ? " page" : " pages");
  let sum = pages * 250;
  if (branding.checked) sum += 600;
  if (seo.checked) sum += 350;
  if (rush.checked) sum += 500;
  totalPrice.textContent = "$" + sum.toLocaleString();
}

[pagesInput, branding, seo, rush].forEach(el => el.addEventListener("input", calculate));
document.getElementById("bookBtn").addEventListener("click", () => {
  confirmMsg.textContent = "Estimate locked in at " + totalPrice.textContent + "! Ready to start.";
});
calculate();
\`\`\``,
  },
];
