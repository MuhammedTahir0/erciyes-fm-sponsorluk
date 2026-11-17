import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);
const Core = require(path.join(projectRoot, "app.js"));

test("index.html contains all canonical 3-page PDF strings and figures", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const requiredFragments = [
    "ERCİYES FM",
    "YAYIN SPONSORLUK SUNUM",
    "Tematik Radyo Program Akışı &amp; İletişim Kuşağı Planlaması",
    "Nur Kendir",
    "Emine Işık",
    "SPONSOR MARKASI",
    "2026",
    "Page 1 of 3",
    "Kayseri ve İç Anadolu'nun Güçlü Sesi ile Markanızı Zirveye Taşıyın",
    "%85+",
    "BÖLGESEL ERİŞİM",
    "100.000+",
    "GÜNLÜK DİNLEYİCİ",
    "20-55",
    "HEDEF YAŞ ARALIĞI",
    "Bronz Sponsorluk",
    "15.000 TL",
    "Gümüş Sponsorluk",
    "25.000 TL",
    "Altın Sponsorluk",
    "30.000 TL",
    "Özel Kampanya &amp; Etkinlik Sponsorluğu",
    "0539 735 22 80",
    "www.erciyesfm.com.tr",
    "Page 2 of 3",
    "1. HAFTA İÇİ YAYIN AKIŞI",
    "Günün yorgunluğunu atan, sohbet ve müzik ağırlıklı akıcı akşam kuşağı.",
    "Açılış &amp; Jingle",
    "Günün Teması &amp; Müzik",
    "Sponsor Kuşağı",
    "Dinleyici Köşesi",
    "Günün Notu &amp; Şiir",
    "Kapanış &amp; Teşekkür",
    "Page 3 of 3",
  ];

  for (const fragment of requiredFragments) {
    assert.ok(
      html.includes(fragment),
      `Expected index.html to include canonical fragment: ${fragment}`
    );
  }
});

test("parseTimeRange parses standard, dot-separated and midnight-wrapping ranges", () => {
  const r1 = Core.parseTimeRange("18:00 - 20:00");
  assert.deepEqual(r1, {
    startMinutes: 1080,
    endMinutes: 1200,
    duration: 120,
    formattedRange: "18:00 - 20:00",
  });

  const r2 = Core.parseTimeRange("19.00–21.00");
  assert.equal(r2.formattedRange, "19:00 - 21:00");
  assert.equal(r2.duration, 120);

  const r3 = Core.parseTimeRange("22:00 - 00:00");
  assert.equal(r3.duration, 120);
  assert.equal(r3.formattedRange, "22:00 - 00:00");

  assert.equal(Core.parseTimeRange(""), null);
  assert.equal(Core.parseTimeRange("25:00 - 26:00"), null);
  assert.equal(Core.parseTimeRange("18:00 - 18:03"), null);
});

test("distributeScheduleSlots produces 6 contiguous segments or template placeholders", () => {
  const slots = Core.distributeScheduleSlots("18:00 - 20:00");
  assert.equal(slots.length, 6);
  assert.deepEqual(slots, [
    "18:00 - 18:12",
    "18:12 - 18:42",
    "18:42 - 19:00",
    "19:00 - 19:30",
    "19:30 - 19:48",
    "19:48 - 20:00",
  ]);

  const fallback = Core.distributeScheduleSlots("geçersiz");
  assert.equal(fallback.length, 6);
  assert.ok(fallback.every((s) => s === Core.DEFAULT_SLOT_PLACEHOLDER));
});

test("formatOpeningJingleDetail dynamically embeds sponsor name or placeholder", () => {
  assert.equal(
    Core.formatOpeningJingleDetail(""),
    "Program açılışı, günün selamlanması ve “................. ile Akşam Kuşağı Başlıyor” sponsorlu jingle."
  );
  assert.equal(
    Core.formatOpeningJingleDetail("  Kayseri   Mobilya  "),
    "Program açılışı, günün selamlanması ve “Kayseri Mobilya ile Akşam Kuşağı Başlıyor” sponsorlu jingle."
  );
});

test("URL search state parsing and share link generation round-trip accurately", () => {
  const parsed = Core.parseStateFromSearch(
    "?firma=Anadolu+Yapi&saat=18:00+-+20:00&paket=altin&gorunum=sunum&musteri=1"
  );
  assert.equal(parsed.sponsorName, "Anadolu Yapi");
  assert.equal(parsed.broadcastHours, "18:00 - 20:00");
  assert.equal(parsed.packageId, "altin");
  assert.equal(parsed.view, "sunum");
  assert.equal(parsed.customerMode, true);
  assert.equal(parsed.slots[0], "18:00 - 18:12");

  const built = Core.buildShareUrl("https://erciyesfm.example.com/", parsed, {
    customerMode: true,
  });
  const roundTripped = Core.parseStateFromSearch(new URL(built).search);
  assert.equal(roundTripped.sponsorName, "Anadolu Yapi");
  assert.equal(roundTripped.broadcastHours, "18:00 - 20:00");
  assert.equal(roundTripped.packageId, "altin");
  assert.equal(roundTripped.view, "sunum");
  assert.equal(roundTripped.customerMode, true);
});

test("buildWhatsAppUrl encodes Emine Işık number, sponsor brand, package and hours", () => {
  const state = {
    sponsorName: "Erciyes Kurumsal",
    broadcastHours: "18:00 - 20:00",
    packageId: "gumus",
  };
  const url = Core.buildWhatsAppUrl(state);
  assert.ok(url.startsWith("https://wa.me/905397352280?text="));
  const decoded = decodeURIComponent(url.split("?text=")[1]);
  assert.match(decoded, /Erciyes Kurumsal/);
  assert.match(decoded, /Gümüş Sponsorluk \(25\.000 TL\)/);
  assert.match(decoded, /18:00 - 20:00/);
  assert.match(decoded, /Nur Kendir/);
});

test("renderState updates mock DOM safely without XSS interpretation", () => {
  function createEl(attrs = {}) {
    const classes = new Set();
    const attrMap = new Map(Object.entries(attrs));
    return {
      textContent: "",
      value: "",
      classList: {
        toggle(name, force) {
          if (force === undefined) {
            if (classes.has(name)) classes.delete(name);
            else classes.add(name);
          } else if (force) {
            classes.add(name);
          } else {
            classes.delete(name);
          }
        },
        contains(name) {
          return classes.has(name);
        },
      },
      setAttribute(k, v) {
        attrMap.set(k, String(v));
      },
      getAttribute(k) {
        return attrMap.get(k) ?? null;
      },
      querySelector() {
        return null;
      },
    };
  }

  const byId = {
    tabVitrin: createEl(),
    tabSunum: createEl(),
    customerBanner: createEl(),
    btnToggleEditorInCustomer: createEl(),
    customerBannerSummary: createEl(),
    heroSponsorGreeting: createEl(),
    heroSponsorName: createEl(),
    pdfSponsorBrand: createEl(),
    pdfBroadcastHours: createEl(),
    vitrinHoursPill: createEl(),
    pdfOpeningJingle: createEl(),
    cueOpeningText: createEl(),
    cuePackageLabel: createEl(),
    selectPackage: createEl(),
    heroWaLink: createEl(),
    footerWaLink: createEl(),
    customerBannerWa: createEl(),
    shareUrlPreview: createEl(),
  };
  const jingleCell = createEl();
  const slotInputs = Array.from({ length: 6 }, (_, i) =>
    createEl({ "data-slot-input": String(i) })
  );
  const pdfSlots = Array.from({ length: 6 }, (_, i) =>
    createEl({ "data-pdf-slot": String(i) })
  );

  const mockDoc = {
    body: createEl(),
    activeElement: null,
    getElementById(id) {
      return byId[id] || null;
    },
    querySelector(sel) {
      if (sel === "[data-jingle-cell]") return jingleCell;
      const m1 = sel.match(/^\[data-slot-input="(\d+)"\]$/);
      if (m1) return slotInputs[Number(m1[1])] || null;
      const m2 = sel.match(/^\[data-pdf-slot="(\d+)"\]$/);
      if (m2) return pdfSlots[Number(m2[1])] || null;
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  const xssAttempt = '<img src=x onerror=alert(1)>';
  const state = Core.parseStateFromSearch(
    `?firma=${encodeURIComponent(xssAttempt)}&saat=20:00+-+22:00&paket=altin&musteri=1`
  );
  Core.renderState(mockDoc, { location: { href: "https://erciyesfm.local/" } }, state);

  assert.equal(byId.pdfSponsorBrand.textContent, xssAttempt);
  assert.equal(byId.heroSponsorName.textContent, xssAttempt);
  assert.ok(byId.pdfOpeningJingle.textContent.includes(xssAttempt));
  assert.equal(pdfSlots[0].textContent, "20:00 - 20:12");
  assert.equal(pdfSlots[5].textContent, "21:48 - 22:00");
  assert.equal(mockDoc.body.classList.contains("is-customer-mode"), true);
});
