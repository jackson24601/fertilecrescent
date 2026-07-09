(function () {
  const INITIAL = {
    stone: 20,
    wood: 40,
    food: 40,
    labor: 20,
  };

  const amounts = { ...INITIAL };

  const valueEls = {
    stone: document.getElementById("resource-stone"),
    wood: document.getElementById("resource-wood"),
    food: document.getElementById("resource-food"),
    labor: document.getElementById("resource-labor"),
  };

  function render(key) {
    const el = valueEls[key];
    if (!el) return;
    el.textContent = String(amounts[key]);
  }

  function renderAll() {
    Object.keys(amounts).forEach(render);
  }

  function flash(key) {
    const el = valueEls[key];
    if (!el) return;
    el.classList.remove("is-updated");
    // Force reflow so the animation can replay
    void el.offsetWidth;
    el.classList.add("is-updated");
    window.setTimeout(() => el.classList.remove("is-updated"), 350);
  }

  function get(key) {
    return amounts[key];
  }

  function getAll() {
    return { ...amounts };
  }

  function set(key, value) {
    if (!(key in amounts)) return;
    amounts[key] = Math.max(0, Math.floor(value));
    render(key);
    flash(key);
  }

  function add(key, delta) {
    if (!(key in amounts)) return;
    set(key, amounts[key] + delta);
  }

  function canAfford(cost) {
    return Object.keys(cost).every((key) => (amounts[key] || 0) >= cost[key]);
  }

  function spend(cost) {
    if (!canAfford(cost)) return false;
    Object.keys(cost).forEach((key) => add(key, -cost[key]));
    return true;
  }

  function reset() {
    Object.keys(INITIAL).forEach((key) => {
      amounts[key] = INITIAL[key];
    });
    renderAll();
  }

  renderAll();

  window.GameResources = {
    get,
    getAll,
    set,
    add,
    canAfford,
    spend,
    reset,
    INITIAL,
  };
})();
