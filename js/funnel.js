/* Two Minutes from Home — demo funnel flow.
   Persist choices in localStorage + query params.
   Live PayPal is a placeholder (see README). */

(function () {
  "use strict";

  var KEY = "tmh_order";
  var PAYPAL_EMAIL = "evinternetholdings@gmail.com";
  var SHARE =
    "Two minutes from home. Temple, May 22, 2024. Short true story. $4.99.";

  var PRICES = {
    ebook: 4.99,
    bump: 7,
    audio: 14,
    prep: 9,
  };

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function flag(v) {
    return v === true || v === 1 || v === "1" || v === "true";
  }

  function getOrder() {
    var o = readStore();
    var q = params();
    ["ebook", "bump", "audio", "prep"].forEach(function (k) {
      if (q.has(k)) o[k] = flag(q.get(k));
    });
    if (q.get("demo") === "1") o.demo = true;
    return o;
  }

  function saveOrder(partial) {
    var o = Object.assign({}, getOrder(), partial);
    localStorage.setItem(KEY, JSON.stringify(o));
    return o;
  }

  function queryFrom(extra) {
    var o = Object.assign({}, getOrder(), extra || {});
    var p = new URLSearchParams();
    p.set("demo", "1");
    ["ebook", "bump", "audio", "prep"].forEach(function (k) {
      if (o[k]) p.set(k, "1");
      else if (o[k] === false) p.set(k, "0");
    });
    return p.toString();
  }

  function go(page, extra) {
    saveOrder(extra || {});
    window.location.href = page + "?" + queryFrom(extra);
  }

  function money(n) {
    return "$" + Number(n).toFixed(2);
  }

  function totalOf(o) {
    var t = 0;
    if (o.ebook) t += PRICES.ebook;
    if (o.bump) t += PRICES.bump;
    if (o.audio) t += PRICES.audio;
    if (o.prep) t += PRICES.prep;
    return t;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  /* ----- sales page sticky bar ----- */
  function initSales() {
    var bar = $("#buybar");
    var trigger = $("#hero-cta");
    if (!bar || !trigger) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          bar.classList.toggle("is-on", !e.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );
    io.observe(trigger);
  }

  /* ----- checkout ----- */
  function initCheckout() {
    var bump = $("#bump");
    var totalEl = $("#order-total");
    var bumpLine = $("#bump-line");
    if (!bump) return;

    saveOrder({ ebook: true, demo: true });

    function sync() {
      var on = bump.checked;
      saveOrder({ ebook: true, bump: on });
      if (bumpLine) bumpLine.hidden = !on;
      if (totalEl) totalEl.textContent = money(PRICES.ebook + (on ? PRICES.bump : 0));
    }

    on(bump, "change", sync);
    var q = params();
    if (q.get("bump") === "1") bump.checked = true;
    sync();

    on($("#complete-order"), "click", function (e) {
      e.preventDefault();
      go("upsell-audio.html", { ebook: true, bump: bump.checked });
    });
  }

  /* ----- upsells ----- */
  function initAudio() {
    on($("#accept-audio"), "click", function (e) {
      e.preventDefault();
      go("upsell-prep.html", { audio: true });
    });
    on($("#decline-audio"), "click", function (e) {
      e.preventDefault();
      go("upsell-prep.html", { audio: false });
    });
  }

  function initPrep() {
    on($("#accept-prep"), "click", function (e) {
      e.preventDefault();
      go("thanks.html", { prep: true });
    });
    on($("#decline-prep"), "click", function (e) {
      e.preventDefault();
      go("thanks.html", { prep: false });
    });
  }

  /* ----- thanks ----- */
  function initThanks() {
    var box = $("#recap-lines");
    if (!box) return;
    var o = saveOrder({ ebook: true });
    var rows = [{ name: "Two Minutes from Home — ebook", price: PRICES.ebook }];
    if (o.bump) rows.push({ name: "72-Hour Tornado Plan — PDF", price: PRICES.bump });
    if (o.audio) rows.push({ name: "Cinematic audiobook (when finished)", price: PRICES.audio });
    if (o.prep) rows.push({ name: "Founding reader — next book", price: PRICES.prep });

    box.innerHTML = "";
    rows.forEach(function (r) {
      var div = document.createElement("div");
      div.className = "line";
      div.innerHTML =
        "<span></span><span></span>";
      div.children[0].textContent = r.name;
      div.children[1].textContent = money(r.price);
      box.appendChild(div);
    });
    var tot = document.createElement("div");
    tot.className = "total";
    tot.innerHTML = "<span>Total</span><span></span>";
    tot.children[1].textContent = money(totalOf(o));
    box.appendChild(tot);

    var dl = $("#bump-download");
    if (dl) dl.hidden = !o.bump;

    var audioNote = $("#audio-note");
    if (audioNote) audioNote.hidden = !o.audio;

    var prepNote = $("#prep-note");
    if (prepNote) prepNote.hidden = !o.prep;

    var share = $("#share-line");
    if (share) share.value = SHARE;

    on($("#copy-share"), "click", function () {
      var btn = $("#copy-share");
      function done() {
        if (btn) btn.textContent = "Copied";
        setTimeout(function () {
          if (btn) btn.textContent = "Copy";
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SHARE).then(done).catch(done);
      } else if (share) {
        share.select();
        try { document.execCommand("copy"); } catch (e) {}
        done();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    if (page === "sales") initSales();
    if (page === "checkout") initCheckout();
    if (page === "audio") initAudio();
    if (page === "prep") initPrep();
    if (page === "thanks") initThanks();
  });

  window.TMH = {
    PAYPAL_EMAIL: PAYPAL_EMAIL,
    getOrder: getOrder,
    saveOrder: saveOrder,
    go: go,
    PRICES: PRICES,
  };
})();
