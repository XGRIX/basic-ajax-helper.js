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
        this.bindConfirmSubmit();
        this.bindDynamicShow();
        this.bindClickReload();
        this.bindCopy();
        this.bindForms();
        this.bindTableSort();
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
        this.bindClickRequest();
        this.bindSwalRequest();
        this.bindSwalInputRequest();
        this.bindInlineEdit();
        this.bindFilePreview();
        this.bindCounterAnimation();
        this.bindDoubleClickProtection();
    }
    // --- DYNAMIC SHOW/HIDE HANDLER ---

    // data-show-on="status:active" - status=active olduğunda göster
    // data-hide-on="user_type:guest" - user_type=guest olduğunda gizle
    // data-show-on="category:electronics,clothing" - electronics VEYA clothing
    // data-show-on="age:>=18;city:istanbul" - age>=18 VE city=istanbul (AND)
    // data-show-on="vip:yes|purchase:>1000" - vip=yes VEYA purchase>1000 (OR)
    // data-show-on="status:!pending" - status pending değilse
    // data-show-on="email:!empty" - email dolu ise
    // data-show-on="terms:checked" - checkbox işaretli ise
    // data-show-effect="fade" | "slide" | "show" - animasyon türü
    // data-duration="300" - animasyon süresi (ms)
    // data-on-show="console.log('Gösterildi');" - inline JS
    // data-on-hide="alert('Gizlendi');" - inline JS
    // data-callback="myFunction" - her durumda callback
    // data-on-show-callback="showHandler" - sadece gösterildiğinde
    // data-on-hide-callback="hideHandler" - sadece gizlendiğinde
    // data-trigger-click-on-show="#btn" - gösterilince butona tıkla
    // data-focus-on-show="first" | "#inputId" - inputa focus yap
    // data-load-url="/api/content" - ajax ile içerik yükle
    // data-load-once="true" - sadece bir kez yükle
    // data-after-load="callback" - ajax sonrası callback
    // data-scroll-to="true" - elemente kaydır
    // data-scroll-offset="100" - scroll offset (px)
    checkVisibilityDynamicShow(){
        const self = this;
        $('[data-show-on], [data-hide-on]').each(function() {
            self.checkVisibility($(this));
        });
    }
    bindDynamicShow() {
        const self = this;
        this.checkVisibilityDynamicShow();
        $(document).on('change input', 'select, input[type="radio"], input[type="checkbox"], input[type="text"], input[type="number"], input[type="email"], textarea', function(ev) {
            const $input = $(this);
            const inputName = $input.attr('name');
            const inputId = $input.attr('id');

            if (inputName) {
                $('[data-show-on], [data-hide-on]').each(function() {
                    const showOn = $(this).data('show-on') || '';
                    const hideOn = $(this).data('hide-on') || '';

                    if (showOn.includes(inputName) || hideOn.includes(inputName)) {
                        self.checkVisibility($(this), ev);
                    }
                });
            }

            if (inputId) {
                $('[data-show-on], [data-hide-on]').each(function() {
                    const showOn = $(this).data('show-on') || '';
                    const hideOn = $(this).data('hide-on') || '';

                    if (showOn.includes(inputId) || hideOn.includes(inputId)) {
                        self.checkVisibility($(this), ev);
                    }
                });
            }
        });
    }

    checkVisibility($element, event) {
        const showOn = $element.data('show-on');
        const hideOn = $element.data('hide-on');
        const showEffect = $element.data('show-effect') || 'show';
        const duration = parseInt($element.data('duration') || 300);

        let shouldShow = true;

        if (showOn) {
            shouldShow = this.evaluateCondition(showOn);
        }

        if (hideOn) {
            const shouldHide = this.evaluateCondition(hideOn);
            if (shouldHide) shouldShow = false;
        }

        this.toggleElement($element, shouldShow, showEffect, duration, event);
    }

    evaluateCondition(condition) {
        const orConditions = condition.split('|');

        for (let orCond of orConditions) {
            orCond = orCond.trim();

            const andConditions = orCond.split(';');
            let allAndTrue = true;

            for (let andCond of andConditions) {
                andCond = andCond.trim();
                if (!andCond) continue;

                if (!this.evaluateSingleCondition(andCond)) {
                    allAndTrue = false;
                    break;
                }
            }

            if (allAndTrue) return true;
        }

        return false;
    }

    evaluateSingleCondition(condition) {
        const colonIndex = condition.indexOf(':');
        if (colonIndex === -1) return false;

        const selector = condition.substring(0, colonIndex).trim();
        const expectedValue = condition.substring(colonIndex + 1).trim();

        if (!selector || !expectedValue) return false;

        let $input = $(`[name="${selector}"]`);
        if ($input.length === 0) {
            $input = $(`#${selector}`);
        }

        if ($input.length === 0) return false;

        if (expectedValue === 'change'){
            return true;
        }

        if (expectedValue === 'checked') {
            return $input.is(':checked');
        }

        if (expectedValue === 'empty') {
            const val = this.getInputValue($input);
            return !val || val.trim() === '';
        }

        if (expectedValue === '!empty') {
            const val = this.getInputValue($input);
            return val && val.trim() !== '';
        }

        const currentValue = this.getInputValue($input);

        if (expectedValue.startsWith('!') && expectedValue.length > 1 && expectedValue[1] !== 'e') {
            const notValue = expectedValue.substring(1);
            const values = notValue.split(',').map(v => v.trim());
            return !values.includes(currentValue);
        }

        if (expectedValue.startsWith('>=')) {
            const compareValue = parseFloat(expectedValue.substring(2).trim());
            const numValue = parseFloat(currentValue);
            return !isNaN(numValue) && !isNaN(compareValue) && numValue >= compareValue;
        }

        if (expectedValue.startsWith('<=')) {
            const compareValue = parseFloat(expectedValue.substring(2).trim());
            const numValue = parseFloat(currentValue);
            return !isNaN(numValue) && !isNaN(compareValue) && numValue <= compareValue;
        }

        if (expectedValue.startsWith('>')) {
            const compareValue = parseFloat(expectedValue.substring(1).trim());
            const numValue = parseFloat(currentValue);
            return !isNaN(numValue) && !isNaN(compareValue) && numValue > compareValue;
        }

        if (expectedValue.startsWith('<')) {
            const compareValue = parseFloat(expectedValue.substring(1).trim());
            const numValue = parseFloat(currentValue);
            return !isNaN(numValue) && !isNaN(compareValue) && numValue < compareValue;
        }

        const values = expectedValue.split(',').map(v => v.trim());
        return values.includes(currentValue);
    }

    getInputValue($input) {
        if ($input.length === 0) return '';

        const type = $input.attr('type');

        if (type === 'checkbox') {
            return $input.is(':checked') ? $input.val() : '';
        } else if (type === 'radio') {
            const name = $input.attr('name');
            return $(`[name="${name}"]:checked`).val() || '';
        } else {
            return $input.val() || '';
        }
    }

    toggleElement($element, show, effect, duration, event) {
        const isVisible = $element.is(':visible');
        const callbackType = $element.data('callback-type');

        if (show && !isVisible) {
            switch (effect) {
                case 'fade':
                    $element.fadeIn(duration);
                    break;
                case 'slide':
                    $element.slideDown(duration);
                    break;
                default:
                    $element.show(duration);
            }

            $element.find('input, select, textarea').prop('disabled', false);

            this.executeCallbacks($element, 'show');

            document.dispatchEvent(new CustomEvent("dynamic:show", {
                detail: { element: $element }
            }));

        } else if (!show && isVisible) {
            switch (effect) {
                case 'fade':
                    $element.fadeOut(duration);
                    break;
                case 'slide':
                    $element.slideUp(duration);
                    break;
                default:
                    $element.hide(duration);
            }

            $element.find('input, select, textarea').prop('disabled', true);

            this.executeCallbacks($element, 'hide');

            // Custom event
            document.dispatchEvent(new CustomEvent("dynamic:hide", {
                detail: { element: $element }
            }));
        }else if (callbackType === 'change' && event.type === 'change'){
            this.executeCallbacks($element, 'show');
        }
    }

    executeCallbacks($element, action) {
        const inlineJs = action === 'show'
            ? $element.data('on-show')
            : $element.data('on-hide');

        if (inlineJs) {
            try {
                const fn = new Function('element', '$element', inlineJs);
                fn($element[0], $element);
            } catch (error) {
                console.error(`Inline JS hatası (${action}):`, error, inlineJs);
            }
        }

        const callback = $element.data('callback');
        if (callback) {
            try {
                if (typeof callback === 'function') {
                    callback($element, action);
                } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                    window[callback]($element, action);
                }
            } catch (error) {
                console.error(`Callback hatası (${action}):`, error);
            }
        }

        const specificCallback = action === 'show'
            ? $element.data('on-show-callback')
            : $element.data('on-hide-callback');

        if (specificCallback) {
            try {
                if (typeof specificCallback === 'function') {
                    specificCallback($element);
                } else if (typeof specificCallback === 'string' && typeof window[specificCallback] === 'function') {
                    window[specificCallback]($element);
                }
            } catch (error) {
                console.error(`Specific callback hatası (${action}):`, error);
            }
        }

        const triggerClick = action === 'show'
            ? $element.data('trigger-click-on-show')
            : $element.data('trigger-click-on-hide');

        if (triggerClick) {
            setTimeout(() => {
                $(triggerClick).trigger('click');
            }, 50);
        }

        if (action === 'show') {
            const focusSelector = $element.data('focus-on-show');
            if (focusSelector) {
                setTimeout(() => {
                    const $focusTarget = focusSelector === 'first'
                        ? $element.find('input, select, textarea').first()
                        : $(focusSelector);

                    if ($focusTarget.length) {
                        $focusTarget.focus();
                    }
                }, duration + 50);
            }
        }

        if (action === 'show') {
            const loadUrl = $element.data('load-url');
            const loadOnce = $element.data('load-once') !== false;

            if (loadUrl && (!loadOnce || !$element.data('loaded'))) {
                const loadTarget = $element.data('load-target') || $element;
                const $target = loadTarget === $element ? $element : $(loadTarget);

                $target.html('<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>');

                $.get(loadUrl)
                    .done((html) => {
                        $target.html(html);
                        $element.data('loaded', true);

                        const afterLoad = $element.data('after-load');
                        if (afterLoad && typeof window[afterLoad] === 'function') {
                            window[afterLoad]($target, html);
                        }
                    })
                    .fail((xhr) => {
                        $target.html('<div class="text-danger p-3">Yükleme hatası: ' + (xhr.responseJSON?.message || 'Bilinmeyen hata') + '</div>');
                    });
            }
        }

        if (action === 'show') {
            const scrollTo = $element.data('scroll-to');
            if (scrollTo) {
                setTimeout(() => {
                    const offset = parseInt($element.data('scroll-offset') || 0);
                    $('html, body').animate({
                        scrollTop: $element.offset().top - offset
                    }, 300);
                }, duration + 50);
            }
        }
    }

    // 1. CLASS TOGGLE (show/hide yerine class ekle/çıkar)
    // data-toggle-class="active:user_type:premium"
    // data-add-class="bg-success:status:approved"
    // data-remove-class="d-none:product:available"

    bindClassToggle() {
        const self = this;

        $('[data-toggle-class], [data-add-class], [data-remove-class]').each(function() {
            self.checkClassToggle($(this));
        });

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-toggle-class], [data-add-class], [data-remove-class]').each(function() {
                    const attrs = [
                        $(this).data('toggle-class'),
                        $(this).data('add-class'),
                        $(this).data('remove-class')
                    ].join(' ');

                    if (attrs.includes(inputName)) {
                        self.checkClassToggle($(this));
                    }
                });
            }
        });
    }

    checkClassToggle($element) {
        // Format: "className:selector:value"
        const toggleClass = $element.data('toggle-class');
        const addClass = $element.data('add-class');
        const removeClass = $element.data('remove-class');

        if (toggleClass) {
            const [className, selector, value] = toggleClass.split(':');
            if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                $element.toggleClass(className);
            }
        }

        if (addClass) {
            const [className, selector, value] = addClass.split(':');
            if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                $element.addClass(className);
            } else {
                $element.removeClass(className);
            }
        }

        if (removeClass) {
            const [className, selector, value] = removeClass.split(':');
            if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                $element.removeClass(className);
            } else {
                $element.addClass(className);
            }
        }
    }

// 2. ATTRIBUTE TOGGLE (disabled, readonly, required vb.)
// data-attr-toggle="disabled:stock:out"
// data-attr-toggle="required:payment:card"

    bindAttributeToggle() {
        const self = this;

        $('[data-attr-toggle]').each(function() {
            self.checkAttributeToggle($(this));
        });

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-attr-toggle]').each(function() {
                    const attr = $(this).data('attr-toggle') || '';
                    if (attr.includes(inputName)) {
                        self.checkAttributeToggle($(this));
                    }
                });
            }
        });
    }

    checkAttributeToggle($element) {
        // Format: "attribute:selector:value" veya "attribute:selector:value|attribute2:selector2:value2"
        const attrToggle = $element.data('attr-toggle');
        if (!attrToggle) return;

        const toggles = attrToggle.split('|');

        toggles.forEach(toggle => {
            const [attribute, selector, value] = toggle.split(':');

            if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                $element.attr(attribute, attribute);
                $element.prop(attribute, true);
            } else {
                $element.removeAttr(attribute);
                $element.prop(attribute, false);
            }
        });
    }

    // 3. TEXT SWAP (Metni koşula göre değiştir)
    // data-text-swap="Açık:status:open|Kapalı:status:closed"

    bindTextSwap() {
        const self = this;

        $('[data-text-swap]').each(function() {
            const $el = $(this);
            if (!$el.data('original-text')) {
                $el.data('original-text', $el.text());
            }
            self.checkTextSwap($el);
        });

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-text-swap]').each(function() {
                    const swap = $(this).data('text-swap') || '';
                    if (swap.includes(inputName)) {
                        self.checkTextSwap($(this));
                    }
                });
            }
        });
    }

    checkTextSwap($element) {
        // Format: "Text1:selector:value|Text2:selector:value2"
        const textSwap = $element.data('text-swap');
        if (!textSwap) return;

        const swaps = textSwap.split('|');
        let matched = false;

        for (let swap of swaps) {
            const parts = swap.split(':');
            if (parts.length >= 3) {
                const text = parts[0];
                const selector = parts[1];
                const value = parts.slice(2).join(':');

                if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                    $element.text(text);
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            $element.text($element.data('original-text'));
        }
    }

    // 4. VALUE COPY (Bir inputtan diğerine değer kopyala)
    // data-copy-from="source_input:trigger_input:value"

    bindValueCopy() {
        const self = this;

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-copy-from]').each(function() {
                    const copyConfig = $(this).data('copy-from') || '';
                    if (copyConfig.includes(inputName)) {
                        self.checkValueCopy($(this));
                    }
                });
            }
        });
    }

    checkValueCopy($element) {
        // Format: "sourceInput:triggerInput:value"
        const copyFrom = $element.data('copy-from');
        if (!copyFrom) return;

        const [sourceInput, triggerInput, triggerValue] = copyFrom.split(':');

        if (this.evaluateSingleCondition(`${triggerInput}:${triggerValue}`)) {
            const $source = $(`[name="${sourceInput}"]`);
            const value = this.getInputValue($source);
            $element.val(value).trigger('change');
        }
    }

// 5. FORM SECTION MANAGER (Bölüm numaralandırma)
// data-section="1:status:pending"
// data-section="2:status:approved"

    bindSectionManager() {
        const self = this;

        $('[data-section]').each(function() {
            self.checkSection($(this));
        });

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-section]').each(function() {
                    const section = $(this).data('section') || '';
                    if (section.includes(inputName)) {
                        self.checkSection($(this));
                    }
                });
            }
        });
    }

    checkSection($element) {
        // Format: "sectionNumber:selector:value"
        const sectionConfig = $element.data('section');
        if (!sectionConfig) return;

        const [sectionNum, selector, value] = sectionConfig.split(':');
        const shouldShow = this.evaluateSingleCondition(`${selector}:${value}`);

        if (shouldShow) {
            $element.show().find('input, select, textarea').prop('disabled', false);

            // Önceki bölümleri göster
            for (let i = 1; i < parseInt(sectionNum); i++) {
                $(`[data-section^="${i}:"]`).show().find('input, select, textarea').prop('disabled', false);
            }

            // Sonraki bölümleri gizle
            $(`[data-section]`).each(function() {
                const otherSection = parseInt($(this).data('section').split(':')[0]);
                if (otherSection > parseInt(sectionNum)) {
                    $(this).hide().find('input, select, textarea').prop('disabled', true);
                }
            });
        } else {
            $element.hide().find('input, select, textarea').prop('disabled', true);
        }
    }

// 6. LOAD REMOTE CONTENT (Ajax ile içerik yükle)
// data-load-on="url:/api/details:status:approved"

    bindRemoteLoad() {
        const self = this;

        $(document).on('change', 'select, input[type="radio"], input[type="checkbox"]', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-load-on]').each(function() {
                    const loadConfig = $(this).data('load-on') || '';
                    if (loadConfig.includes(inputName)) {
                        self.checkRemoteLoad($(this));
                    }
                });
            }
        });
    }

    checkRemoteLoad($element) {
        // Format: "url:selector:value"
        const loadConfig = $element.data('load-on');
        if (!loadConfig) return;

        const [url, selector, value] = loadConfig.split(':');

        if (this.evaluateSingleCondition(`${selector}:${value}`)) {
            if ($element.data('loaded')) return;

            $element.html('<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i></div>');

            $.get(url).done((html) => {
                $element.html(html).data('loaded', true);
            }).fail(() => {
                $element.html('<div class="text-danger">Yükleme hatası</div>');
            });
        }
    }

// 7. COUNTER (Gösterime göre sayaç)
// data-counter-target="#total:status:approved"

    bindCounter() {
        const self = this;

        $(document).on('change', 'select, input[type="radio"], input[type="checkbox"]', function() {
            self.updateAllCounters();
        });

        this.updateAllCounters();
    }

    updateAllCounters() {
        $('[data-counter-target]').each((_, el) => {
            const $counter = $(el);
            const config = $counter.data('counter-target');
            const [targetSelector, selector, value] = config.split(':');

            let count = 0;
            $(targetSelector).each((_, item) => {
                const $item = $(item);
                if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                    if ($item.is(':visible')) count++;
                }
            });

            $counter.text(count);
        });
    }

    // 8. VALIDATION TOGGLE (Validasyonu aktif/pasif et)
    // data-validate-on="status:active"

    bindValidationToggle() {
        const self = this;

        $(document).on('change input', 'select, input', function() {
            const $input = $(this);
            const inputName = $input.attr('name');

            if (inputName) {
                $('[data-validate-on]').each(function() {
                    const validateConfig = $(this).data('validate-on') || '';
                    if (validateConfig.includes(inputName)) {
                        self.checkValidation($(this));
                    }
                });
            }
        });
    }

    checkValidation($element) {
        const validateConfig = $element.data('validate-on');
        if (!validateConfig) return;

        const [selector, value] = validateConfig.split(':');

        if (this.evaluateSingleCondition(`${selector}:${value}`)) {
            $element.attr('required', 'required');
            $element.closest('.form-group, .mb-3').find('label').append(' <span class="text-danger">*</span>');
        } else {
            $element.removeAttr('required');
            $element.closest('.form-group, .mb-3').find('label .text-danger').remove();
        }
    }

// 9. MULTI-STEP WIZARD
// data-step="1" data-next-on="agree:checked"
// data-step="2" data-prev-step="1"

    bindWizard() {
        const self = this;

        // Sadece 1. adımı göster
        $('[data-step]').not('[data-step="1"]').hide();

        $(document).on('click', '[data-next-step]', function(e) {
            e.preventDefault();
            const currentStep = $(this).data('next-step');
            const nextOn = $(this).data('next-on');

            if (nextOn && !self.evaluateSingleCondition(nextOn)) {
                self.notify('warning', 'Uyarı', 'Lütfen gerekli alanları doldurun');
                return;
            }

            $(`[data-step="${currentStep}"]`).fadeOut(300, function() {
                $(`[data-step="${currentStep + 1}"]`).fadeIn(300);
            });
        });

        $(document).on('click', '[data-prev-step]', function(e) {
            e.preventDefault();
            const currentStep = $(this).data('prev-step');

            $(`[data-step="${currentStep + 1}"]`).fadeOut(300, function() {
                $(`[data-step="${currentStep}"]`).fadeIn(300);
            });
        });
    }

    bindPriceCalculator() {
        const self = this;

        $(document).on('change input', 'select, input', function() {
            $('[data-price-calc]').each(function() {
                self.calculatePrice($(this));
            });
        });

        $('[data-price-calc]').each(function() {
            self.calculatePrice($(this));
        });
    }

    calculatePrice($element) {
        const priceConfig = $element.data('price-calc');
        const target = $element.data('price-target');
        if (!priceConfig || !target) return;

        let total = 0;
        const rules = priceConfig.split('|');

        rules.forEach(rule => {
            const parts = rule.split(':');
            const type = parts[0];
            const amount = parseFloat(parts[1]);

            if (type === 'base') {
                total += amount;
            } else if (parts.length >= 4) {
                const selector = parts[2];
                const value = parts[3];

                if (this.evaluateSingleCondition(`${selector}:${value}`)) {
                    total += amount;
                }
            }
        });

        $(target).text(total.toFixed(2));
    }

    // INIT içine eklenmesi gerekenler:
        /*
        init() {
            this.bindClassToggle();
            this.bindAttributeToggle();
            this.bindTextSwap();
            this.bindValueCopy();
            this.bindSectionManager();
            this.bindRemoteLoad();
            this.bindCounter();
            this.bindValidationToggle();
            this.bindWizard();
            this.bindPriceCalculator();
        }
        */

    // --- COPY HANDLER ---
    bindCopy() {
        $(document).on('click', '[data-copy]', (e) => {
            const textToCopy = $(e.currentTarget).attr('data-copy');
            this.copyToClipboard(textToCopy);
            this.notify('success', 'Kopyalandı', 'İçerik Kopyalandı');
        });
    }

    bindDoubleClickProtection() {
        const protectedButtons = {};

        $(document).on('click', '[data-prevent-double-click]', function(e) {
            const $btn = $(this);
            const btnId = $btn.attr('id') || 'btn_' + Math.random();
            const timeout = parseInt($btn.data('prevent-double-click')) || 3000;

            if (protectedButtons[btnId]) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            protectedButtons[btnId] = true;

            setTimeout(() => {
                $btn.prop('disabled', true);
            }, 10);

            setTimeout(() => {
                delete protectedButtons[btnId];
                $btn.prop('disabled', false);
            }, timeout);
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

    bindFilePreview() {
        $(document).on('change', '[data-file-preview]', function() {
            const $input = $(this);
            const targetSelector = $input.data('file-preview');
            const $target = $(targetSelector);
            const file = this.files[0];

            if (!file) {
                $target.html('');
                return;
            }

            const fileType = file.type;
            const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB

            if (fileType.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    $target.html(`
                    <div class="text-center">
                        <img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px;">
                        <p class="small text-muted mt-2">${file.name} (${fileSize} MB)</p>
                    </div>
                `);
                };
                reader.readAsDataURL(file);
            } else {
                $target.html(`
                <div class="alert alert-info">
                    <i class="fas fa-file"></i> ${file.name} (${fileSize} MB)
                </div>
            `);
            }
        });
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
        const callback_success = $form.data('call');
        const loader = $form.data('loader');
        const submitLoader = $form.data('submit-loader');
        const reloadTarget = $form.data('reload-target');
        const reloadUrl = $form.data('reload-url') || window.location.href;
        const noReload = $form.data('no-reload');
        const relodDelay = $form.data('delay');

        const silent = $form.data('silent') == 'on';
        if (silent){
            window.notyf_alert_silent = true;
        }

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

        const callsuccess = (res) => {
            if (!callback) return;
            if (typeof callback === 'function') {
                callback($form, res);
            } else if (typeof callback === 'string' && typeof window[callback] === 'function') {
                window[callback]($form, res);
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

                    if (res.href){
                        setTimeout(() => window.location.href = res.href, res.delay || relodDelay || this.reloadDelay);
                    }

                    if (res.type == 'success') {
                        if ($form.data('after-hide')) {
                            $('.modal.show').each(function() {
                                $(this).modal('hide');
                            });
                        }

                        if (reloadTarget) {
                            $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                if (this.afterReload) this.afterReload(reloadTarget);
                                callsuccess(res);
                            });
                        } else {
                            if (this.successSound) this.successSound.play();
                            if(!noReload){
                                setTimeout(() => window.location.reload(), res.delay || relodDelay || this.reloadDelay);
                            }
                            callsuccess(res);
                        }
                    }else {
                        callsuccess(res);
                    }
                } else {
                    this.notify(res.type, res?.title, res.message);
                }

                document.dispatchEvent(new CustomEvent("ajax:success", {
                    detail: { form: $form, response: res }
                }));
            },
            error: (xhr) => {
                if ($form.data('after-hide')) {
                    $('.modal.show').each(function() {
                        $(this).modal('hide');
                    });
                }
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

    bindCounterAnimation() {
        const animateCounter = ($el) => {
            const target = parseInt($el.data('counter'));
            const duration = parseInt($el.data('duration') || 1000);
            const start = parseInt($el.text()) || 0;
            const increment = (target - start) / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                    $el.text(target);
                    clearInterval(timer);
                } else {
                    $el.text(Math.floor(current));
                }
            }, 16);
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !$(entry.target).data('animated')) {
                        $(entry.target).data('animated', true);
                        animateCounter($(entry.target));
                    }
                });
            });

            $('[data-counter]').each(function() {
                observer.observe(this);
            });
        } else {
            $('[data-counter]').each(function() {
                animateCounter($(this));
            });
        }
    }

    bindClickRequest() {
        const self = this;
        $(document).on('click', '[data-request-with-url]',  function (e) {
            e.preventDefault();
            const $btn = $(this);

            if ($btn.attr('disabled') || $btn.hasClass('processing')) {
                return;
            }

            const url = $btn.data('request-with-url');
            const method = $btn.data('method') || 'POST';
            const disableLoader = $btn.data('loader') == 'off';
            const reloadTarget = $btn.data('reload-target');
            const reloadUrl = $btn.data('reload-url') || window.location.href;

            const notfy_type = $btn.data('notify-type');
            const notfy_message = $btn.data('notify-message');

            const originalHtml = $btn.html();

            $btn.addClass('processing');
            $btn.prop('disabled', true);

            if (!disableLoader) {
                $btn.html('<i class="fas fa-spinner spin-me" style="font-size:14px;margin:0 auto"></i>');
            }

            if (notfy_message) {
                self.notify(notfy_type || 'info', '', notfy_message);
            }

            const resetBtn = () => {
                $btn.html(originalHtml);
                $btn.removeClass('processing');
                $btn.prop('disabled', false);
                $btn.removeAttr('clicked');
                $btn.removeAttr('data-old-width');
                $btn.css({ 'width': '', 'text-align': '' });
            };

            let values = $btn.data('values') || {};
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

            values._token = self.csrfToken || $('meta[name="csrf-token"]').attr('content');

            const fileAttr = $btn.data('file-input');
            let isFileUpload = false;
            let formData;

            if (fileAttr) {
                isFileUpload = true;
                const [inputSelector, name] = fileAttr.split(',');
                const input = document.querySelector(inputSelector);
                if (!input || !input.files.length) {
                    self.notify('error', '', "Dosya seçilmedi!");
                    resetBtn();
                    return;
                }

                formData = new FormData();
                formData.append(name, input.files[0]);

                for (const k in values) {
                    formData.append(k, values[k]);
                }
            }

            $.ajax({
                url: url,
                type: method,
                data: isFileUpload ? formData : values,
                processData: !isFileUpload,
                contentType: isFileUpload ? false : 'application/x-www-form-urlencoded',
                success: function(data, status, xhr) {
                    let res = data;
                    if (typeof res === 'string') {
                        try {
                            res = JSON.parse(res);
                        } catch(e) {
                            console.error("JSON parse error", e);
                            resetBtn();
                            return;
                        }
                    }
                    if (res.html) {
                        let $modal = $('#ajaxBindHelperModal');
                        const newClass = $btn.data('class') ?? '';

                        if ($modal.length === 0){
                            $modal = $(`
                            <div class="modal fade ${newClass}" id="ajaxBindHelperModal" tabindex="-1">
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

                        $modal.html(res.html);
                        $modal.modal('show');
                        resetBtn();
                        return;
                    }

                    if (res.type && res.message) {
                        self.notify(res.type, res.title || 'Başarılı', res.message);
                    }

                    if (res.iframe_url) {
                        $('#download_file_with_iframe').remove();
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.id = 'download_file_with_iframe';
                        iframe.src = res.iframe_url;
                        document.body.appendChild(iframe);
                        resetBtn();
                    } else if(res.url){
                        setTimeout(() => {
                            window.location.assign(res.url)
                            resetBtn();
                        }, res.delay ?? 0)
                    } else {
                        if (reloadTarget) {
                            $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                if (typeof self.afterReload == 'function') {
                                    self.afterReload(reloadTarget);
                                }
                                resetBtn();
                            });
                        } else {
                            resetBtn();
                            if (typeof self.afterReload == 'function') {
                                self.afterReload();
                            }
                        }
                    }
                },
                error: function(xhr) {
                    try {
                        let res = JSON.parse(xhr.responseText);
                        if (res.type && res.message) {
                            self.notify(res.type, res.title || 'Hata', res.message);
                        }
                        if (res.url) {
                            window.location.href = res.url;
                        }
                    } catch (e) {
                        console.error("Error parsing error response", e);
                        self.notify('error', 'Hata', 'Bir hata oluştu');
                    }
                    resetBtn();
                }
            });
        });
    }

    bindClickReloadPost(){
        const $this = this;
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
            const reload_self = $btn.data('reload-self');
            const targetSelector = $btn.data('reload-ptarget');
            const targetMain = $btn.data('target-main') || targetSelector;

            // POST için load() desteklemiyor, manuel yapmalıyız
            $.post(url, { _token: this.csrfToken || $('meta[name="csrf-token"]').attr('content') })
                .done((response)=> {
                    var tempDiv = $('<div>').html(response);
                    var refreshedContent = tempDiv.find(targetMain).html();
                    if (response.type && response.message){
                        $this.notify(response.type, '', response.message)
                    }
                    if (reload_self){
                        $.get(window.location.href, (res) => {
                            const tempSelf = $('<div>').html(res);
                            refreshedContent = tempSelf.find(targetMain).html();
                            $(targetSelector).html(refreshedContent);
                            if (typeof $this.afterReload == 'function') { $this.afterReload(); }
                        });
                    }else {
                        $(targetSelector).html(refreshedContent);
                        if (typeof $this.afterReload == 'function') { $this.afterReload(); }
                    }
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

    // --- CONFIRM SUBMIT HANDLER ---
    bindConfirmSubmit() {
        $(document).on('click', '[data-confirm-submit]', (e) => {
            e.preventDefault();
            const $button = $(e.currentTarget);
            const $form = $button.closest('form');

            if (!$form.length) {
                console.error('Form bulunamadı! data-confirm-submit özelliği bir form içinde kullanılmalıdır.');
                return;
            }

            const title = $button.data('confirm-submit-title') || 'Emin misiniz?';
            const text = $button.data('confirm-submit-text') || "Bu formu göndermek istediğinize emin misiniz?";
            const icon = $button.data('confirm-submit-icon') || 'warning';
            const confirm = $button.data('confirm-submit-button') || 'Evet, gönder';
            const cancel = $button.data('cancel-submit-button') || 'Vazgeç';

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
                    $button.removeAttr('data-confirm-submit');
                    $button[0].click();
                    $button.attr('data-confirm-submit', '');
                }
            });
        });
    }

    // --- CONFIRM HANDLER ---
    bindAjaxConfirm() {
        $(document).on('click', '[data-ajax-confirm]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);
            const url = $el.data('ajax-confirm');
            const reloadAfter = $el.data('reload');
            const reloadTarget = $el.data('reload-target');
            const reloadUrl = $el.data('reload-url') || window.location.href;

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
                            if (response.type){
                                this.notify(response.type || 'success', response.title || 'Başarılı', response.message || '');
                            }

                            if (reloadTarget) {
                                $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                    if (this.afterReload) this.afterReload(reloadTarget);
                                });
                            }
                            else if (reloadAfter !== undefined) {
                                setTimeout(() => location.reload(), parseInt(reloadAfter));
                            }

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
        var bulk_targets = {};
        function toggle(toggleSelector, ids){
            if (ids.length === 0) {
                $(toggleSelector).hide()
            }else {
                $(toggleSelector).show()
            }
        }
        $(document).on('click', '[data-bulk-all]', function () {
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
            const bulkTarget = target.replace(':checked', '');
            if (bulk_targets[bulkTarget]){
                return;
            }
            if(!toggleSelector) return;
            const ids = [];
            $(target).each(function () {
                ids.push($(this).val());
            });

            bulk_targets[bulkTarget] = 1;
            $(document).on('change', bulkTarget, () => {
                toggle(toggleSelector, $(target))
            })
            toggle(toggleSelector, ids)
        })

        $(document).on('click', '[data-bulk-action]', (e) => {
            e.preventDefault();
            const $btn = $(e.currentTarget);
            const url = $btn.data('bulk-action');
            const target = $btn.data('target') || '[name="ids[]"]:checked';
            const reloadTarget = $btn.data('reload-target');
            const reloadUrl = $btn.data('reload-url') || window.location.href;

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

                            if (reloadTarget) {
                                $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                    if (this.afterReload) this.afterReload(reloadTarget);
                                });
                            }
                            else if (response.reload) {
                                setTimeout(() => location.reload(), response.reload);
                            }

                            document.dispatchEvent(new CustomEvent("ajax:success", {
                                detail: { element: $btn, response }
                            }));
                            $('[data-bulk-all]:checked').trigger('click')
                        },
                        error: (xhr) => {
                            this.notify('error', 'Hata!', xhr.responseJSON?.message || 'İşlem başarısız oldu.');

                            document.dispatchEvent(new CustomEvent("ajax:error", {
                                detail: { element: $btn, error: xhr }
                            }));
                            $('[data-bulk-all]:checked').trigger('click')
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

            if (!url) {
                console.error('data-ajax-pmodal attribute boş!');
                return;
            }

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
                    if (!html || html.trim() === '') {
                        this.notify('error', 'Hata', 'Modal içeriği boş geldi.');
                        return;
                    }

                    let $oldModal = $('#ajaxHelperModal');
                    if ($oldModal.length > 0) {
                        $oldModal.modal('hide');
                        $oldModal.off();
                        $oldModal.remove();
                    }

                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open').css('padding-right', '');

                    const newClass = $el.data('class') ?? '';
                    const $modal = $(`
                    <div class="modal fade ${newClass}" id="ajaxHelperModal" tabindex="-1" role="dialog" aria-hidden="true">
                    </div>
                `);

                    $modal.html(html);

                    $('body').append($modal);

                    $modal.on('hidden.bs.modal', function() {
                        $(this).remove();
                        $('.modal-backdrop').remove();
                        $('body').removeClass('modal-open').css('padding-right', '');
                    });

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
            const submitLoader = $el.attr('data-submit-loader') !== undefined;
            const url = $el.data('ajax-modal');
            let submitter = null;
            let values = $el.data('values') || {};

            const resetSubmitter = () => {
                if (submitter) {
                    submitter.removeData('loading');
                    submitter.html(submitter.data('text'));
                    submitter.css({
                        'width': '',
                        'height': '',
                        'min-width': ''
                    });
                }
            };

            if (submitLoader) {
                submitter = $el;
                if (!submitter.data('text')) {
                    submitter.data('text', submitter.html());
                }
                if (submitter.data('loading')) return;

                const currentWidth = submitter.outerWidth();
                const currentHeight = submitter.outerHeight();

                submitter.css({
                    'width': currentWidth + 'px',
                    'height': currentHeight + 'px',
                    'min-width': currentWidth + 'px'
                });

                submitter.data('loading', 1);
                submitter.html('<i class="fas fa-spinner spin-me" style="font-size: 14px;margin: 0 auto"></i>');
            }

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
                let $oldModal = $('#ajaxHelperModal');
                if ($oldModal.length > 0) {
                    $oldModal.modal('hide');
                    $oldModal.remove();
                }

                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');

                resetSubmitter();
                const newClass = $el.data('class') ?? '';
                const $modal = $(`
                <div class="modal fade ${newClass}" id="ajaxHelperModal" tabindex="-1">
                </div>
            `);

                $modal.html(html);

                $('body').append($modal);

                $modal.modal('show');

            }).fail((xhr) => {
                this.notify('error', 'Hata', xhr.responseJSON?.message || 'Modal yüklenemedi.');
                resetSubmitter();
            });
        });
    }

    // --- CLICK RELOAD HANDLER ---
    bindClickReload(){
        $(document).on('click', '[data-reload][data-reload-target]', function (){
            if($(this).attr('clicked')){
                return;
            }
            $(this).attr('clicked', 1)
            $($(this).data('reload-target')).load($(this).data('reload') + " " + $(this).data('reload-target') + " > *", () => {
                $(this).removeAttr('clicked')
                if (typeof this.afterReload === 'function') {
                    this.afterReload($(this).data('reload-target'));
                }
            });
        });
    }

    bindTableSort() {
        $(document).on('click', '[data-sortable-table] th[data-sort]', function() {
            const $th = $(this);
            const $table = $th.closest('[data-sortable-table]');
            const column = $th.index();
            const type = $th.data('type') || 'string';
            const currentOrder = $th.data('order') || 'asc';
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

            $table.find('th[data-sort]').not($th).removeData('order').find('.sort-icon').remove();

            $th.data('order', newOrder);
            $th.find('.sort-icon').remove();
            $th.append(`<i class="sort-icon fas fa-sort-${newOrder === 'asc' ? 'up' : 'down'} ms-1"></i>`);

            const $tbody = $table.find('tbody');
            const rows = $tbody.find('tr').toArray();

            rows.sort((a, b) => {
                let aVal = $(a).find(`td:eq(${column})`).data('value') || $(a).find(`td:eq(${column})`).text();
                let bVal = $(b).find(`td:eq(${column})`).data('value') || $(b).find(`td:eq(${column})`).text();

                if (type === 'number') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                } else if (type === 'date') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                } else {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                }

                if (aVal < bVal) return newOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return newOrder === 'asc' ? 1 : -1;
                return 0;
            });

            $tbody.html(rows);
        });
    }
    // --- SORTABLE HANDLER ---
    bindSortable() {
        if (typeof Sortable === 'undefined') return;
        document.querySelectorAll('[data-sortable]').forEach(el => {
            const handleSelector = el.dataset.handle || null;
            let values = el.dataset.values || {};
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

            const silent = el.dataset.silent === 'on';
            const targetSelector = el.dataset.target || '[data-id]';

            Array.from(el.querySelectorAll(targetSelector)).forEach((item, index) => {
                item.dataset.oldPosition = index;
            });

            Sortable.create(el, {
                multiDrag: true,
                selectedClass: 'sortable-multiple-select',
                handle: handleSelector,
                animation: el.dataset.animation || 300,
                draggable: el.dataset.draggable || null,
                onEnd: (evt) => {
                    if (evt.sortable && evt.sortable.multiDrag) {
                        evt.sortable.multiDrag._deselectMultiDrag();
                    }
                    const order = Array.from(el.querySelectorAll(targetSelector)).map((item, index) => {
                        let itemValues = item.dataset.values || {};
                        if (typeof itemValues === "string") {
                            try {
                                itemValues = JSON.parse(itemValues);
                            } catch {
                                itemValues = itemValues.split(";").reduce((acc, pair) => {
                                    let [k, v] = pair.split(":");
                                    if (k && v) acc[k.trim()] = v.trim();
                                    return acc;
                                }, {});
                            }
                        }
                        return {
                            id: item.dataset.id,
                            position: index,
                            old: parseInt(item.dataset.oldPosition),
                            ...itemValues
                        };
                    });

                    Array.from(el.querySelectorAll(targetSelector)).forEach((item, index) => {
                        item.dataset.oldPosition = index;
                    });

                    const requestData = {
                        order,
                        _token: this.csrfToken,
                        ...values
                    };

                    $.ajax({
                        url: el.dataset.sortable,
                        method: 'POST',
                        data: requestData,
                        success: (res) => {
                            if (silent){
                                window.notyf_alert_silent = true;
                            }
                            this.notify(res.type || 'success', res.title || 'Başarılı', res.message || 'Sıralama güncellendi.');
                            const reloadTarget = el.dataset.reloadTarget;
                            const reloadUrl = el.dataset.reloadUrl || window.location.href;
                            if (reloadTarget) {
                                $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                    if (this.afterReload) this.afterReload(reloadTarget);
                                    Array.from(el.querySelectorAll(targetSelector)).forEach((item, index) => {
                                        item.dataset.oldPosition = index;
                                    });
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
            const delay = $input.data('delay') || 500;
            const fieldName = $input.attr('name');
            const uniq_id = $input.attr('id') ?? 0;
            const fieldValue = $input.val();
            const silent = $form.data('silent') == 'on';
            if (silent){
                window.notyf_alert_silent = true;
            }

            if (timers[fieldName+uniq_id]) clearTimeout(timers[fieldName+uniq_id]);
            timers[fieldName+uniq_id] = setTimeout(() => {
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
            }, delay);
        });
        $(document).on('input', '[data-autosave-input]', (e) => {
            const $input = $(e.currentTarget);
            const $form = $input.closest('form');
            const url = $form.attr('action');
            const method = $form.attr('method') || 'POST';
            const delay = $input.data('delay') || 500;
            const fieldName = $input.attr('name');
            const uniq_id = $input.attr('id') ?? 0;
            const fieldValue = $input.val();

            if (timers[fieldName+uniq_id]) clearTimeout(timers[fieldName+uniq_id]);
            timers[fieldName+uniq_id] = setTimeout(() => {
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
                        if ($input.data('silent') == 'on'){
                            window.notyf_alert_silent = true;
                        }
                        this.notify(res.type || 'success', res.title || 'Başarılı', res.message || 'Sıralama güncellendi.');
                        $input.removeClass('is-invalid');
                        $input.next('.invalid-feedback').remove();
                    },
                    error: (xhr) => {
                        if ($input.data('silent') == 'on'){
                            window.notyf_alert_silent = true;
                        }
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
            }, delay);
        });
    }
    // --- SWAL CONFIRM REQUEST HANDLER ---
    bindSwalRequest() {
        $(document).on('click', '[data-swal-request]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);

            if ($el.attr('disabled') || $el.hasClass('processing')) {
                return;
            }

            const url = $el.data('swal-request');
            const method = ($el.data('method') || 'POST').toUpperCase();
            const reloadAfter = $el.data('reload');
            const reloadTarget = $el.data('reload-target');
            const reloadUrl = $el.data('reload-url') || window.location.href;

            const title = $el.data('swal-title') || 'Emin misiniz?';
            const text = $el.data('swal-text') || 'Bu işlemi yapmak istediğinize emin misiniz?';
            const icon = $el.data('swal-icon') || 'warning';
            const confirmButton = $el.data('swal-confirm') || 'Evet, devam et';
            const cancelButton = $el.data('swal-cancel') || 'İptal';

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

            const dataName = $el.data('name');
            const dataValue = $el.data('value');
            if (dataName && dataValue !== undefined) {
                values[dataName] = dataValue;
            }

            Swal.fire({
                title,
                text,
                icon,
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: confirmButton,
                cancelButtonText: cancelButton
            }).then((result) => {
                if (result.isConfirmed) {
                    $el.addClass('processing').prop('disabled', true);

                    const originalHtml = $el.html();
                    $el.html('<i class="fas fa-spinner spin-me" style="font-size:14px;margin:0 auto"></i>');

                    const resetBtn = () => {
                        $el.html(originalHtml);
                        $el.removeClass('processing').prop('disabled', false);
                    };

                    if (method === 'POST') {
                        values._token = this.csrfToken;
                    }

                    $.ajax({
                        url: url,
                        type: method,
                        data: values,
                        success: (response) => {
                            resetBtn();

                            if (response.type && response.message) {
                                this.notify(response.type, response.title || 'Başarılı', response.message);
                            }

                            if (reloadTarget) {
                                $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                                    if (this.afterReload) this.afterReload(reloadTarget);
                                });
                            }
                            else if (reloadAfter !== undefined) {
                                setTimeout(() => location.reload(), parseInt(reloadAfter));
                            }

                            document.dispatchEvent(new CustomEvent("ajax:success", {
                                detail: { element: $el, response }
                            }));
                        },
                        error: (xhr) => {
                            resetBtn();

                            const msg = xhr.responseJSON?.message || 'İşlem başarısız oldu.';
                            this.notify('error', 'Hata', msg);

                            document.dispatchEvent(new CustomEvent("ajax:error", {
                                detail: { element: $el, error: xhr }
                            }));
                        }
                    });
                }
            });
        });
    }
    // --- SWAL INPUT REQUEST HANDLER ---
    bindSwalInputRequest() {
        $(document).on('click', '[data-swal-input-request]', (e) => {
            e.preventDefault();
            const $el = $(e.currentTarget);

            if ($el.attr('disabled') || $el.hasClass('processing')) {
                return;
            }

            const url = $el.data('swal-input-request');
            const method = ($el.data('method') || 'POST').toUpperCase();
            const layout = $el.data('layout');
            const inputName = $el.data('name');
            const reloadAfter = $el.data('reload');
            const reloadTarget = $el.data('reload-target');
            const reloadUrl = $el.data('reload-url') || window.location.href;

            const title = $el.data('swal-title') || 'Lütfen bilgileri girin';
            const text = $el.data('swal-text') || '';
            const confirmButton = $el.data('swal-confirm') || 'Gönder';
            const cancelButton = $el.data('swal-cancel') || 'İptal';

            let extraValues = $el.data('values') || {};
            if (typeof extraValues === "string") {
                try {
                    extraValues = JSON.parse(extraValues);
                } catch {
                    extraValues = extraValues.split(";").reduce((acc, pair) => {
                        let [k, v] = pair.split(":");
                        if (k && v) acc[k.trim()] = v.trim();
                        return acc;
                    }, {});
                }
            }

            // Layout varsa çoklu input, yoksa tek input
            if (layout) {
                this.handleMultipleInputs($el, layout, url, method, title, text, confirmButton, cancelButton, extraValues, reloadAfter, reloadTarget, reloadUrl);
            } else {
                this.handleSingleInput($el, inputName, url, method, title, text, confirmButton, cancelButton, extraValues, reloadAfter, reloadTarget, reloadUrl);
            }
        });
    }

    bindInlineEdit() {
        $(document).on('click', '[data-inline-edit]', function(e) {
            e.preventDefault();
            const $el = $(this);

            if ($el.hasClass('editing')) return;

            const currentValue = $el.text().trim();
            const fieldType = $el.data('type') || 'text';
            const fieldName = $el.data('name');

            let input;
            if (fieldType === 'textarea') {
                input = $(`<textarea class="form-control form-control-sm">${currentValue}</textarea>`);
            } else {
                input = $(`<input type="${fieldType}" class="form-control form-control-sm" value="${currentValue}">`);
            }

            $el.addClass('editing').html(input);
            input.focus().select();

            const save = () => {
                const newValue = input.val();
                if (newValue === currentValue) {
                    $el.removeClass('editing').text(currentValue);
                    return;
                }

                const url = $el.data('inline-edit');
                const data = {
                    [fieldName]: newValue,
                    _token: this.csrfToken
                };

                $.post(url, data)
                    .done((response) => {
                        $el.removeClass('editing').text(newValue);
                        if (response.type && response.message) {
                            this.notify(response.type, response.title || 'Başarılı', response.message);
                        }
                    })
                    .fail((xhr) => {
                        $el.removeClass('editing').text(currentValue);
                        this.notify('error', 'Hata', xhr.responseJSON?.message || 'Kaydedilemedi.');
                    });
            };

            const cancel = () => {
                $el.removeClass('editing').text(currentValue);
            };

            input.on('blur', save);
            input.on('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    save();
                } else if (e.key === 'Escape') {
                    cancel();
                }
            });
        });
    }

    handleSingleInput($el, inputName, url, method, title, text, confirmButton, cancelButton, extraValues, reloadAfter, reloadTarget, reloadUrl) {
        const inputType = $el.data('input-type') || 'text';
        const inputPlaceholder = $el.data('placeholder') || '';
        const inputValue = $el.data('input-value') || '';
        const required = $el.data('required') !== false;

        Swal.fire({
            title,
            text,
            input: inputType,
            inputPlaceholder,
            inputValue,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButton,
            cancelButtonText: cancelButton,
            inputValidator: (value) => {
                if (required && !value) {
                    return 'Bu alan zorunludur!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let values = { ...extraValues };
                if (inputName) {
                    values[inputName] = result.value;
                }
                this.sendSwalRequest($el, url, method, values, reloadAfter, reloadTarget, reloadUrl);
            }
        });
    }

    handleMultipleInputs($el, layout, url, method, title, text, confirmButton, cancelButton, extraValues, reloadAfter, reloadTarget, reloadUrl) {
        // Layout: name:placeholder,inputType;name2:placeholder2,textarea
        const fields = layout.split(';').map(field => {
            const [nameWithPlaceholder, inputType = 'text'] = field.split(',');
            const [name, placeholder = ''] = nameWithPlaceholder.split(':');
            return {
                name: name.trim(),
                placeholder: placeholder.trim(),
                type: inputType.trim()
            };
        });

        let formHtml = '<div style="text-align: left;">';
        fields.forEach(field => {
            const inputId = 'swal-input-' + field.name;
            formHtml += `<div style="margin-bottom: 15px;">`;
            formHtml += `<label for="${inputId}" style="display: block; margin-bottom: 5px; font-weight: 500;font-size:0.95rem !important;">${field.placeholder || field.name}</label>`;

            if (field.type === 'textarea') {
                formHtml += `<textarea id="${inputId}" class="form-control" placeholder="${field.placeholder}" style="width: 100%; height: 80px;margin:0;font-size:0.85rem !important;"></textarea>`;
            } else if (field.type === 'select') {
                const options = $el.data('select-' + field.name) || '';
                formHtml += `<select id="${inputId}" class="swal2-input form-control" style="width: 100%;margin:0;font-size:0.85rem !important;">`;
                formHtml += `<option value="">Seçiniz...</option>`;
                if (options) {
                    options.split(',').forEach(opt => {
                        const [value, label] = opt.split(':');
                        formHtml += `<option value="${value.trim()}">${label ? label.trim() : value.trim()}</option>`;
                    });
                }
                formHtml += `</select>`;
            } else {
                formHtml += `<input type="${field.type}" id="${inputId}" class="swal2-input" placeholder="${field.placeholder}" style="width: 100%;margin:0;font-size:0.85rem !important;">`;
            }

            formHtml += `</div>`;
        });
        formHtml += '</div>';

        Swal.fire({
            title,
            html: formHtml,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButton,
            cancelButtonText: cancelButton,
            focusConfirm: false,
            preConfirm: () => {
                const values = {};
                let hasError = false;

                fields.forEach(field => {
                    const input = document.getElementById('swal-input-' + field.name);
                    const value = input ? input.value.trim() : '';

                    const isRequired = $el.data('required-' + field.name) !== false;

                    if (isRequired && !value) {
                        Swal.showValidationMessage(`${field.placeholder || field.name} alanı zorunludur!`);
                        hasError = true;
                        return false;
                    }

                    values[field.name] = value;
                });

                if (hasError) return false;
                return values;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const values = { ...extraValues, ...result.value };
                this.sendSwalRequest($el, url, method, values, reloadAfter, reloadTarget, reloadUrl);
            }
        });
    }

    sendSwalRequest($el, url, method, values, reloadAfter, reloadTarget, reloadUrl) {
        $el.addClass('processing').prop('disabled', true);

        const originalHtml = $el.html();
        $el.html('<i class="fas fa-spinner spin-me" style="font-size:14px;margin:0 auto"></i>');

        const resetBtn = () => {
            $el.html(originalHtml);
            $el.removeClass('processing').prop('disabled', false);
        };

        if (method === 'POST') {
            values._token = this.csrfToken;
        }

        const elementSelector = $el.data('element');
        const fieldName = $el.data('field') || 'extraData';
        const fetchMethod = ($el.data('element-method') || '').toLowerCase();

        if (elementSelector) {
            const $target = $(elementSelector);
            if ($target.length) {
                let val;

                switch (fetchMethod) {
                    case 'value':
                        val = $target.val();
                        break;

                    case 'text':
                        val = $target.text().trim();
                        break;

                    case 'html':
                        val = $target.html().trim();
                        break;

                    case 'data':
                        val = $target.data();
                        break;

                    case 'ckeditor':
                        if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances) {
                            const id = $target.attr('id');
                            if (CKEDITOR.instances[id]) {
                                val = CKEDITOR.instances[id].getData();
                            }
                        }
                        else if (typeof ClassicEditor !== 'undefined' && ClassicEditor.instances) {
                            const id = $target.attr('id');
                            if (ClassicEditor.instances[id]) {
                                val = ClassicEditor.instances[id].getData();
                            }
                        }
                        break;
                    default:
                        if (typeof $target.val === 'function' && $target.val()) val = $target.val();
                        else if ($target.html().trim()) val = $target.html().trim();
                        else if ($target.text().trim()) val = $target.text().trim();
                        else if (Object.keys($target.data()).length > 0) val = $target.data();
                        break;
                }

                if (val !== undefined) values[fieldName] = val;
            }
        }

        $.ajax({
            url,
            type: method,
            data: values,
            success: (response) => {
                resetBtn();

                if (response.type && response.message) {
                    this.notify(response.type, response.title || 'Başarılı', response.message);
                }

                if (reloadTarget) {
                    $(reloadTarget).load(reloadUrl + " " + reloadTarget + " > *", () => {
                        if (this.afterReload) this.afterReload(reloadTarget);
                    });
                } else if (reloadAfter !== undefined) {
                    setTimeout(() => location.reload(), parseInt(reloadAfter));
                }

                document.dispatchEvent(new CustomEvent("ajax:success", {
                    detail: { element: $el, response }
                }));
            },
            error: (xhr) => {
                resetBtn();

                const msg = xhr.responseJSON?.message || 'İşlem başarısız oldu.';
                this.notify('error', 'Hata', msg);

                document.dispatchEvent(new CustomEvent("ajax:error", {
                    detail: { element: $el, error: xhr }
                }));
            }
        });
    }


    // --- DEFAULT NOTIFY ---
    defaultNotify(type, title, message) { 
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}
