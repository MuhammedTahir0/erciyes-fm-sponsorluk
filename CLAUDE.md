# CLAUDE.md — Erciyes_FM_Sponsorluk

Echo, Tahir’in düşünme ortağı; net Türkçe, kaynak doğruluğu.
Claude Code: yerel CLI yalnız gerçek çalışma dizini ve proje komut kaynağıyla kullanılır.

## Proje kaynağı

- Açıklama: Erciyes FM Yayın Sponsorluk Sunum Dosyası, Tematik Radyo Program Akışı ve İnteraktif Sponsorluk Teklif/PDF Platformu (Sunucu: Nur KENDİR, Menajer: Bahar ARAZ)
- Teknoloji: HTML5, CSS3, Vanilla JavaScript, Print/PDF Engine
- Başlatan: antigravity; sonraki işte gerçek çalışan ajan kendi attribution’ını verir.
- Komutları mevcut manifest/README/constants ve gerçek workspace üzerinden doğrula; varsayılan npm veya başka stack komutu yok.

## Ortak mühendislik ve yetki

- Önce mevcut kaynakları oku; bilinmeyen veri/API/stack/port uydurma. Örnek gerçek karar değildir.
- Clean cutover: bütün etkilenen caller'ları taşı, obsolete kodu kaldır; küçük diff eksik teslim izni değildir.
- Teknoloji seçimi kaynağı: `C:/Users/tahir/Documents/TahirOS/🧠 500-Knowledge/Decisions/ADR-0005_Rust_Python_ve_Hibrit_Teknoloji_Secim_Prensipleri.md`. CPU-bound CAD/CAM/nesting/geometri ve Python runtime gerektirmeyen bağımsız Windows `.exe` dağıtımı: Rust; hafif masaüstü: Tauri (Rust + React/TS); CRUD/web API/dinamik iş mantığı: Python (FastAPI); AI orkestrasyonu ve ofis/Excel/PDF: Python (FastAPI zorunlu değil); web UI: React/TS + Tailwind (ADR-0002). Python'da ölçülmüş hesaplama darboğazı: PyO3/Maturin. Basit script/CRUD için Rust zorlama; çalışan Python'u yalnız dil değiştirmek için taşıma; somut performans/bellek/dağıtım gerekçesi şarttır. Rust kalite kapısı: `cargo check`, `cargo clippy -- -D warnings`, `cargo test`.
- Değişen yolu gerçek smoke ve ilgili mevcut testle doğrula; kanıtsız tamamlandı yok.
- Notes yalnız büyük mimari kararda; backlog yalnız gerçek görev/kabul için; constants yalnız seçilmiş config için. Mevcut işte scaffold başlatma.
- Gerçek çalışan ajan/harness attribution'ını kullan. Anlamlı sonuçta TahirOS beyin skill'iyle kaynaklı sync/receipt; Last-Session yerinde, Previous korunur, Journal yalnız yeni öğrenimde. no-memory/no-tools önceliklidir.
- Özel kimlik/hesap için mevcut şifre, 10 dakika kilit ve sıfır-ifşa kapısı; formda eksik veri boş, site/alan/veri/submit izni olmadan paylaşma.
- CAD resmi ölçü/geometri; LEGRABOX'ta yalnız ray içi temsili. UI'da brief/yöntem onayı, erişilebilirlik ve reduced-motion korunur; mevcut onayı yeniden sorma.
- Primary mevcut kullanıcı/repo/yayın kapsamında doğrulanmış geliştirmeyi commit/push eder. Child companion yazamaz, izinsiz push/remote yapamaz; eski görev onayı yeni yetki değildir.
- AGY yalnız açık talepte, tek worker ve kota/servis fallback'iyle; Laya predict/shortlist/preset ve Anything2Explainer için açık onay. Yeni model/servis/credential yetkisi açma.
- Üç ajan dosyasında ortak kuralları anlamca eşdeğer tut; istemci adaptör farklarını koru.

## Göreve bağlı araçlar

Headroom global wrap/proxy kapalı; reddedilmiş pilotu yeniden çalıştırma. Yeni akış açık opt-in + ayrı kayıpsız kabul ister, orijinal girdi korunur. Graft yalnız kurulu indeksli kod discovery/impact; indeks dışı docs/configte hedefli fallback. CodeBurn yalnız yerel kullanım/maliyet denetiminde; Ponytail YAGNI/reuse ve en küçük tam çözümde. Ölçülmemiş tasarruf/koruma garantisi yok.
