const CATEGORY_EMOJI = {
  coffee: "☕",
  beverage: "🥤",
  dessert: "🍰",
  bakery: "🥐",
};

const state = {
  menu: null, // {categories, items, optionGroups}
  activeCategory: null,
  cart: [], // {cartId, itemId, name, quantity, selectedOptions, unitPrice}
  pendingItem: null, // 옵션 모달에서 선택 중인 메뉴
  pendingOptions: {},
  pendingQty: 1,
  orderType: null,
  currentOrder: null, // {orderId, orderNumber, total}
};

const el = (id) => document.getElementById(id);

function formatWon(n) {
  return n.toLocaleString("ko-KR") + "원";
}

async function loadMenu() {
  const res = await fetch("/api/menu");
  state.menu = await res.json();
  state.activeCategory = state.menu.categories[0].id;
  renderCategoryTabs();
  renderMenuGrid();
}

function renderCategoryTabs() {
  const nav = el("category-tabs");
  nav.innerHTML = "";
  state.menu.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-tab-btn" + (cat.id === state.activeCategory ? " active" : "");
    btn.textContent = `${CATEGORY_EMOJI[cat.id] || ""} ${cat.name}`;
    btn.addEventListener("click", () => {
      state.activeCategory = cat.id;
      renderCategoryTabs();
      renderMenuGrid();
    });
    nav.appendChild(btn);
  });
}

function renderMenuGrid() {
  const grid = el("menu-grid");
  grid.innerHTML = "";
  const items = state.menu.items.filter((i) => i.category === state.activeCategory);
  items.forEach((item) => {
    const card = document.createElement("button");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="menu-card-emoji">${CATEGORY_EMOJI[item.category] || "🍽️"}</div>
      <div class="menu-card-name">${item.name}</div>
      <div class="menu-card-price">${formatWon(item.price)}</div>
    `;
    card.addEventListener("click", () => openOptionModal(item));
    grid.appendChild(card);
  });
}

function openOptionModal(item) {
  state.pendingItem = item;
  state.pendingOptions = {};
  state.pendingQty = 1;

  item.options.forEach((groupId) => {
    const group = state.menu.optionGroups[groupId];
    if (group.required) {
      state.pendingOptions[groupId] = group.choices[0].id;
    }
  });

  el("option-modal-title").textContent = item.name;
  renderOptionGroups();
  updateAddButtonPrice();
  el("qty-value").textContent = state.pendingQty;
  el("option-modal").classList.remove("hidden");
}

function renderOptionGroups() {
  const container = el("option-groups");
  container.innerHTML = "";
  const item = state.pendingItem;

  item.options.forEach((groupId) => {
    const group = state.menu.optionGroups[groupId];
    const wrap = document.createElement("div");
    wrap.className = "option-group";

    const title = document.createElement("div");
    title.className = "option-group-title";
    title.textContent = group.name + (group.required ? "" : " (선택)");
    wrap.appendChild(title);

    const row = document.createElement("div");
    row.className = "option-choice-row";

    group.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "option-choice-btn" +
        (state.pendingOptions[groupId] === choice.id ? " selected" : "");
      btn.textContent = choice.delta > 0 ? `${choice.name} (+${choice.delta.toLocaleString()}원)` : choice.name;
      btn.addEventListener("click", () => {
        state.pendingOptions[groupId] = choice.id;
        renderOptionGroups();
        updateAddButtonPrice();
      });
      row.appendChild(btn);
    });

    wrap.appendChild(row);
    container.appendChild(wrap);
  });
}

function calcUnitPrice(item, selectedOptions) {
  let price = item.price;
  item.options.forEach((groupId) => {
    const group = state.menu.optionGroups[groupId];
    const choiceId = selectedOptions[groupId];
    if (!choiceId) return;
    const choice = group.choices.find((c) => c.id === choiceId);
    if (choice) price += choice.delta;
  });
  return price;
}

function updateAddButtonPrice() {
  const unitPrice = calcUnitPrice(state.pendingItem, state.pendingOptions);
  el("option-add-price").textContent = (unitPrice * state.pendingQty).toLocaleString();
}

function closeOptionModal() {
  el("option-modal").classList.add("hidden");
  state.pendingItem = null;
}

function describeOptions(item, selectedOptions) {
  return item.options
    .map((groupId) => {
      const group = state.menu.optionGroups[groupId];
      const choiceId = selectedOptions[groupId];
      if (!choiceId) return null;
      const choice = group.choices.find((c) => c.id === choiceId);
      return choice ? choice.name : null;
    })
    .filter(Boolean)
    .join(" / ");
}

function addPendingToCart() {
  const item = state.pendingItem;
  const unitPrice = calcUnitPrice(item, state.pendingOptions);
  state.cart.push({
    cartId: crypto.randomUUID(),
    itemId: item.id,
    name: item.name,
    quantity: state.pendingQty,
    selectedOptions: { ...state.pendingOptions },
    optionsLabel: describeOptions(item, state.pendingOptions),
    unitPrice,
  });
  closeOptionModal();
  renderCart();
  openCartPanel();
}

function renderCart() {
  const container = el("cart-items");
  container.innerHTML = "";

  state.cart.forEach((line) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <div class="cart-item-name">${line.name}</div>
        ${line.optionsLabel ? `<div class="cart-item-options">${line.optionsLabel}</div>` : ""}
        <div class="cart-item-qty-row">
          <button class="icon-btn" data-action="dec">−</button>
          <span>${line.quantity}</span>
          <button class="icon-btn" data-action="inc">+</button>
        </div>
        <button class="cart-item-remove" data-action="remove">삭제</button>
      </div>
      <div class="cart-item-price">${formatWon(line.unitPrice * line.quantity)}</div>
    `;

    row.querySelector('[data-action="inc"]').addEventListener("click", () => {
      line.quantity += 1;
      renderCart();
    });
    row.querySelector('[data-action="dec"]').addEventListener("click", () => {
      line.quantity -= 1;
      if (line.quantity <= 0) {
        state.cart = state.cart.filter((l) => l.cartId !== line.cartId);
      }
      renderCart();
    });
    row.querySelector('[data-action="remove"]').addEventListener("click", () => {
      state.cart = state.cart.filter((l) => l.cartId !== line.cartId);
      renderCart();
    });

    container.appendChild(row);
  });

  const total = state.cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const count = state.cart.reduce((sum, l) => sum + l.quantity, 0);
  el("cart-total").textContent = formatWon(total);
  el("cart-count").textContent = count;
  el("order-btn").disabled = state.cart.length === 0;
}

function openCartPanel() {
  el("cart-panel").classList.add("open");
}

function closeCartPanel() {
  el("cart-panel").classList.remove("open");
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  el(screenId).classList.add("active");
}

async function submitOrder(orderType) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderType,
      items: state.cart.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        selectedOptions: l.selectedOptions,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "주문 생성에 실패했습니다." }));
    alert(err.detail || "주문 생성에 실패했습니다.");
    return null;
  }

  return res.json();
}

async function payOrder(orderId, paymentMethod) {
  const res = await fetch(`/api/orders/${orderId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentMethod }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "결제에 실패했습니다." }));
    alert(err.detail || "결제에 실패했습니다.");
    return null;
  }
  return res.json();
}

function resetToHome() {
  state.cart = [];
  state.orderType = null;
  state.currentOrder = null;
  renderCart();
  closeCartPanel();
  showScreen("screen-home");
}

function init() {
  loadMenu();

  el("cart-toggle-btn").addEventListener("click", openCartPanel);
  el("cart-close-btn").addEventListener("click", closeCartPanel);

  el("option-cancel-btn").addEventListener("click", closeOptionModal);
  el("option-add-btn").addEventListener("click", addPendingToCart);

  el("qty-plus").addEventListener("click", () => {
    state.pendingQty += 1;
    el("qty-value").textContent = state.pendingQty;
    updateAddButtonPrice();
  });
  el("qty-minus").addEventListener("click", () => {
    if (state.pendingQty > 1) state.pendingQty -= 1;
    el("qty-value").textContent = state.pendingQty;
    updateAddButtonPrice();
  });

  el("order-btn").addEventListener("click", () => {
    closeCartPanel();
    showScreen("screen-order-type");
  });

  document.querySelectorAll("[data-order-type]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.orderType = btn.dataset.orderType;
      const order = await submitOrder(state.orderType);
      if (!order) return;
      state.currentOrder = order;
      el("payment-total").textContent = formatWon(order.total);
      showScreen("screen-payment");
    });
  });

  document.querySelectorAll("[data-pay-method]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!state.currentOrder) return;
      el("payment-processing").classList.remove("hidden");
      const result = await payOrder(state.currentOrder.orderId, btn.dataset.payMethod);
      el("payment-processing").classList.add("hidden");
      if (!result) return;

      el("complete-order-number").textContent = `#${result.orderNumber}`;
      el("complete-wait-time").textContent = "예상 대기시간: 약 5~7분";
      showScreen("screen-complete");
    });
  });

  document.querySelectorAll("[data-back-to]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.backTo));
  });

  el("restart-btn").addEventListener("click", resetToHome);
}

init();
