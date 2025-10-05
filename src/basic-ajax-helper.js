class AjaxHelper {
    constructor(options = {}) {
        this.notify = options.notify || this.defaultNotify;
        this.csrfToken = options.csrfToken || document.querySelector('[name="_token"]')?.value || document.querySelector('meta[name="csrf-token"]')?.content;
        this.successSound = options.successSound || null;
        this.reloadDelay = options.reloadDelay || 1500;
        this.afterReload = options.afterReload || null;
        this.init();
    }

    init() {
        this.bindClickReload();
        this.bindCopy();
        this.bindForms();
        this.bindClickReloadGet();
        this.bindClickReloadPost();
        this.bindAjaxConfirm();
        this.bindAjaxPModal();
        this.bindBulkActions();
        this.bindBulkExport();
        this.bindAjaxModal();
        this.bindSortable();
        this.bindAjaxTabs();
        this.bindAjaxPolling();
        this.bindAutosave();
        this.bindAutoLoad();
        this.bindAutoLoadGet();
        this.bindAutoLoadPost();
    }
    
    // --- COPY HANDLER ---
    bindCopy() {
        $(document).on('click', '[data-copy]', (e) => {
            const textToCopy = $(e.currentTarget).attr('data-copy');
            this.copyToClipboard(textToCopy);
            this.notify('success', 'Kopyalandı', 'İçerik Kopyalandı');
        });
    }
    copyToClipboard(text) {
        text = text.split(';').join("\n");
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
        } else {
            const tempInput = $('<input>');
            $('body').append(tempInput);
            tempInput.val(text).select();
            try {
                document.execCommand('copy');
            } catch (err) {}
            tempInput.remove();
        }
    }


    // --- FORM HANDLER ---
    bindForms() {
        $(document).on('submit', 'form[data-xhr]', (e) => {
            e.preventDefault();
            const $form = $(e.currentTarget);
            this.handleForm($form, e);
        });
    }

    handleForm($form, e) {
        const url = $form.attr('action');
        const method = $form.attr('method') || 'POST';
        const formData = new FormData($form[0]);
        const callback = $form.data('callback');
        const loader = $form.data('loader');
        const submitLoader = $form.data('submit-loader');
        const reloadTarget = $form.data('reload-target');
        const reloadUrl = $form.data('reload-url') || window.location.href;
        const noReload = $form.data('no-reload');

        let submitter;
        const resetSubmitter = () => {
            if (submitter) {
                submitter.removeData('loading');
                submitter.html(submitter.data('text'));
            }
        };

        if (submitLoader) {
            submitter = $(e.originalEvent.submitter);
            if (!submitter.data('text')) {
                submitter.data('text', submitter.text());
            }
            if (submitter.data('loading')) return;
            submitter.data('loading', 1);
            submitter.html('<i class="fas fa-spinner spin-me" style="font-size: 14px;margin: 0 auto"></i>');
        }

        const call = (res, type = 'success') => {
            if (!callback) return;
            if (typeof callback === 'function') {
                callback($form, res, type);
            } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                window[callback]($form, res, type);
            }
        };

        if (loader) call(null, 'loader');

        $.ajax({
            url,
            type: method.toUpperCase(),
            data: formData,
            processData: false,
            contentType: false,
            xhr: () => {
                let xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", (evt) => {
                    if (evt.lengthComputable) {
                        let percentComplete = (evt.loaded / evt.total) * 100;
                        document.dispatchEvent(new CustomEvent("ajax:progress", {
                            detail: { form: $form, percent: percentComplete }
                        }));
                    }
                }, false);
                return xhr;
            },
            success: (res) => {
                resetSubmitter();
                try {
                    call(res, 'success');
                } catch (err) {
                    if (err === '__stop__') return;
                    throw err;
                }

                if (res.type && res.message) {
                    this.notify(res.type, res?.title, res.message);

                    if (res.copy) this.copyToClipboard(res.copy);

                    if (res.type == 'success') {
                        if (reloadTarget) {
                            $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                if (this.afterReload) this.afterReload(reloadTarget);
                            });
                        } else {
                            if (this.successSound) this.successSound.play();
                            if(!noReload){
                                setTimeout(() => window.location.reload(), res.delay || this.reloadDelay);
                            }
                        }
                    }
                } else {
                    this.notify(res.type, res?.title, res.message);
                }

                document.dispatchEvent(new CustomEvent("ajax:success", {
                    detail: { form: $form, response: res }
                }));
            },
            error: (xhr) => {
                resetSubmitter();
                try {
                    call(xhr, 'error');
                } catch (err) {
                    if (err === '__stop__') return;
                    throw err;
                }
                const msg = xhr.responseJSON?.message || 'İşlem sırasında hata oluştu.';
                this.notify('error', 'Hata', msg);

                document.dispatchEvent(new CustomEvent("ajax:error", {
                    detail: { form: $form, error: xhr }
                }));
            }
        });
    }
    bindClickReloadPost(){
        $(document).on('click', '[data-reload][data-reload-ptarget]', function (e){
            e.preventDefault();
            const $btn = $(this);

            if($btn.attr('clicked')){
                return;
            }
            $btn.attr('clicked', 1);

            const originalHtml = $btn.html();
            $btn.html('<i class="fas fa-spinner spin-me" style="font-size:14px;margin:0 auto"></i>');

            const url = $btn.data('reload');
            const targetSelector = $btn.data('reload-ptarget');
            const targetMain = $btn.data('target-main') || targetSelector;

            // POST için load() desteklemiyor, manuel yapmalıyız
            $.post(url, { _token: this.csrfToken || $('meta[name="csrf-token"]').attr('content') })
                .done(function(response){
                    const tempDiv = $('<div>').html(response);
                    $(targetSelector).html(tempDiv.find(targetMain).html());
                })
                .fail(function(xhr){
                    console.error("Reload POST failed", xhr);
                })
                .always(function(){
                    $btn.html(originalHtml);
                    $btn.removeAttr('clicked');
                });
        });
    }

    bindClickReloadGet() {
        $(document).on('click', '[data-reload][data-reload-gtarget]', function (e) {
            e.preventDefault();
            const $btn = $(this);

            const maxClicks = parseInt($btn.data('max-clicks') || 0);
            let clickCount = parseInt($btn.data('click-count') || 0);
            let disableLoader = $(this).data('loader') == 'off';

            if (maxClicks && clickCount >= maxClicks) {
                return;
            }

            $btn.data('click-count', clickCount + 1);

            if (!$btn.attr('data-old-width')) {
                $btn.attr('data-old-width', $btn.css('width'));
                $btn.css({
                    'width': $btn.attr('data-old-width'),
                    'text-align': 'center'
                });
            }

            if ($btn.attr('clicked')) {
                return;
            }
            $btn.attr('clicked', 1);

            const originalHtml = $btn.html();

            if(!disableLoader){
                $btn.html('<i class="fas fa-spinner spin-me" style="font-size:14px;margin:0 auto"></i>');
            }

            const url = $btn.data('reload');
            const targetSelector = $btn.data('reload-gtarget');
            const targetMain = $btn.data('target-main');
            const tempDiv = $('<div>');

            const resetBtn = () => {
                $btn.html(originalHtml);
                $btn.removeAttr('clicked');
                $btn.removeAttr('data-old-width');
                $btn.css({'width': '', 'text-align': ''});
            };

            if (targetMain) {
                tempDiv.load(url + ' ' + targetMain + ' > *', function(response, status, xhr){
                    if (status === "error") {
                        console.error("Reload GET failed", xhr);
                    } else {
                        $(targetSelector).html($(response));
                    }
                    resetBtn();
                });
            } else {
                tempDiv.load(url + ' ' + targetSelector + ' > *', function(response, status, xhr){
                    if (status === "error") {
                        console.error("Reload GET failed", xhr);
                    } else {
                        $(targetSelector).html(tempDiv.html());
                    }
                    resetBtn();
                });
            }
        });
    }


    // --- CONFIRM HANDLER ---
    bindAjaxConfirm() {
        $(document).on('click', '[data-ajax-confirm]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);
            const url = $el.data('ajax-confirm');
            const reloadAfter = $el.data('reload');

            const title = $el.data('ajax-confirm-title') || 'Emin misiniz?';
            const text = $el.data('ajax-confirm-text') || "Bu işlemi yapmak istediğinize emin misiniz?";
            const icon = $el.data('ajax-confirm-icon') || 'warning';
            const confirm = $el.data('ajax-confirm-button') || 'Evet, devam et';
            const cancel = $el.data('ajax-cancel-button') || 'İptal';

            Swal.fire({
                title,
                text,
                icon,
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: confirm,
                cancelButtonText: cancel
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: url,
                        type: 'POST',
                        data: { _token: this.csrfToken },
                        success: (response) => {
                            if (reloadAfter !== undefined) {
                                setTimeout(() => location.reload(), parseInt(reloadAfter));
                            }
                            Swal.fire({
                                title: response.title || 'Başarılı',
                                text: response.message || '',
                                icon: response.type || 'success',
                            });

                            document.dispatchEvent(new CustomEvent("ajax:success", {
                                detail: { element: $el, response }
                            }));
                        },
                        error: (xhr) => {
                            Swal.fire({
                                title: 'Hata!',
                                text: xhr.responseJSON?.message || 'İşlem başarısız oldu.',
                                icon: 'error',
                            });

                            document.dispatchEvent(new CustomEvent("ajax:error", {
                                detail: { element: $el, error: xhr }
                            }));
                        }
                    });
                }
            });
        });
    }

    // --- AJAX TABS HANDLER ---
    bindAjaxTabs() {
        $(document).on('click', '[data-ajax-tab]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);

            const url = $el.data('url') || $el.attr('href');
            const target = $el.data('target');
            const reload = $el.data('reload') || false;

            if (!url || !target) {
                console.warn('Ajax Tab için url ve target gerekli.');
                return;
            }

            const $target = $(target);

            if ($target.data('loaded') && !reload) {
                $('[data-ajax-tab]').removeClass('active');
                $el.addClass('active');
                $('.ajax-tab-pane').removeClass('active show');
                $target.addClass('active show');
                return;
            }

            // Yükleniyor durumu (fontawesome destekli yapılabilir şimdilik iyi böyle)
            $target.html('<div class="p-3 text-center text-muted">Yükleniyor...</div>');

            $.get(url, (html) => {
                $target.html(html).data('loaded', true);

                $('[data-ajax-tab]').removeClass('active');
                $el.addClass('active');
                $('.ajax-tab-pane').removeClass('active show');
                $target.addClass('active show');

                if (typeof this.afterReload === 'function') {
                    this.afterReload($target);
                }
            }).fail((xhr) => {
                $target.html(
                    `<div class="p-3 text-danger">Tab yüklenemedi: ${xhr.responseJSON?.message || 'Hata'}</div>`
                );
            });
        });
    }

    // --- AJAX POLLING HANDLER ---
    bindAjaxPolling() {
        $('[data-poll]').each((i, el) => {
            const $el = $(el);
            const url = $el.data('url') || $el.attr('href');
            const interval = parseInt($el.data('poll')) || 5000; // ms

            if (!url) {
                console.warn('Polling için url gerekli.');
                return;
            }

            const fetchData = () => {
                $.get(url, (html) => {
                    $el.html(html);
                    if (typeof this.afterReload === 'function') {
                        this.afterReload($el);
                    }
                }).fail((xhr) => {
                    console.error("Polling hatası:", xhr.responseText);
                });
            };

            fetchData();

            setInterval(fetchData, interval);
        });
    }

    // --- BULK EXPORT HANDLER ---
    bindBulkExport() {
        $(document).on('click', '[data-bulk-export]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);
            const url = $el.data('bulk-export');
            const target = $el.data('target') || 'input[name="ids[]"]:checked';

            let ids = [];
            $(target).each(function () {
                ids.push($(this).val());
            });

            if (ids.length === 0) {
                this.notify('warning', 'Uyarı', 'Hiçbir kayıt seçilmedi.');
                return;
            }

            const form = $('<form>', {
                method: 'POST',
                action: url
            });

            form.append($('<input>', {
                type: 'hidden',
                name: '_token',
                value: this.csrfToken
            }));

            ids.forEach(id => {
                form.append($('<input>', {
                    type: 'hidden',
                    name: 'ids[]',
                    value: id
                }));
            });

            $('body').append(form);
            form.submit();
            form.remove();
        });
    }

    // --- BULK ACTION HANDLER ---
    bindBulkActions() {
        function toggle(toggleSelector, ids){
            if (ids.length === 0) {
                $(toggleSelector).hide()
            }else {
                $(toggleSelector).show()
            }
        }
        $('[data-bulk-all]').on('click', function () {
            const $btn = $(this);
            const targetSelector = $btn.data('target') || '[name="ids[]"]';
            const $targets = $(targetSelector);

            if (!$btn.data('originalStates')) {
                const states = $targets.map(function () {
                    return $(this).prop('checked');
                }).get();
                $btn.data('originalStates', states);
            }

            if (!$btn.data('toggled')) {
                $targets.prop('checked', true).trigger('change');
                $btn.data('toggled', true);
            } else {
                const originalStates = $btn.data('originalStates');
                $targets.each(function (i) {
                    $(this).prop('checked', originalStates[i]).trigger('change');
                });
                $btn.data('toggled', false);
            }
        });


        $('[data-bulk-action]').each((_, item) => {
            const toggleSelector = $(item).data('toggle');
            const target = $(item).data('target') || '[name="ids[]"]:checked'
            if(!toggleSelector) return;
            const ids = [];
            $(target).each(function () {
                ids.push($(this).val());
            });

            $(target.replace(':checked', '')).on('change', () => {
                toggle(toggleSelector, $(target))
            })
            toggle(toggleSelector, ids)
        })

        $(document).on('click', '[data-bulk-action]', (e) => {
            e.preventDefault();
            const $btn = $(e.currentTarget);
            const url = $btn.data('bulk-action');
            const target = $btn.data('target') || '[name="ids[]"]:checked';

            const ids = [];
            $(target).each(function () {
                ids.push($(this).val());
            });

            if (ids.length === 0) {
                this.notify('warning', 'Uyarı', 'Herhangi bir kayıt seçilmedi.');
                return;
            }

            Swal.fire({
                title: 'Emin misiniz?',
                text: `${ids.length} kayıt üzerinde işlem yapılacak.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Evet, devam et',
                cancelButtonText: 'İptal'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url,
                        type: 'POST',
                        data: { ids, _token: this.csrfToken },
                        success: (response) => {
                            this.notify(response.type || 'success', response.title || 'Başarılı', response.message || '');
                            if (response.reload) {
                                setTimeout(() => location.reload(), response.reload);
                            }

                            document.dispatchEvent(new CustomEvent("ajax:success", {
                                detail: { element: $btn, response }
                            }));
                        },
                        error: (xhr) => {
                            this.notify('error', 'Hata!', xhr.responseJSON?.message || 'İşlem başarısız oldu.');

                            document.dispatchEvent(new CustomEvent("ajax:error", {
                                detail: { element: $btn, error: xhr }
                            }));
                        }
                    });
                }
            });
        });
    }

    // --- AJAX POST MODAL HANDLER ---
    bindAjaxPModal() {
        $(document).on('click', '[data-ajax-pmodal]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);
            const url = $el.data('ajax-pmodal');

            let values = $el.data('values') || {};
            if (typeof values === "string") {
                try {
                    values = JSON.parse(values);
                } catch {
                    values = values.split(";").reduce((acc, pair) => {
                        let [k, v] = pair.split(":");
                        if (k && v) acc[k.trim()] = v.trim();
                        return acc;
                    }, {});
                }
            }

            values._token = this.csrfToken;

            $.ajax({
                url: url,
                type: 'POST',
                data: values,
                success: (html) => {
                    let $modal = $('#ajaxHelperModal');
                    const newClass = $el.data('class') ?? '';

                    if ($modal.length === 0) {
                        $modal = $(`
                        <div class="modal fade ${newClass}" id="ajaxHelperModal" tabindex="-1">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content"></div>
                            </div>
                        </div>
                    `);
                        $('body').append($modal);
                    } else {
                        const preservedClasses = ['modal', 'fade'];
                        const existingClasses = $modal.attr('class').split(' ').filter(c => preservedClasses.indexOf(c) === -1);
                        if (existingClasses.length > 0) $modal.removeClass(existingClasses.join(' '));
                        if (newClass) $modal.addClass(newClass);
                    }

                    $modal.html(html);
                    $modal.modal('show');
                },
                error: (xhr) => {
                    this.notify('error', 'Hata', xhr.responseJSON?.message || 'Modal yüklenemedi.');
                }
            });
        });
    }


    // --- AJAX MODAL HANDLER ---
    bindAjaxModal() {
        $(document).on('click', '[data-ajax-modal]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);
            const url = $el.data('ajax-modal');

            let values = $el.data('values') || {};
            if (typeof values === "string") {
                try {
                    values = JSON.parse(values);
                } catch {
                    values = values.split(";").reduce((acc, pair) => {
                        let [k, v] = pair.split(":");
                        if (k && v) acc[k.trim()] = v.trim();
                        return acc;
                    }, {});
                }
            }

            $.get(url, values, (html) => {
                let $modal = $('#ajaxHelperModal');
                const newClass = $el.data('class') ?? '';

                    if ($modal.length === 0) {
                        $modal = $(`
                        <div class="modal fade ${newClass}" id="ajaxHelperModal" tabindex="-1">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content"></div>
                            </div>
                        </div>
                    `);
                    $('body').append($modal);
                } else {
                    const preservedClasses = ['modal', 'fade'];
                    const existingClasses = $modal.attr('class').split(' ').filter(c => preservedClasses.indexOf(c) === -1);
                    if (existingClasses.length > 0) $modal.removeClass(existingClasses.join(' '));
                    if (newClass) $modal.addClass(newClass);
                }

                $modal.html(html);
                $modal.modal('show');
            }).fail((xhr) => {
                this.notify('error', 'Hata', xhr.responseJSON?.message || 'Modal yüklenemedi.');
            });
        });
    }

    // --- CLICK RELOAD HANDLER ---
    bindClickReload(){
        $('[data-reload][data-reload-target]').on('click', function (){
            if($(this).attr('clicked')){
                return;
            }
            $(this).attr('clicked', 1)
            $($(this).data('reload-target')).load($(this).data('reload') + " " + $(this).data('reload-target') + " > *", () => {
                $(this).removeAttr('clicked')
            });
        });
    }
    // --- SORTABLE HANDLER ---
    bindSortable() {
        if (typeof Sortable === 'undefined') return;

        document.querySelectorAll('[data-sortable]').forEach(el => {
            Sortable.create(el, {
                handle: el.dataset.handle || null,
                animation: 150,
                onEnd: (evt) => {
                    const order = Array.from(el.querySelectorAll('[data-id]')).map((item, index) => ({
                        id: item.dataset.id,
                        position: index + 1
                    }));

                    $.ajax({
                        url: el.dataset.sortable,
                        method: 'POST',
                        data: { order, _token: this.csrfToken },
                        success: (res) => {
                            this.notify(res.type || 'success', res.title || 'Başarılı', res.message || 'Sıralama güncellendi.');
                            const reloadTarget = el.dataset.reloadTarget;
                            const reloadUrl = el.dataset.reloadUrl || window.location.href;
                            if (reloadTarget) {
                                $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                    if (this.afterReload) this.afterReload(reloadTarget);
                                });
                            }
                        },
                        error: (xhr) => {
                            this.notify('error', 'Hata', xhr.responseJSON?.message || 'Sıralama kaydedilemedi.');
                        }
                    });
                }
            });
        });
    }

    // --- AUTO LOAD GET HANDLER ---
    bindAutoLoadGet() {
        $(document).ready(() => {
            $('[data-autoload-get]').each((_, el) => {
                const $el = $(el);
                const url = $el.data('autoload-get');
                const reloadTarget = $el.data('reload-target');
                const callback = $el.data('reload-callback');

                let values = $el.data('values') || {};
                if (typeof values === "string") {
                    try {
                        values = JSON.parse(values);
                    } catch {
                        values = values.split(";").reduce((acc, pair) => {
                            let [k, v] = pair.split(":");
                            if (k && v) acc[k.trim()] = v.trim();
                            return acc;
                        }, {});
                    }
                }

                if (!url || !reloadTarget) {
                    console.warn('AutoLoadGet için url ve reload-target gerekli.');
                    return;
                }

                const $target = $(reloadTarget);
                const originalHtml = $target.html();
                $target.html('<div class="text-center p-3"><i class="fas fa-spinner spin-me"></i></div>');

                const call = (res, type = 'success') => {
                    if (!callback) return;
                    if (typeof callback === 'function') {
                        callback($el, res, type);
                    } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                        window[callback]($el, res, type);
                    }
                };

                $.get(url, values)
                    .done((response) => {
                        $target.html(response);
                        call(response, 'success');
                        if (typeof this.afterReload === 'function') {
                            this.afterReload(reloadTarget);
                        }
                    })
                    .fail((xhr) => {
                        console.error("AutoLoadGet failed", xhr);
                        $target.html(originalHtml);
                        call(xhr, 'error');
                    });
            });
        });
    }

// --- AUTO LOAD POST HANDLER ---
    bindAutoLoadPost() {
        $(document).ready(() => {
            $('[data-autoload-post]').each((_, el) => {
                const $el = $(el);
                const url = $el.data('autoload-post');
                const reloadTarget = $el.data('reload-target');
                const callback = $el.data('reload-callback');

                let values = $el.data('values') || {};
                if (typeof values === "string") {
                    try {
                        values = JSON.parse(values);
                    } catch {
                        values = values.split(";").reduce((acc, pair) => {
                            let [k, v] = pair.split(":");
                            if (k && v) acc[k.trim()] = v.trim();
                            return acc;
                        }, {});
                    }
                }

                values._token = this.csrfToken;

                if (!url || !reloadTarget) {
                    console.warn('AutoLoadPost için url ve reload-target gerekli.');
                    return;
                }

                const $target = $(reloadTarget);
                const originalHtml = $target.html();
                $target.html('<div class="text-center p-3"><i class="fas fa-spinner spin-me"></i></div>');

                const call = (res, type = 'success') => {
                    if (!callback) return;
                    if (typeof callback === 'function') {
                        callback($el, res, type);
                    } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                        window[callback]($el, res, type);
                    }
                };

                $.post(url, values)
                    .done((response) => {
                        $target.html(response);
                        call(response, 'success');
                        if (typeof this.afterReload === 'function') {
                            this.afterReload(reloadTarget);
                        }
                    })
                    .fail((xhr) => {
                        console.error("AutoLoadPost failed", xhr);
                        $target.html(originalHtml);
                        call(xhr, 'error');
                    });
            });
        });
    }

    // --- AUTO LOAD HANDLER ---
    bindAutoLoad() {
        $(document).ready(() => {
            $('[data-autoload]').each((_, el) => {
                const $el = $(el);
                const url = $el.data('autoload');
                const reloadTarget = $el.data('reload-target');
                const targetMain = $el.data('reload-main') || reloadTarget;
                const callback = $el.data('reload-callback');

                if (!url || !reloadTarget) {
                    console.warn('AutoLoad için url ve reload-target gerekli.');
                    return;
                }

                const $target = $(reloadTarget);
                const originalHtml = $target.html();
                $target.html('<div class="text-center p-3"><i class="fas fa-spinner spin-me"></i></div>');

                const call = (res, type = 'success') => {
                    if (!callback) return;
                    if (typeof callback === 'function') {
                        callback($el, res, type);
                    } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                        window[callback]($el, res, type);
                    }
                };

                const tempDiv = $('<div>');
                tempDiv.load(url + ' ' + targetMain + ' > *', function(response, status, xhr) {
                    if (status === "error") {
                        console.error("AutoLoad failed", xhr);
                        $target.html(originalHtml);
                        call(xhr, 'error');
                    } else {
                        $target.html(tempDiv.html());
                        call(response, 'success');
                        if (typeof this.afterReload === 'function') {
                            this.afterReload(reloadTarget);
                        }
                    }
                }.bind(this));
            });
        });
    }

    // --- AUTOSAVE HANDLER ---
    bindAutosave() {
        let timers = {};
        $(document).on('input change', '[data-autosave]', (e) => {
            const $input = $(e.currentTarget);
            const $form = $input.closest('form');
            const url = $form.attr('action');
            const method = $form.attr('method') || 'POST';
            const fieldName = $input.attr('name');
            const fieldValue = $input.val();

            if (timers[fieldName]) clearTimeout(timers[fieldName]);
            timers[fieldName] = setTimeout(() => {
                const formData = new FormData();
                formData.append(fieldName, fieldValue);
                formData.append('_token', this.csrfToken);

                $.ajax({
                    url,
                    type: method.toUpperCase(),
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: (res) => {
                        this.notify(res.type || 'success', res.title || 'Başarılı', res.message || 'Sıralama güncellendi.');
                        $input.removeClass('is-invalid');
                        $input.next('.invalid-feedback').remove();
                    },
                    error: (xhr) => {
                        if (xhr.status === 422 && xhr.responseJSON?.errors) {
                            let msg = xhr.responseJSON.errors[fieldName]?.[0];
                            if (msg) {
                                $input.addClass('is-invalid');
                                if (!$input.next('.invalid-feedback').length) {
                                    $input.after(`<div class="invalid-feedback">${msg}</div>`);
                                } else {
                                    $input.next('.invalid-feedback').text(msg);
                                }
                            }
                        } else {
                            this.notify('error', 'Hata', 'Değişiklik kaydedilemedi.');
                        }
                    }
                });
            }, 500);
        });
    }

    // --- DEFAULT NOTIFY ---
    defaultNotify(type, title, message) { 
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}
