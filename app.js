/**
 * Erciyes FM — Yayın Sponsorluk Sunumu & Canlı Teklif Motoru
 * Bağımsız İstemci Çekirdeği (Browser DOM + Node Test Uyumlu)
 */
(function (root) {
  "use strict";

  const CONTACT_PHONE_DISPLAY = "0539 735 22 80";
  const CONTACT_WHATSAPP_NUMBER = "905397352280";
  const DEFAULT_SLOT_PLACEHOLDER = "......... - .........";
  const DEFAULT_JINGLE_PLACEHOLDER = ".................";
  const DEFAULT_HOURS_PLACEHOLDER = "............... - ...............";
  const MAX_COVER_PHOTO_BYTES = 5 * 1024 * 1024;

  const PACKAGES = Object.freeze({
    bronz: Object.freeze({
      id: "bronz",
      name: "Bronz Sponsorluk",
      badge: "BRONZ PAKET",
      price: "15.000 TL",
    }),
    gumus: Object.freeze({
      id: "gumus",
      name: "Gümüş Sponsorluk",
      badge: "GÜMÜŞ PAKET",
      price: "25.000 TL",
    }),
    altin: Object.freeze({
      id: "altin",
      name: "Altın Sponsorluk",
      badge: "ALTIN PAKET",
      price: "30.000 TL",
    }),
    ozel: Object.freeze({
      id: "ozel",
      name: "Özel Kampanya & Etkinlik Sponsorluğu",
      badge: "ÖZEL KAMPANYA",
      price: "Teklife Özel",
    }),
  });

  const SCHEDULE_SEGMENTS = Object.freeze([
    Object.freeze({ id: "acilis", title: "Açılış & Jingle", weight: 10 }),
    Object.freeze({ id: "tema", title: "Günün Teması & Müzik", weight: 25 }),
    Object.freeze({ id: "sponsor", title: "Sponsor Kuşağı", weight: 15 }),
    Object.freeze({ id: "dinleyici", title: "Dinleyici Köşesi", weight: 25 }),
    Object.freeze({ id: "siir", title: "Günün Notu & Şiir", weight: 15 }),
    Object.freeze({ id: "kapanis", title: "Kapanış & Teşekkür", weight: 10 }),
  ]);

  /** Metni güvenli şekilde kırpıp tek satıra normalize eder. */
  function cleanText(value, maxLength) {
    const str = typeof value === "string" ? value : "";
    const collapsed = str.replace(/\s+/g, " ").trim();
    return maxLength && collapsed.length > maxLength
      ? collapsed.slice(0, maxLength).trim()
      : collapsed;
  }

  /** Dakikayı HH:MM biçimine çevirir (gece yarısını aşan yayınları 24 saate sarar). */
  function formatMinutes(totalMinutes) {
    const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  }

  /**
   * "18:00 - 20:00" veya "19.00–21.00" biçimindeki yayın saatlerini çözümler.
   * Geçersiz aralıkta null döner.
   */
  function parseTimeRange(raw) {
    const cleaned = cleanText(raw, 40);
    if (!cleaned) return null;
    const match = cleaned.match(
      /^(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})$/
    );
    if (!match) return null;

    const startH = Number(match[1]);
    const startM = Number(match[2]);
    const endH = Number(match[3]);
    const endM = Number(match[4]);

    if (
      startH < 0 || startH > 23 || endH < 0 || endH > 23 ||
      startM < 0 || startM > 59 || endM < 0 || endM > 59
    ) {
      return null;
    }

    const startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) {
      endMinutes += 1440;
    }

    const duration = endMinutes - startMinutes;
    if (duration < 6) return null;

    return {
      startMinutes,
      endMinutes,
      duration,
      formattedRange: `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`,
    };
  }

  /** Geçerli saat aralığını 6 program kuşağına ağırlıklı ve kesintisiz dağıtır. */
  function distributeScheduleSlots(rangeStr) {
    const parsed = parseTimeRange(rangeStr);
    if (!parsed) {
      return SCHEDULE_SEGMENTS.map(() => DEFAULT_SLOT_PLACEHOLDER);
    }

    const slots = [];
    let current = parsed.startMinutes;
    let accumulatedWeight = 0;

    for (let i = 0; i < SCHEDULE_SEGMENTS.length; i += 1) {
      accumulatedWeight += SCHEDULE_SEGMENTS[i].weight;
      const nextBoundary =
        i === SCHEDULE_SEGMENTS.length - 1
          ? parsed.endMinutes
          : Math.round(parsed.startMinutes + (parsed.duration * accumulatedWeight) / 100);
      slots.push(`${formatMinutes(current)} - ${formatMinutes(nextBoundary)}`);
      current = nextBoundary;
    }

    return slots;
  }

  function formatOpeningQuote(sponsorName) {
    const brand = cleanText(sponsorName, 100) || DEFAULT_JINGLE_PLACEHOLDER;
    return `“${brand} ile Akşam Kuşağı Başlıyor”`;
  }

  function formatOpeningJingleDetail(sponsorName) {
    return `Program açılışı, günün selamlanması ve ${formatOpeningQuote(sponsorName)} sponsorlu jingle.`;
  }

  function formatHoursDisplay(broadcastHours) {
    const cleaned = cleanText(broadcastHours, 40);
    return cleaned || DEFAULT_HOURS_PLACEHOLDER;
  }

  function buildWhatsAppMessage(state, overridePackageId) {
    const pkgId =
      overridePackageId && PACKAGES[overridePackageId]
        ? overridePackageId
        : state && state.packageId && PACKAGES[state.packageId]
          ? state.packageId
          : "";
    const pkg = pkgId ? PACKAGES[pkgId] : null;
    const sponsor = cleanText(state && state.sponsorName, 100);
    const hours = cleanText(state && state.broadcastHours, 40);

    const parts = [
      "Merhaba Emine Hanım, Erciyes FM (Sunucu: Nur Kandır) yayın sponsorluğu hakkında bilgi ve teklif görüşmesi talep ediyorum.",
    ];
    if (sponsor) parts.push(`Firma / Marka: ${sponsor}`);
    if (pkg) {
      parts.push(
        pkg.id === "ozel"
          ? `İlgilenilen Seçenek: ${pkg.name}`
          : `İlgilenilen Paket: ${pkg.name} (${pkg.price})`
      );
    }
    if (hours) parts.push(`Planlanan Yayın Saatleri: ${hours}`);

    return parts.join("\n");
  }

  function buildWhatsAppUrl(state, overridePackageId) {
    const text = buildWhatsAppMessage(state, overridePackageId);
    return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function createDefaultState() {
    return {
      sponsorName: "",
      broadcastHours: "",
      packageId: "",
      slots: SCHEDULE_SEGMENTS.map(() => DEFAULT_SLOT_PLACEHOLDER),
      slotsCustomized: false,
      view: "vitrin",
      customerMode: false,
      editorUnlocked: false,
      coverPhotoUrl: "",
    };
  }

  /** URL query string'den başlangıç durumunu çözer. */
  function parseStateFromSearch(searchStr) {
    const state = createDefaultState();
    const params = new URLSearchParams(searchStr || "");

    const firma = cleanText(params.get("firma"), 100);
    if (firma) state.sponsorName = firma;

    const saat = cleanText(params.get("saat"), 40);
    if (saat) {
      state.broadcastHours = saat;
      state.slots = distributeScheduleSlots(saat);
    }

    const paket = cleanText(params.get("paket"), 20).toLowerCase();
    if (PACKAGES[paket]) state.packageId = paket;

    const gorunum = cleanText(params.get("gorunum"), 20).toLowerCase();
    if (gorunum === "sunum" || gorunum === "vitrin") state.view = gorunum;

    if (params.get("musteri") === "1") state.customerMode = true;

    let hasCustomSlots = false;
    for (let i = 0; i < SCHEDULE_SEGMENTS.length; i += 1) {
      const slotVal = cleanText(params.get(`slot${i}`), 30);
      if (slotVal) {
        state.slots[i] = slotVal;
        hasCustomSlots = true;
      }
    }
    state.slotsCustomized = hasCustomSlots;

    return state;
  }

  /** Durumdan paylaşılabilir URL üretir. */
  function buildShareUrl(baseHref, state, options) {
    const opts = options || {};
    const url = new URL(baseHref || "https://erciyesfm-sponsorluk.local/");
    const params = new URLSearchParams();

    const sponsor = cleanText(state.sponsorName, 100);
    const hours = cleanText(state.broadcastHours, 40);

    if (sponsor) params.set("firma", sponsor);
    if (hours) params.set("saat", hours);
    if (state.packageId && PACKAGES[state.packageId]) params.set("paket", state.packageId);
    if (state.view === "sunum") params.set("gorunum", "sunum");

    const autoSlots = distributeScheduleSlots(hours);
    for (let i = 0; i < SCHEDULE_SEGMENTS.length; i += 1) {
      const slot = cleanText(state.slots[i], 30);
      if (slot && slot !== autoSlots[i] && slot !== DEFAULT_SLOT_PLACEHOLDER) {
        params.set(`slot${i}`, slot);
      }
    }

    const includeCustomer =
      typeof opts.customerMode === "boolean" ? opts.customerMode : true;
    if (includeCustomer) params.set("musteri", "1");

    const qs = params.toString();
    return `${url.origin}${url.pathname}${qs ? "?" + qs : ""}`;
  }

  /** Tüm DOM yüzeylerini tek bir doğruluk kaynağından günceller (yalnız textContent/güvenli öznitelikler). */
  function renderState(doc, win, state) {
    if (!doc) return;

    const body = doc.body;
    body.setAttribute("data-view", state.view);
    body.classList.toggle("is-customer-mode", Boolean(state.customerMode));
    body.classList.toggle("is-editor-unlocked", Boolean(state.editorUnlocked));

    // Sekmeler
    const tabVitrin = doc.getElementById("tabVitrin");
    const tabSunum = doc.getElementById("tabSunum");
    if (tabVitrin && tabSunum) {
      const isVitrin = state.view === "vitrin";
      tabVitrin.classList.toggle("is-active", isVitrin);
      tabVitrin.setAttribute("aria-selected", String(isVitrin));
      tabSunum.classList.toggle("is-active", !isVitrin);
      tabSunum.setAttribute("aria-selected", String(!isVitrin));
    }

    // Müşteri şeridi & düzenleyici açma düğmesi
    const customerBanner = doc.getElementById("customerBanner");
    const btnToggleEditor = doc.getElementById("btnToggleEditorInCustomer");
    const customerSummary = doc.getElementById("customerBannerSummary");
    if (customerBanner) {
      customerBanner.classList.toggle("is-hidden", !state.customerMode);
    }
    if (btnToggleEditor) {
      btnToggleEditor.classList.toggle("is-hidden", !state.customerMode);
      btnToggleEditor.setAttribute("aria-expanded", String(Boolean(state.editorUnlocked)));
      btnToggleEditor.textContent = state.editorUnlocked ? "Özelleştiriciyi Gizle" : "Sunumu Özelleştir";
    }

    const sponsor = cleanText(state.sponsorName, 100);
    const hours = cleanText(state.broadcastHours, 40);
    const pkg = state.packageId ? PACKAGES[state.packageId] : null;

    if (customerSummary) {
      const bits = [];
      if (sponsor) bits.push(`${sponsor} için hazırlanmış sponsorluk sunumu`);
      else bits.push("Erciyes FM Yayın Sponsorluk Sunum Dosyası");
      if (pkg) bits.push(`${pkg.name}${pkg.id === "ozel" ? "" : " (" + pkg.price + ")"}`);
      if (hours) bits.push(`Yayın: ${hours}`);
      customerSummary.textContent = bits.join(" · ");
    }

    // Hero marka karşılaması
    const heroGreeting = doc.getElementById("heroSponsorGreeting");
    const heroSponsorName = doc.getElementById("heroSponsorName");
    if (heroGreeting && heroSponsorName) {
      heroGreeting.classList.toggle("is-hidden", !sponsor);
      heroSponsorName.textContent = sponsor || "—";
    }

    // Sayfa 1 PDF Sponsor Markası
    const pdfSponsorBrand = doc.getElementById("pdfSponsorBrand");
    if (pdfSponsorBrand) {
      pdfSponsorBrand.textContent = sponsor;
      pdfSponsorBrand.classList.toggle("is-placeholder", !sponsor);
    }

    // Sayfa 3 + Vitrin Yayın Saatleri ve Açılış Jingle
    const hoursText = formatHoursDisplay(hours);
    const pdfHoursEl = doc.getElementById("pdfBroadcastHours");
    const vitrinHoursEl = doc.getElementById("vitrinHoursPill");
    if (pdfHoursEl) pdfHoursEl.textContent = hoursText;
    if (vitrinHoursEl) vitrinHoursEl.textContent = `Yayın Saatleri: ${hoursText}`;

    const jingleDetail = formatOpeningJingleDetail(sponsor);
    const openingQuote = formatOpeningQuote(sponsor);
    const pdfJingleEl = doc.getElementById("pdfOpeningJingle");
    const vitrinJingleEl = doc.querySelector("[data-jingle-cell]");
    const cueOpeningEl = doc.getElementById("cueOpeningText");
    const cueMidEl = doc.getElementById("cueMidText");
    const cueClosingEl = doc.getElementById("cueClosingText");
    if (pdfJingleEl) pdfJingleEl.textContent = jingleDetail;
    if (vitrinJingleEl) vitrinJingleEl.textContent = jingleDetail;
    if (cueOpeningEl) cueOpeningEl.textContent = openingQuote;
    if (cueMidEl) {
      cueMidEl.textContent = sponsor
        ? `Yayın boyunca saat başı canlı olarak “${sponsor}” zikredilir ve Sponsor Kuşağı kapsamında haftalık fırsatlarınız öncelikli anons edilir.`
        : "Yayın boyunca saat başı canlı anons ve Sponsor Kuşağı kapsamında haftalık fırsatlarınız, duyurularınız ve kurumsal tanıtım spotunuz öncelikli olarak paylaşılır.";
    }
    if (cueClosingEl) {
      cueClosingEl.textContent = sponsor
        ? `Yarının yayın duyurusu, “${sponsor}” canlı sponsorluk teşekkürü ve jingle ile kapanış yapılır.`
        : "Yarının yayın duyurusu, canlı sponsorluk teşekkürü ve kapanış jingle’ı ile program tamamlanır.";
    }

    const cuePackageLabel = doc.getElementById("cuePackageLabel");
    if (cuePackageLabel) {
      cuePackageLabel.textContent = pkg
        ? pkg.id === "ozel"
          ? pkg.name
          : `${pkg.name} (${pkg.price})`
        : "Genel Sponsorluk Sunumu";
    }

    // Program Akışı Satır Saatleri (Vitrin + Sayfa 3 PDF)
    for (let i = 0; i < SCHEDULE_SEGMENTS.length; i += 1) {
      const slotValue = cleanText(state.slots[i], 30) || DEFAULT_SLOT_PLACEHOLDER;
      const inputEl = doc.querySelector(`[data-slot-input="${i}"]`);
      if (inputEl && doc.activeElement !== inputEl) {
        inputEl.value = slotValue;
      }
      const pdfSlotEl = doc.querySelector(`[data-pdf-slot="${i}"]`);
      if (pdfSlotEl) {
        pdfSlotEl.textContent = slotValue;
      }
    }

    // Paket Seçim Vurgusu (Vitrin + Sayfa 2 PDF + Select)
    const selectPkg = doc.getElementById("selectPackage");
    if (selectPkg && selectPkg.value !== state.packageId) {
      selectPkg.value = state.packageId;
    }

    doc.querySelectorAll("[data-package-card]").forEach((card) => {
      const cardId = card.getAttribute("data-package-card");
      card.classList.toggle("is-selected", cardId === state.packageId && Boolean(state.packageId));
    });

    doc.querySelectorAll("[data-select-package]").forEach((btn) => {
      const btnId = btn.getAttribute("data-select-package");
      const isSelected = btnId === state.packageId && Boolean(state.packageId);
      btn.setAttribute("aria-pressed", String(isSelected));
      if (btnId === "ozel") {
        btn.textContent = isSelected ? "Özel Kampanya Seçildi" : "Özel Kampanyayı Seç";
      } else {
        btn.textContent = isSelected ? "Seçili Paket" : "Paketi Seç";
      }
    });

    doc.querySelectorAll("[data-pdf-package]").forEach((row) => {
      const rowId = row.getAttribute("data-pdf-package");
      row.classList.toggle("is-selected", rowId === state.packageId && Boolean(state.packageId));
    });

    // WhatsApp Bağlantıları
    const generalWaUrl = buildWhatsAppUrl(state);
    ["heroWaLink", "footerWaLink", "customerBannerWa"].forEach((id) => {
      const el = doc.getElementById(id);
      if (el) el.setAttribute("href", generalWaUrl);
    });
    doc.querySelectorAll("[data-wa-package]").forEach((anchor) => {
      const pid = anchor.getAttribute("data-wa-package");
      anchor.setAttribute("href", buildWhatsAppUrl(state, pid));
    });

    const footerWaSummary = doc.getElementById("footerWaSummary");
    if (footerWaSummary) {
      const selectedSummary = [sponsor, pkg ? pkg.name : "", hours].filter(Boolean).join(" · ");
      footerWaSummary.textContent = selectedSummary
        ? `Hazır teklif bağlamı (${selectedSummary}) ile doğrudan Menajer Emine Işık ile WhatsApp üzerinden iletişime geçin.`
        : "Seçili sponsorluk bilgileriyle doğrudan Menajer Emine Işık ile WhatsApp üzerinden iletişime geçin.";
    }

    // Kapak Stüdyo Görseli (Varsayılan SVG veya Yüklenen Görsel)
    const hasCustomCover = Boolean(state.coverPhotoUrl && state.coverPhotoUrl.startsWith("data:image/"));
    doc.querySelectorAll("[data-cover-frame]").forEach((frame) => {
      const svgEl = frame.querySelector(".studio-svg-art");
      const imgEl = frame.querySelector("[data-custom-cover-img]");
      if (svgEl) svgEl.classList.toggle("is-hidden", hasCustomCover);
      if (imgEl) {
        imgEl.classList.toggle("is-hidden", !hasCustomCover);
        if (hasCustomCover) {
          imgEl.setAttribute("src", state.coverPhotoUrl);
        } else {
          imgEl.removeAttribute("src");
        }
      }
    });

    const btnResetCover = doc.getElementById("btnResetCoverPhoto");
    const coverStatus = doc.getElementById("coverPhotoStatus");
    if (btnResetCover) btnResetCover.classList.toggle("is-hidden", !hasCustomCover);
    if (coverStatus) {
      coverStatus.textContent = hasCustomCover
        ? "Özel yüklenen kapak görseli hem vitrinde hem Sayfa 1'de aktif."
        : "Varsayılan \"ON AIR\" stüdyo görseli aktif.";
    }

    // Paylaşılabilir Link Önizlemesi & Adres Çubuğu Senkronu
    const baseHref = win && win.location ? win.location.href : "https://erciyesfm-sponsorluk.local/";
    const shareUrl = buildShareUrl(baseHref, state, { customerMode: true });
    const sharePreviewEl = doc.getElementById("shareUrlPreview");
    if (sharePreviewEl) sharePreviewEl.textContent = shareUrl;

    const btnCustomerPreview = doc.getElementById("btnToggleCustomerPreview");
    if (btnCustomerPreview) {
      btnCustomerPreview.textContent = state.customerMode
        ? "Editör Görünümüne Dön"
        : "Müşteri Görünümünü Dene";
    }
  }

  function syncBrowserUrl(win, state) {
    if (!win || !win.history || !win.location) return;
    try {
      const nextUrl = buildShareUrl(win.location.href, state, {
        customerMode: state.customerMode,
      });
      win.history.replaceState(null, "", nextUrl);
    } catch (_err) {
      // file:// veya kısıtlı ortamlarda sessizce geç
    }
  }

  function showFeedback(doc, message) {
    const feedback = doc.getElementById("toolbarFeedback");
    if (!feedback) return;
    feedback.textContent = message;
  }

  async function copyShareUrlToClipboard(doc, win, state) {
    const baseHref = win && win.location ? win.location.href : "https://erciyesfm-sponsorluk.local/";
    const shareUrl = buildShareUrl(baseHref, state, { customerMode: true });

    if (win && win.navigator && win.navigator.clipboard && win.navigator.clipboard.writeText) {
      try {
        await win.navigator.clipboard.writeText(shareUrl);
        showFeedback(doc, "Müşteriye özel sunum bağlantısı panoya kopyalandı.");
        return shareUrl;
      } catch (_err) {
        // Fallback aşağıda
      }
    }

    const tempInput = doc.createElement("textarea");
    tempInput.value = shareUrl;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.left = "-9999px";
    doc.body.appendChild(tempInput);
    tempInput.select();
    try {
      doc.execCommand("copy");
      showFeedback(doc, "Müşteriye özel sunum bağlantısı panoya kopyalandı.");
    } catch (_err) {
      showFeedback(doc, `Bağlantı hazır: ${shareUrl}`);
    } finally {
      doc.body.removeChild(tempInput);
    }
    return shareUrl;
  }

  function initApp(doc, win) {
    const targetDoc = doc || (typeof document !== "undefined" ? document : null);
    const targetWin = win || (typeof window !== "undefined" ? window : null);
    if (!targetDoc) return null;

    const search = targetWin && targetWin.location ? targetWin.location.search : "";
    let state = parseStateFromSearch(search);

    const inputSponsor = targetDoc.getElementById("inputSponsorName");
    const inputHours = targetDoc.getElementById("inputBroadcastHours");
    const selectPkg = targetDoc.getElementById("selectPackage");
    const inputCoverPhoto = targetDoc.getElementById("inputCoverPhoto");

    if (inputSponsor) inputSponsor.value = state.sponsorName;
    if (inputHours) inputHours.value = state.broadcastHours;
    if (selectPkg) selectPkg.value = state.packageId;

    const commit = (shouldSyncUrl) => {
      renderState(targetDoc, targetWin, state);
      if (shouldSyncUrl !== false) {
        syncBrowserUrl(targetWin, state);
      }
    };

    if (inputSponsor) {
      inputSponsor.addEventListener("input", () => {
        state.sponsorName = inputSponsor.value;
        commit();
      });
    }

    if (inputHours) {
      inputHours.addEventListener("input", () => {
        state.broadcastHours = inputHours.value;
        if (!state.slotsCustomized) {
          state.slots = distributeScheduleSlots(state.broadcastHours);
        }
        commit();
      });
    }

    const btnDistributeHours = targetDoc.getElementById("btnDistributeHours");
    if (btnDistributeHours) {
      btnDistributeHours.addEventListener("click", () => {
        const parsed = parseTimeRange(state.broadcastHours);
        if (!parsed) {
          showFeedback(targetDoc, "Lütfen geçerli bir yayın saati aralığı girin (örnek: 18:00 - 20:00).");
          if (inputHours) inputHours.focus();
          return;
        }
        state.broadcastHours = parsed.formattedRange;
        if (inputHours) inputHours.value = parsed.formattedRange;
        state.slotsCustomized = false;
        state.slots = distributeScheduleSlots(parsed.formattedRange);
        showFeedback(targetDoc, `${parsed.formattedRange} aralığı 6 yayın kuşağına otomatik dağıtıldı.`);
        commit();
      });
    }

    targetDoc.querySelectorAll("[data-slot-input]").forEach((slotInput) => {
      const idx = Number(slotInput.getAttribute("data-slot-input"));
      slotInput.addEventListener("input", () => {
        state.slots[idx] = slotInput.value || DEFAULT_SLOT_PLACEHOLDER;
        state.slotsCustomized = true;
        commit();
      });
    });

    if (selectPkg) {
      selectPkg.addEventListener("change", () => {
        state.packageId = PACKAGES[selectPkg.value] ? selectPkg.value : "";
        commit();
      });
    }

    targetDoc.querySelectorAll("[data-select-package]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-select-package");
        state.packageId = state.packageId === pid ? "" : pid;
        showFeedback(
          targetDoc,
          state.packageId
            ? `${PACKAGES[state.packageId].name} teklif kapsamına seçildi.`
            : "Paket seçimi temizlendi."
        );
        commit();
      });
    });

    targetDoc.querySelectorAll("[data-switch-view]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const nextView = tab.getAttribute("data-switch-view");
        if (nextView === "vitrin" || nextView === "sunum") {
          state.view = nextView;
          commit();
        }
      });
    });

    const btnHeroPreviewPdf = targetDoc.getElementById("btnHeroPreviewPdf");
    if (btnHeroPreviewPdf) {
      btnHeroPreviewPdf.addEventListener("click", () => {
        state.view = "sunum";
        commit();
        if (targetWin && typeof targetWin.scrollTo === "function") {
          targetWin.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    ["btnPrintPdf", "btnPrintFromCustomizer", "btnFooterPrintPdf"].forEach((id) => {
      const btn = targetDoc.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          if (targetWin && typeof targetWin.print === "function") {
            targetWin.print();
          }
        });
      }
    });

    ["btnCopyShareLink", "btnCopyShareLinkInline"].forEach((id) => {
      const btn = targetDoc.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          copyShareUrlToClipboard(targetDoc, targetWin, state);
        });
      }
    });

    const btnToggleCustomerPreview = targetDoc.getElementById("btnToggleCustomerPreview");
    if (btnToggleCustomerPreview) {
      btnToggleCustomerPreview.addEventListener("click", () => {
        state.customerMode = !state.customerMode;
        state.editorUnlocked = false;
        showFeedback(
          targetDoc,
          state.customerMode
            ? "Müşteri görünümü aktif. Müşterinin göreceği sadeleştirilmiş ekran açık."
            : "Editör görünümüne dönüldü."
        );
        commit();
      });
    }

    const btnToggleEditorInCustomer = targetDoc.getElementById("btnToggleEditorInCustomer");
    if (btnToggleEditorInCustomer) {
      btnToggleEditorInCustomer.addEventListener("click", () => {
        state.editorUnlocked = !state.editorUnlocked;
        commit(false);
      });
    }

    const btnResetCustomizations = targetDoc.getElementById("btnResetCustomizations");
    if (btnResetCustomizations) {
      btnResetCustomizations.addEventListener("click", () => {
        state = createDefaultState();
        if (inputSponsor) inputSponsor.value = "";
        if (inputHours) inputHours.value = "";
        if (selectPkg) selectPkg.value = "";
        if (inputCoverPhoto) inputCoverPhoto.value = "";
        showFeedback(targetDoc, "Tüm özelleştirme alanları varsayılan sunum şablonuna sıfırlandı.");
        commit();
      });
    }

    if (inputCoverPhoto && typeof FileReader !== "undefined") {
      inputCoverPhoto.addEventListener("change", () => {
        const file = inputCoverPhoto.files && inputCoverPhoto.files[0];
        if (!file) return;
        if (!file.type || !file.type.startsWith("image/")) {
          showFeedback(targetDoc, "Lütfen yalnızca resim dosyası (JPG, PNG, WebP) seçin.");
          return;
        }
        if (file.size > MAX_COVER_PHOTO_BYTES) {
          showFeedback(targetDoc, "Kapak görseli en fazla 5 MB boyutunda olabilir.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          if (result.startsWith("data:image/")) {
            state.coverPhotoUrl = result;
            showFeedback(targetDoc, "Özel stüdyo kapak görseli güncellendi.");
            commit(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const btnResetCoverPhoto = targetDoc.getElementById("btnResetCoverPhoto");
    if (btnResetCoverPhoto) {
      btnResetCoverPhoto.addEventListener("click", () => {
        state.coverPhotoUrl = "";
        if (inputCoverPhoto) inputCoverPhoto.value = "";
        showFeedback(targetDoc, "Varsayılan \"ON AIR\" stüdyo görseline dönüldü.");
        commit(false);
      });
    }

    renderState(targetDoc, targetWin, state);
    return {
      getState: () => ({ ...state, slots: [...state.slots] }),
    };
  }

  const ErciyesSponsorlukCore = {
    CONTACT_PHONE_DISPLAY,
    CONTACT_WHATSAPP_NUMBER,
    DEFAULT_SLOT_PLACEHOLDER,
    DEFAULT_JINGLE_PLACEHOLDER,
    DEFAULT_HOURS_PLACEHOLDER,
    PACKAGES,
    SCHEDULE_SEGMENTS,
    cleanText,
    formatMinutes,
    parseTimeRange,
    distributeScheduleSlots,
    formatOpeningQuote,
    formatOpeningJingleDetail,
    formatHoursDisplay,
    buildWhatsAppMessage,
    buildWhatsAppUrl,
    createDefaultState,
    parseStateFromSearch,
    buildShareUrl,
    renderState,
    initApp,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ErciyesSponsorlukCore;
  } else {
    root.ErciyesSponsorlukCore = ErciyesSponsorlukCore;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initApp(document, window));
    } else {
      initApp(document, window);
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
