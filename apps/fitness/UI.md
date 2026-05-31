# UI Design Tokens — Luma

## Layout

| Token | Value |
|---|---|
| `--max-width` | `820px` |
| `--max-width-wide-page` | `960px` |
| `--max-width-extra-wide-page` | `1080px` |
| `--horizontal-padding` | `1rem` |

## Border Radius

| Token | Value |
|---|---|
| `--small-border-radius` | `.25rem` |
| `--small-squircle-border-radius` | `.5rem` |
| `--border-radius` | `.5rem` |
| `--squircle-border-radius` | `1rem` |
| `--large-border-radius` | `1rem` |
| `--modal-border-radius` | `var(--large-border-radius)` |
| `--modal-squircle-border-radius` | `2rem` |
| `--card-border-radius` | `.75rem` |
| `--card-squircle-border-radius` | `1.5rem` |

## Spacing

### Content Card

| Token | Value |
|---|---|
| `--content-card-vertical-padding` | `1rem` |
| `--content-card-horizontal-padding` | `1.125rem` |

### Event Row

| Token | Value |
|---|---|
| `--event-row-padding` | `.75rem 1rem` |
| `--event-row-leading-padding` | `1rem` |
| `--event-row-margin` | `0` |
| `--event-row-border-radius` | `0` |

### Base List Row

| Token | Value |
|---|---|
| `--base-list-row-vertical-padding` | `.75rem` |
| `--base-list-row-horizontal-padding` | `1rem` |
| `--base-list-row-default-padding` | `var(--base-list-row-vertical-padding) var(--base-list-row-horizontal-padding)` |
| `--base-list-divider-left-offset` | `0` |

Mobile (`max-width: 450px`):

| Token | Value |
|---|---|
| `--base-list-row-vertical-padding` | `.6875rem` |
| `--base-list-row-horizontal-padding` | `.875rem` |

### Other Spacing

| Token | Value |
|---|---|
| `--spark-block-spacing` | `1.125rem` |
| `--dt-left-border-radius` | `var(--border-radius)` |
| `--dt-right-border-radius` | `var(--border-radius)` |

## Z-Index

| Token | Value |
|---|---|
| `--chat-z-index` | `900` |
| `--overlay-z-index` | `1000` |

---

## Typography

| Token | Value |
|---|---|
| `--font` | `-apple-system, BlinkMacSystemFont, "Apple Color Emoji", Inter, Roboto, Segoe UI, Helvetica Neue, Arial, Noto Sans, sans-serif` |
| `--mono-font` | `"SF Mono", menlo, monaco, consolas, "Courier New", Courier, monospace` |
| `--default-line-height` | `1.5` |
| `--reduced-line-height` | `1.3` |
| `--title-line-height` | `1.2` |
| `--reduced-title-line-height` | `1.15` |
| `--font-weight-light` | `300` |
| `--font-weight-regular` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-bold` | `600` |
| `--font-size-xxxl` | `1.5rem` |
| `--font-size-xxl` | `1.375rem` |
| `--font-size-xl` | `1.25rem` |
| `--font-size-lg` | `1.125rem` |
| `--font-size-md` | `1rem` |
| `--font-size-sm` | `.875rem` |
| `--font-size-xs` | `.8125rem` |
| `--font-size-xxs` | `.75rem` |
| `--font-size-xxxs` | `.625rem` |
| `--section-title-font-size` | `var(--font-size-xl)` |
| `--section-subtitle-font-size` | `var(--font-size-md)` |
| `--small-section-title-font-size` | `var(--font-size-lg)` |
| `--small-section-subtitle-font-size` | `var(--font-size-sm)` |

Mobile (`max-width: 450px`):

| Token | Value |
|---|---|
| `--section-title-font-size` | `var(--font-size-lg)` |
| `--section-subtitle-font-size` | `var(--font-size-sm)` |
| `--small-section-title-font-size` | `var(--font-size-md)` |
| `--small-section-subtitle-font-size` | `var(--font-size-xs)` |

---

## Transitions

| Token | Value |
|---|---|
| `--transition-duration` | `.3s` |
| `--fast-transition-duration` | `.2s` |
| `--slow-transition-duration` | `.6s` |
| `--transition-fn` | `cubic-bezier(.4, 0, .2, 1)` |
| `--bounce-transition-fn` | `cubic-bezier(.54, 1.12, .38, 1.11)` |

---

## Colors

### Grays

| Token | Value |
|---|---|
| `--white` | `#fff` |
| `--gray-10` | `#f7f8f9` |
| `--gray-20` | `#ebeced` |
| `--gray-30` | `#dee0e2` |
| `--gray-40` | `#d2d4d7` |
| `--gray-50` | `#b3b5b7` |
| `--gray-60` | `#939597` |
| `--gray-70` | `#737577` |
| `--gray-80` | `#535557` |
| `--gray-90` | `#333537` |
| `--gray-100` | `#212325` |
| `--black` | `rgb(19, 21, 23)` |
| `--pure-black` | `#000` |

### Cranberry (Brand)

| Token | Value |
|---|---|
| `--cranberry-5` | `#fef4f9` |
| `--cranberry-10` | `#fde2ef` |
| `--cranberry-20` | `#fcc6de` |
| `--cranberry-30` | `#f98dbe` |
| `--cranberry-40` | `#f6539d` |
| `--cranberry-50` | `#f31a7c` |
| `--cranberry-60` | `#d5176d` |
| `--cranberry-70` | `#b6145d` |
| `--cranberry-80` | `#98104e` |
| `--cranberry-90` | `#790d3e` |

### Barney

| Token | Value |
|---|---|
| `--barney-5` | `#faeeff` |
| `--barney-10` | `#f0d3ff` |
| `--barney-20` | `#e1a8fe` |
| `--barney-30` | `#d27cfe` |
| `--barney-40` | `#c350fd` |
| `--barney-50` | `#ab46dd` |
| `--barney-60` | `#923cbe` |
| `--barney-70` | `#7a329e` |
| `--barney-80` | `#62287f` |
| `--barney-90` | `#491e5f` |

### Purple

| Token | Value |
|---|---|
| `--purple-5` | `#f4f3fe` |
| `--purple-10` | `#e3defd` |
| `--purple-20` | `#d4c4ff` |
| `--purple-30` | `#b596ff` |
| `--purple-40` | `#7b49ff` |
| `--purple-50` | `#682fff` |
| `--purple-60` | `#5b29df` |
| `--purple-70` | `#4b23bf` |
| `--purple-80` | `#2f1880` |
| `--purple-90` | `#231260` |

### Blue

| Token | Value |
|---|---|
| `--blue-5` | `#eff5ff` |
| `--blue-10` | `#d4e5ff` |
| `--blue-20` | `#b6d3ff` |
| `--blue-30` | `#76adff` |
| `--blue-40` | `#287eff` |
| `--blue-50` | `#146aeb` |
| `--blue-60` | `#125dce` |
| `--blue-70` | `#0546a6` |
| `--blue-80` | `#033889` |
| `--blue-90` | `#002b6b` |
| `--chat-blue` | `#287eff` |

### Green

| Token | Value |
|---|---|
| `--green-5` | `#e7f7e5` |
| `--green-10` | `#ccf0c7` |
| `--green-20` | `#99e290` |
| `--green-30` | `#77d86b` |
| `--green-40` | `#54c546` |
| `--green-50` | `#3cbd2c` |
| `--green-60` | `#35a527` |
| `--green-70` | `#2d8e21` |
| `--green-80` | `#25761b` |
| `--green-90` | `#14550c` |

### Yellow

| Token | Value |
|---|---|
| `--yellow-5` | `#fcf4e4` |
| `--yellow-10` | `#faeac9` |
| `--yellow-20` | `#f7dfae` |
| `--yellow-30` | `#f2ca77` |
| `--yellow-40` | `#edb541` |
| `--yellow-50` | `#eaab26` |
| `--yellow-60` | `#d69712` |
| `--yellow-70` | `#b98a27` |
| `--yellow-80` | `#926b18` |
| `--yellow-90` | `#755513` |

### Orange

| Token | Value |
|---|---|
| `--orange-5` | `#feede4` |
| `--orange-10` | `#fddbca` |
| `--orange-20` | `#fccaaf` |
| `--orange-30` | `#fba67a` |
| `--orange-40` | `#f98346` |
| `--orange-50` | `#f8712b` |
| `--orange-60` | `#d96326` |
| `--orange-70` | `#ba5520` |
| `--orange-80` | `#9b471b` |
| `--orange-90` | `#722e0b` |

### Red

| Token | Value |
|---|---|
| `--red-5` | `#ffeeef` |
| `--red-10` | `#fde4e5` |
| `--red-20` | `#f8afb2` |
| `--red-30` | `#ff766d` |
| `--red-40` | `#f9524e` |
| `--red-50` | `#ed2b32` |
| `--red-60` | `#cf2c31` |
| `--red-70` | `#b1262a` |
| `--red-80` | `#93080c` |
| `--red-90` | `#750000` |

---

## Shadows

### Light

| Token | Value |
|---|---|
| `--light-shadow-xs` | `0 1px 4px rgba(0,0,0,.1)` |
| `--light-shadow-sm` | `0 1px 3px rgba(0,0,0,.02), 0 2px 7px rgba(0,0,0,.03), 0 3px 14px rgba(0,0,0,.04), 0 7px 29px rgba(0,0,0,.05), 0 20px 80px rgba(0,0,0,.06)` |
| `--light-shadow` | `0 1.6px 3px rgba(0,0,0,.02), 0 4.2px 7px rgba(0,0,0,.03), 0 8px 14px rgba(0,0,0,.04), 0 17.5px 29px rgba(0,0,0,.05), 0 48px 80px rgba(0,0,0,.06)` |
| `--light-shadow-lg` | `0 3px 3px rgba(0,0,0,.03), 0 8px 7px rgba(0,0,0,.04), 0 17px 14px rgba(0,0,0,.05), 0 35px 29px rgba(0,0,0,.06), 0 96px 80px rgba(0,0,0,.07)` |
| `--light-shadow-xl` | `0 4.5px 3px rgba(0,0,0,.04), 0 11.3px 7px rgba(0,0,0,.06), 0 23px 14px rgba(0,0,0,.08), 0 47.5px 29px rgba(0,0,0,.1), 0 130px 80px rgba(0,0,0,.14)` |

### Medium (dark mode)

| Token | Value |
|---|---|
| `--medium-shadow-xs` | `0 1px 4px rgba(0,0,0,.15)` |
| `--medium-shadow-sm` | `0 1px 3px rgba(0,0,0,.1), 0 2px 7px rgba(0,0,0,.13), 0 3px 14px rgba(0,0,0,.17), 0 7px 29px rgba(0,0,0,.22)` |
| `--medium-shadow` | `0 2px 3px rgba(0,0,0,.1), 0 4px 7px rgba(0,0,0,.13), 0 8px 14px rgba(0,0,0,.17), 0 17px 29px rgba(0,0,0,.22)` |
| `--medium-shadow-lg` | `0 3.3px 3px rgba(0,0,0,.1), 0 8px 7px rgba(0,0,0,.13), 0 17px 14px rgba(0,0,0,.17), 0 35px 29px rgba(0,0,0,.22)` |
| `--medium-shadow-xl` | `0 4.5px 3px rgba(0,0,0,.1), 0 11px 7px rgba(0,0,0,.13), 0 23px 14px rgba(0,0,0,.17), 0 47px 29px rgba(0,0,0,.22)` |

### Active aliases (light)

| Token | Uses |
|---|---|
| `--shadow-xs` | `var(--light-shadow-xs)` |
| `--shadow-sm` | `var(--light-shadow-sm)` |
| `--shadow` | `var(--light-shadow)` |
| `--shadow-lg` | `var(--light-shadow-lg)` |
| `--shadow-xl` | `var(--light-shadow-xl)` |

(Dark mode swaps `--shadow-*` to `--medium-shadow-*`)

### Special

| Token | Value |
|---|---|
| `--shadow-modal` | `0 0 0 1px var(--opacity-8), 0 3px 3px rgba(0,0,0,.03), 0 8px 7px rgba(0,0,0,.04), 0 17px 14px rgba(0,0,0,.05), 0 35px 29px rgba(0,0,0,.06), inset 0px -4px 4px 0px rgba(0,0,0,.04)` |
| `--shadow-map-marker` | `0 1px 3px rgba(0,0,0,.06), 0 2px 7px rgba(0,0,0,.09), 0 3px 14px rgba(0,0,0,.12), 0 7px 29px rgba(0,0,0,.16)` |
| `--shadow-map-marker-selected` | `0 1px 3px rgba(0,0,0,.1), 0 3px 7px rgba(0,0,0,.15), 0 6px 14px rgba(0,0,0,.2), 0 10px 29px rgba(0,0,0,.25)` |
| `--backdrop-blur` | `blur(16px)` |
| `--high-legibility-backdrop-blur` | `blur(24px) contrast(50%) brightness(130%)` (light) / `brightness(70%)` (dark) |

---

## Semantic Tokens (Light)

### Content Colors

| Token | Value |
|---|---|
| `--primary-color` | `var(--black)` |
| `--secondary-color` | `var(--gray-70)` |
| `--secondary-color-alpha` | `rgba(var(--black-base-rgb), .64)` |
| `--tertiary-color` | `var(--gray-50)` |
| `--tertiary-color-alpha` | `rgba(var(--black-base-rgb), .36)` |
| `--quaternary-color` | `var(--gray-30)` |
| `--quaternary-color-alpha` | `rgba(var(--black-base-rgb), .2)` |

### Background Colors (Light)

| Token | Value |
|---|---|
| `--primary-bg-color` | `var(--white)` |
| `--secondary-bg-color` | `var(--gray-10)` |
| `--tertiary-bg-color` | `var(--gray-20)` |
| `--quaternary-bg-color` | `var(--gray-30)` |
| `--modal-bg-color` | `rgba(255,255,255,.867)` |

### Semantic Colors

| Token | Value |
|---|---|
| `--brand-color` | `var(--cranberry-50)` |
| `--brand-bg-color` | `var(--cranberry-50)` |
| `--brand-active-color` | `var(--cranberry-60)` |
| `--brand-pale-bg-color` | `rgba(243,26,124,.133)` |
| `--brand-faint-bg-color` | `rgba(243,26,124,.067)` |
| `--success-color` | `var(--green-50)` |
| `--success-bg-color` | `var(--green-50)` |
| `--success-active-color` | `var(--green-60)` |
| `--success-pale-bg-color` | `rgba(60,189,44,.133)` |
| `--error-color` | `var(--red-50)` |
| `--error-bg-color` | `var(--red-50)` |
| `--error-active-color` | `var(--red-60)` |
| `--error-pale-bg-color` | `rgba(237,43,50,.133)` |
| `--warning-color` | `var(--yellow-60)` |
| `--warning-bg-color` | `var(--yellow-60)` |
| `--warning-active-color` | `var(--yellow-70)` |
| `--warning-pale-bg-color` | `rgba(214,151,18,.133)` |

### Border & Divider

| Token | Value |
|---|---|
| `--primary-border-color` | `var(--gray-40)` |
| `--secondary-border-color` | `var(--gray-20)` |
| `--active-border-color` | `var(--black)` |
| `--divider-color` | `var(--opacity-8)` |

### Hover & Disabled

| Token | Value |
|---|---|
| `--hover-bg-color` | `var(--pale-gray)` |
| `--disabled-bg-color` | `var(--gray-20)` |

---

## Semantic Tokens (Dark)

| Token | Light → Dark |
|---|---|
| `--primary-color` | `var(--black)` → `var(--white)` |
| `--secondary-color` | `var(--gray-70)` → `var(--gray-40)` |
| `--tertiary-color` | `var(--gray-50)` → `var(--gray-60)` |
| `--quaternary-color` | `var(--gray-30)` → `var(--gray-80)` |
| `--primary-bg-color` | `var(--white)` → `var(--black)` |
| `--secondary-bg-color` | `var(--gray-10)` → `var(--gray-100)` |
| `--tertiary-bg-color` | `var(--gray-20)` → `var(--gray-90)` |
| `--quaternary-bg-color` | `var(--gray-30)` → `var(--gray-80)` |
| `--primary-border-color` | `var(--gray-40)` → `var(--gray-60)` |
| `--secondary-border-color` | `var(--gray-20)` → `var(--gray-90)` |
| `--active-border-color` | `var(--black)` → `var(--white)` |
| `--hover-bg-color` | (same — `var(--pale-gray)`) |
| `--disabled-bg-color` | `var(--gray-20)` → `var(--gray-80)` |

---

## Input Sizing

| Token | Value |
|---|---|
| `--input-horizontal-padding` | `.875rem` |
| `--input-vertical-padding` | `.625rem` |
| `--input-font-size` | `1rem` |
| `--input-height` | `calc(2.25rem + 2px)` |
| `--small-input-padding` | `.4375rem .625rem` |
| `--small-input-font-size` | `.875rem` |
| `--small-input-height` | `calc(1.75rem + 2px)` |
| `--large-input-horizontal-padding` | `1.125rem` |
| `--large-input-vertical-padding` | `.75rem` |
| `--large-input-font-size` | `1.125rem` |
| `--large-input-height` | `calc(2.625rem + 2px)` |

## Modal

| Token | Value |
|---|---|
| `--modal-vertical-padding` | `1rem` |
| `--modal-horizontal-padding` | `1.25rem` |
| `--modal-header-footer-padding` | `.6875rem 1.25rem` |
