# AJAX HELPER DOKÜMANTASYONU

**Versiyon:** 1.0  
**Tip:** Admin Panel Yardımcı Sınıfı  
**Bağımlılıklar:** jQuery, Bootstrap 4/5, SweetAlert2, Font Awesome

[English Documentation](README.md)

---

## İçindekiler

1. [Kurulum](#kurulum)
2. [Form İşlemleri (data-xhr)](#form-işlemleri)
3. [Tıklama ile Yenileme İşlemleri](#tıklama-ile-yenileme-işlemleri)
4. [Otomatik Yükleme İşlemleri](#otomatik-yükleme-işlemleri)
5. [Modal İşlemleri](#modal-işlemleri)
6. [Toplu İşlemler](#toplu-işlemler)
7. [Diğer Özellikler](#diğer-özellikler)
8. [Callback'ler ve Hook'lar](#callbackler-ve-hooklar)
9. [Özel Eventler](#özel-eventler)
10. [Örnekler](#örnekler)
11. [Sorun Giderme](#sorun-giderme)

---

## Kurulum

### Gereksinimler
- jQuery 3.x
- Bootstrap 4/5 (modal'lar için)
- SweetAlert2 (onay diyalogları için)
- Font Awesome (ikonlar için)
- Sortable.js (opsiyonel, sürükle-bırak için)

### Temel Kurulum
```javascript
// Varsayılan ayarlarla
const ajaxHelper = new AjaxHelper();

// Özel ayarlarla
const ajaxHelper = new AjaxHelper({
    notify: ozelBildirimFonksiyonu,
    csrfToken: 'ozel-token',
    successSound: new Audio('/sounds/basarili.mp3'),
    reloadDelay: 2000,
    afterReload: (target) => console.log('Yenilendi:', target)
});
```

---

## Form İşlemleri

### Temel Kullanım
```html
<form action="/api/kaydet" method="POST" data-xhr>
    <input type="text" name="baslik">
    <button type="submit">Kaydet</button>
</form>
```

### Özellikler

#### `data-xhr`
Form gönderimini Ajax isteğine çevirir

#### `data-callback="fonksiyonAdi"`
Başarı/hata durumunda çağrılacak fonksiyon
```javascript
function benimCallbackim($form, response, type) {
    // type: 'success', 'error', 'loader'
    console.log(response);
}
```

#### `data-loader="true"`
Form gönderilmeden önce callback'i 'loader' type ile çağırır

#### `data-submit-loader="true"`
Submit butonunda spinner gösterir
```html
<button type="submit" data-submit-loader="true">Kaydet</button>
```

#### `data-reload-target="#selector"`
Başarılı durumda belirtilen elementi yeniden yükler

#### `data-reload-url="/ozel/url"`
Yenileme için özel URL (varsayılan: mevcut sayfa)

#### `data-no-reload="true"`
Başarılı durumda sayfayı yeniden yüklemeyi engeller

### Backend Yanıt Formatı
```json
{
    "type": "success|error|warning",
    "title": "Başarılı",
    "message": "İşlem tamamlandı",
    "delay": 1500,
    "copy": "Kopyalanacak içerik (opsiyonel)"
}
```

### İlerleme Eventi
```javascript
document.addEventListener('ajax:progress', (e) => {
    console.log('Yükleme:', e.detail.percent + '%');
});
```

---

## Tıklama ile Yenileme İşlemleri

### Basit Yenileme (Load metodu)
```html
<button 
    data-reload="/api/icerik"
    data-reload-target="#icerik">
    Yenile
</button>

<div id="icerik">...</div>
```

### GET İsteği ile Yenileme
```html
<button 
    data-reload="/api/kullanicilar"
    data-reload-gtarget="#kullanicilar"
    data-target-main=".kullanici-listesi"
    data-max-clicks="5"
    data-loader="off">
    Kullanıcıları Yükle
</button>
```

**Özellikler:**
- `data-reload`: URL
- `data-reload-gtarget`: Hedef selector
- `data-target-main`: Yanıttan alınacak özel selector (opsiyonel)
- `data-max-clicks`: Maksimum tıklama limiti
- `data-loader="off"`: Spinner'ı kapat

### POST İsteği ile Yenileme
```html
<button 
    data-reload="/api/yenile"
    data-reload-ptarget="#icerik"
    data-target-main=".ana-icerik">
    Yenile (POST)
</button>
```

**Not:** POST istekleri otomatik olarak CSRF token içerir

---

## Otomatik Yükleme İşlemleri

Sayfa yüklendiğinde otomatik olarak içerik yükler.

### jQuery Load Metodu
```html
<div 
    data-autoload="/api/dashboard"
    data-reload-target="#dashboard-icerik"
    data-reload-main=".istatistikler"
    data-reload-callback="dashboardYuklendi">
</div>
```

### GET İsteği
```html
<div 
    data-autoload-get="/api/kullanicilar"
    data-reload-target="#kullanicilar"
    data-values='{"durum":"aktif","limit":"20"}'
    data-reload-callback="kullanicilarYuklendi">
</div>

<!-- String format -->
<div 
    data-autoload-get="/api/urunler"
    data-reload-target="#urunler"
    data-values="kategori:elektronik;siralama:fiyat">
</div>
```

### POST İsteği
```html
<div 
    data-autoload-post="/api/veri"
    data-reload-target="#veri"
    data-values='{"kullanici_id":"123"}'
    data-reload-callback="veriYuklendi">
</div>
```

**Callback Örneği:**
```javascript
function dashboardYuklendi($element, response, type) {
    if (type === 'success') {
        console.log('Dashboard yüklendi');
    } else {
        console.error('Hata:', response);
    }
}
```

---

## Modal İşlemleri

### GET Modal
```html
<button 
    data-ajax-modal="/kullanicilar/olustur"
    data-values='{"tip":"admin"}'
    data-class="modal-fullscreen">
    Yeni Kullanıcı
</button>
```

### POST Modal
```html
<button 
    data-ajax-pmodal="/kullanicilar/duzenle"
    data-values="id:123;rol:admin"
    data-class="modal-xl">
    Düzenle
</button>
```

**Modal Özellikleri:**
- Otomatik olarak `#ajaxHelperModal` ID'si kullanır
- `data-class`: Modal'a ek CSS sınıfları
- `data-values`: JSON veya string format parametreler
- POST otomatik olarak CSRF token ekler

**Modal HTML Yanıtı:**
```html
<div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-header">...</div>
        <div class="modal-body">...</div>
    </div>
</div>
```

---

## Toplu İşlemler

### Tümünü Seç
```html
<input type="checkbox" 
    data-bulk-all
    data-target='[name="ids[]"]'>
Tümünü Seç
```

### Toplu İşlem
```html
<button 
    data-bulk-action="/admin/kullanicilar/sil"
    data-target='[name="ids[]"]:checked'
    data-toggle="#toplu-islemler">
    Seçilenleri Sil
</button>

<div id="toplu-islemler" style="display:none">
    <!-- Öğeler seçildiğinde gösterilir -->
</div>
```

**Özellikler:**
- `data-toggle`: Öğeler seçildiğinde gösterilecek element
- Otomatik SweetAlert2 onayı
- Backend'e `ids` array'i gönderir

### Toplu Dışa Aktarma
```html
<button 
    data-bulk-export="/admin/kullanicilar/aktar"
    data-target='[name="ids[]"]:checked'>
    Excel İndir
</button>
```

**Not:** Dosya indirme için POST form oluşturur ve gönderir

---

## Diğer Özellikler

### Ajax Onay
```html
<a href="#" 
    data-ajax-confirm="/api/sil/123"
    data-reload="1500"
    data-ajax-confirm-title="Emin misiniz?"
    data-ajax-confirm-text="Bu işlem geri alınamaz"
    data-ajax-confirm-icon="warning"
    data-ajax-confirm-button="Evet, sil"
    data-ajax-cancel-button="İptal">
    Sil
</a>
```

### Panoya Kopyala
```html
<button data-copy="Bu metin kopyalanacak">
    Kopyala
</button>

<!-- Çoklu satırlar için ; kullan -->
<button data-copy="Satır 1;Satır 2;Satır 3">
    Kopyala
</button>
```

### Ajax Tablar
```html
<ul class="nav nav-tabs">
    <li>
        <a href="/tab1" 
            data-ajax-tab
            data-target="#tab1"
            data-reload="false">
            Tab 1
        </a>
    </li>
</ul>

<div class="tab-content">
    <div id="tab1" class="ajax-tab-pane"></div>
</div>
```

**Özellikler:**
- İlk tıklamada yükler, sonra önbellekten gösterir
- `data-reload="true"`: Her tıklamada yeniden yükle

### Polling (Otomatik Yenileme)
```html
<div 
    data-poll="5000"
    data-url="/api/bildirimler">
    Bildirimler yükleniyor...
</div>
```

**Not:** Milisaniye cinsinden aralık (varsayılan: 5000ms)

### Sortable (Sürükle Bırak)
```html
<ul data-sortable="/api/sirala"
    data-handle=".surukle-handle"
    data-reload-target="#liste"
    data-reload-url="/admin/liste">
    <li data-id="1" class="surukle-handle">Öğe 1</li>
    <li data-id="2" class="surukle-handle">Öğe 2</li>
</ul>
```

**Backend'e gönderilen veri:**
```json
{
    "order": [
        {"id": "1", "position": 1},
        {"id": "2", "position": 2}
    ]
}
```

### Otomatik Kaydetme
```html
<form action="/api/kaydet" method="POST">
    <input type="text" 
        name="baslik" 
        data-autosave>
</form>
```

**Özellikler:**
- 500ms debounce
- Sadece değişen alanı gönderir
- Laravel doğrulama hatalarını gösterir

---

## Callback'ler ve Hook'lar

### Global Hook
```javascript
const ajaxHelper = new AjaxHelper({
    afterReload: (target) => {
        console.log('Yenilendi:', target);
        // Yeni içerikteki bileşenleri yeniden başlat
        initTooltips();
        initDatepickers();
    }
});
```

### Form Callback
```html
<form data-xhr data-callback="formGonderildi">
```

```javascript
function formGonderildi($form, response, type) {
    if (type === 'loader') {
        // Form gönderilmeden önce
        ozelYukleyiciGoster();
    } else if (type === 'success') {
        // Başarılı
        console.log(response);
    } else if (type === 'error') {
        // Hata
        console.error(response);
    }
}
```

**Callback'ten işlemi durdur:**
```javascript
function benimCallbackim($form, response, type) {
    if (birKosul) {
        throw '__stop__'; // İşlemi durdur
    }
}
```

---

## Özel Eventler

### ajax:success
```javascript
document.addEventListener('ajax:success', (e) => {
    console.log('Element:', e.detail.element);
    console.log('Yanıt:', e.detail.response);
    console.log('Form:', e.detail.form); // Eğer form ise
});
```

### ajax:error
```javascript
document.addEventListener('ajax:error', (e) => {
    console.log('Element:', e.detail.element);
    console.log('Hata:', e.detail.error);
});
```

### ajax:progress (Sadece form yüklemeleri)
```javascript
document.addEventListener('ajax:progress', (e) => {
    console.log('Form:', e.detail.form);
    console.log('İlerleme:', e.detail.percent + '%');
});
```

---

## Örnekler

### Örnek 1: CRUD Formu
```html
<form action="/admin/kullanicilar" method="POST" 
    data-xhr
    data-submit-loader="true"
    data-callback="kullaniciKaydedildi">
    
    <input type="text" name="isim" required>
    <input type="email" name="email" required>
    
    <button type="submit">Kaydet</button>
</form>

<script>
function kullaniciKaydedildi($form, res, type) {
    if (type === 'success') {
        $('#kullaniciModal').modal('hide');
        // Listeyi yenile
        $('#kullaniciListesi').load('/admin/kullanicilar #kullaniciListesi > *');
    }
}
</script>
```

### Örnek 2: Toplu Silme
```html
<table>
    <thead>
        <tr>
            <th>
                <input type="checkbox" data-bulk-all>
            </th>
            <th>Kullanıcı</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><input type="checkbox" name="ids[]" value="1"></td>
            <td>Ahmet Yılmaz</td>
        </tr>
        <tr>
            <td><input type="checkbox" name="ids[]" value="2"></td>
            <td>Ayşe Demir</td>
        </tr>
    </tbody>
</table>

<div id="toplu-islemler" style="display:none">
    <button data-bulk-action="/admin/kullanicilar/sil"
            data-toggle="#toplu-islemler">
        Seçilenleri Sil
    </button>
</div>
```

### Örnek 3: Dashboard Otomatik Yükleme
```html
<div class="row">
    <div class="col-md-6" 
        data-autoload-get="/admin/istatistik/satislar"
        data-reload-target="#satis-istatistik"
        data-values='{"donem":"aylik"}'>
        <div id="satis-istatistik">Yükleniyor...</div>
    </div>
    
    <div class="col-md-6"
        data-autoload-post="/admin/istatistik/kullanicilar"
        data-reload-target="#kullanici-istatistik"
        data-reload-callback="istatistikYuklendi">
        <div id="kullanici-istatistik">Yükleniyor...</div>
    </div>
</div>

<script>
function istatistikYuklendi($el, response, type) {
    if (type === 'success') {
        initCharts(); // Chart.js başlat
    }
}
</script>
```

### Örnek 4: Modal CRUD
```html
<!-- Liste -->
<button data-ajax-modal="/admin/kullanicilar/olustur">
    Yeni Kullanıcı
</button>

<button data-ajax-pmodal="/admin/kullanicilar/duzenle"
    data-values='{"id":123}'>
    Düzenle
</button>

<!-- Modal içindeki form -->
<form action="/admin/kullanicilar" method="POST" data-xhr>
    <!-- Form gönderilince modal kapanır ve liste yenilenir -->
</form>
```

---

## Sorun Giderme

### Form gönderimi çalışmıyor
- `data-xhr` özelliğinin varlığını kontrol edin
- Konsolda hata olup olmadığını kontrol edin
- CSRF token'ın doğru olduğunu kontrol edin

### Modal açılmıyor
- Bootstrap JS'nin yüklendiğini kontrol edin
- Yanıt HTML yapısını kontrol edin

### AutoLoad çalışmıyor
- `$(document).ready()` içinde çalışır, DOMContentLoaded'den önce çalışmaz
- URL ve hedef selector'ları kontrol edin

### Callback çalışmıyor
- Fonksiyonun global scope'ta olduğunu kontrol edin
- `window.fonksiyonAdi` ile erişilebilir olup olmadığını test edin

---

## Notlar

1. **CSRF Token:** Tüm POST istekleri otomatik olarak CSRF token içerir
2. **jQuery:** Tüm selector'lar jQuery ile çalışır
3. **Bootstrap Modal:** Modal örnekleri Bootstrap 4/5 ile uyumludur
4. **Hata Yönetimi:** 422 doğrulama hataları otomatik olarak formlarda gösterilir
5. **Performans:** Event delegation kullanır, dinamik elementleri destekler

---

## Kimler İçin?

✅ Laravel ile admin panel geliştiren yazılımcılar  
✅ jQuery + Bootstrap kullanan projeler  
✅ Hızlı prototipleme ve dahili araçlar  
✅ Hızlı düzeltme gerektiren legacy admin sistemleri

❌ Modern SPA uygulamaları (Inertia/Livewire kullanın)  
❌ jQuery'siz projeler  
❌ Müşteriye yönelik production uygulamalar

---

## Lisans

MIT Lisansı - Kişisel ve ticari kullanım için ücretsiz

## Destek

Sorular ve sorunlar için GitHub'da issue açın

---

**Son Güncelleme:** 2025
