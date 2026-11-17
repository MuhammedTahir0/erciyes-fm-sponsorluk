# Erciyes FM — Yayın Sponsorluk Sunum Dosyası ve Teklif Platformu

Erciyes FM (**Kayseri ve İç Anadolu**) akşam kuşağı yayını için hazırlanmış, hem modern interaktif sponsorluk vitrini hem de birebir 3 sayfalık kişiselleştirilebilir A4 sunum/PDF üreticisi olarak çalışan bağımsız web platformu.

## Künye ve İletişim
- **Radyo:** Erciyes FM (`www.erciyesfm.com.tr`)
- **Yayın Bölgesi:** Kayseri ve İç Anadolu (`%85+ Bölgesel Erişim`, `100.000+ Günlük Dinleyici`, `20-55 Hedef Yaş Aralığı`)
- **Sunucu / Yayıncı:** Nur Kendir
- **Menajer:** Emine Işık (`0539 735 22 80`)

## Özellikler
- **İnteraktif Vitrin & 3 Sayfalık Resmi Sunum Modu:** Üst sekmeden anında tam ekran web vitrin ile birebir 3 sayfalık sunum önizlemesi arasında geçiş yapılır.
- **Canlı Firma ve Saat Özelleştirici:** `Sponsor Markası` girildiğinde kapak sayfası, hafta içi açılış jingle’ı (`“... ile Akşam Kuşağı Başlıyor”`), canlı anons simülatörü ve WhatsApp mesajı eşzamanlı güncellenir.
- **Akıllı Saat Dağıtımı:** `18:00 - 20:00` gibi bir yayın saati aralığı tek tıkla 6 program kuşağına (`Açılış & Jingle`, `Günün Teması & Müzik`, `Sponsor Kuşağı`, `Dinleyici Köşesi`, `Günün Notu & Şiir`, `Kapanış & Teşekkür`) orantılı dağıtılır; her satır ayrıca manuel düzenlenebilir.
- **Paylaşılabilir Müşteri Linki (`?musteri=1`):** `?firma=...&saat=...&paket=...&musteri=1` parametreleriyle her reklamveren adayı için sadeleştirilmiş kişiselleştirilmiş link üretilir.
- **Özel Kapak Görseli Yükleme:** Varsayılan vektörel "ON AIR" stüdyo görseli yerine istenirse özel bir stüdyo fotoğrafı kapakta ve PDF Sayfa 1'de kullanılabilir.
- **Tek Tuşla 3 Sayfalık A4 PDF Çıktısı:** `@media print` kurallarıyla tam 3 sayfa (`Page 1 of 3` – `Page 3 of 3`) olarak yazdırılır veya PDF olarak kaydedilir.

## Sponsorluk Paketleri
| Paket | Öne Çıkan İçerik | Birim Fiyat |
| :--- | :--- | ---: |
| **Bronz Sponsorluk** | Program başı/ortası/sonu reklam geçişleri, reklam giriş-çıkışlarında özel bahsedilme | **15.000 TL** |
| **Gümüş Sponsorluk** | Standart reklam kuşakları, yayında özel konuk alımı | **25.000 TL** |
| **Altın Sponsorluk** | Saat başı ve 30 dk'da bir düzenli reklam, her hafta sonu özel konuk alımı, esnek program saati | **30.000 TL** |
| **Özel Kampanya & Etkinlik** | Açılış, festival ve dönemsel kampanyalarda canlı yayın aracı ile yerinden yayın ve özel konuk alımı | **Teklife Özel** |

## Yerel Çalıştırma ve Test
```powershell
# Birim ve DOM mantığı testleri
node --test tests/sponsorluk.test.mjs

# Yerel önizleme sunucusu (Port: 8785)
python -m http.server 8785 --bind 127.0.0.1
```
Tarayıcıda `http://127.0.0.1:8785/` adresini açın.
