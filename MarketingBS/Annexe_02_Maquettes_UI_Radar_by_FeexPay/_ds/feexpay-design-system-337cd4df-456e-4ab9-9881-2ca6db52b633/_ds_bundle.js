/* @ds-bundle: {"format":4,"namespace":"FeexPayDesignSystem_337cd4","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"LogoWall","sourcePath":"components/payments/LogoWall.jsx"},{"name":"PaymentMethodTile","sourcePath":"components/payments/PaymentMethodTile.jsx"},{"name":"SolutionCard","sourcePath":"components/payments/SolutionCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"0118cdaeee37","components/core/Button.jsx":"142a7d29800b","components/core/Card.jsx":"9b4b3ba6fcb2","components/core/Icon.jsx":"e31a38179248","components/core/IconButton.jsx":"b86c395bc10e","components/core/StatCard.jsx":"281d1a693253","components/core/Tag.jsx":"770454f2f20f","components/feedback/Alert.jsx":"ed22c44996cd","components/feedback/Dialog.jsx":"980dbc8a73c3","components/feedback/Toast.jsx":"7e89e438df26","components/feedback/Tooltip.jsx":"907f4472e3a2","components/forms/Checkbox.jsx":"f0a4e3a43c97","components/forms/Field.jsx":"395e15aa4803","components/forms/Input.jsx":"372ea4bf4436","components/forms/Radio.jsx":"f9297f76d840","components/forms/Select.jsx":"89f59350f7d0","components/forms/Switch.jsx":"b5402f711d55","components/navigation/Breadcrumb.jsx":"76e5c5821ec8","components/navigation/Tabs.jsx":"494af6bc6685","components/payments/LogoWall.jsx":"55baaaab3cfd","components/payments/PaymentMethodTile.jsx":"6c1056acda72","components/payments/SolutionCard.jsx":"3405ca16db60","ui_kits/marketing-site/HomeScreen.jsx":"28a7aef8a5e5","ui_kits/marketing-site/PricingScreen.jsx":"a7f716030661","ui_kits/marketing-site/SiteChrome.jsx":"8800e4968ae3","ui_kits/marketing-site/SolutionsScreen.jsx":"46c3ea82d3bc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FeexPayDesignSystem_337cd4 = window.FeexPayDesignSystem_337cd4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    bg: 'var(--fx-gray-100)',
    fg: 'var(--fx-gray-600)'
  },
  brand: {
    bg: 'var(--surface-brand-soft)',
    fg: 'var(--fx-navy-600)'
  },
  accent: {
    bg: 'var(--surface-accent-soft)',
    fg: 'var(--fx-orange-700)'
  },
  success: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-fg)'
  },
  warning: {
    bg: 'var(--status-warning-bg)',
    fg: 'var(--status-warning-fg)'
  },
  danger: {
    bg: 'var(--status-danger-bg)',
    fg: 'var(--status-danger-fg)'
  },
  info: {
    bg: 'var(--status-info-bg)',
    fg: 'var(--status-info-fg)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  size = 'md',
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      background: t.bg,
      color: t.fg,
      font: 'var(--fw-semibold) ' + (size === 'sm' ? 'var(--fs-micro)' : 'var(--fs-caption)') + '/1.4 var(--font-sans)',
      borderRadius: 'var(--radius-chip)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 'var(--control-h-sm)',
    padding: '0 14px',
    font: 'var(--fw-semibold) var(--fs-body-sm)/1 var(--font-sans)',
    gap: '6px'
  },
  md: {
    height: 'var(--control-h-md)',
    padding: '0 20px',
    font: 'var(--fw-semibold) var(--fs-body)/1 var(--font-sans)',
    gap: '8px'
  },
  lg: {
    height: 'var(--control-h-lg)',
    padding: '0 28px',
    font: 'var(--fw-bold) var(--fs-body-lg)/1 var(--font-sans)',
    gap: '10px'
  }
};
function palette(variant, hovered, active) {
  switch (variant) {
    case 'secondary':
      return {
        background: active ? 'var(--action-secondary-active)' : hovered ? 'var(--action-secondary-hover)' : 'var(--action-secondary)',
        color: 'var(--action-secondary-fg)',
        border: '1px solid transparent',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)'
      };
    case 'outline':
      return {
        background: hovered ? 'var(--fx-navy-50)' : 'transparent',
        color: 'var(--text-strong)',
        border: '1.5px solid ' + (hovered ? 'var(--fx-navy-400)' : 'var(--border-default)'),
        boxShadow: 'none'
      };
    case 'ghost':
      return {
        background: hovered ? 'var(--action-ghost-hover)' : 'transparent',
        color: 'var(--text-strong)',
        border: '1px solid transparent',
        boxShadow: 'none'
      };
    case 'inverse':
      return {
        background: hovered ? 'var(--fx-gray-100)' : 'var(--fx-white)',
        color: 'var(--fx-navy-600)',
        border: '1px solid transparent',
        boxShadow: 'none'
      };
    default:
      return {
        background: active ? 'var(--action-primary-active)' : hovered ? 'var(--action-primary-hover)' : 'var(--action-primary)',
        color: 'var(--action-primary-fg)',
        border: '1px solid transparent',
        boxShadow: hovered ? 'var(--shadow-accent)' : 'var(--shadow-xs)'
      };
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const p = palette(variant, hovered && !disabled, active && !disabled);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => {
      setHovered(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      font: s.font,
      letterSpacing: '0.01em',
      borderRadius: 'var(--radius-control)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transform: active && !disabled ? 'translateY(1px)' : 'none',
      transition: 'var(--transition-control)',
      whiteSpace: 'nowrap',
      ...p,
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      animation: 'fx-spin .7s linear infinite'
    }
  }) : iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  tone = 'default',
  padding = 'var(--space-6)',
  interactive = false,
  elevation = 'sm',
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const tones = {
    default: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-body)'
    },
    soft: {
      background: 'var(--surface-alt)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-body)'
    },
    accent: {
      background: 'var(--surface-accent-soft)',
      border: '1px solid var(--fx-orange-200)',
      color: 'var(--text-body)'
    },
    inverse: {
      background: 'var(--gradient-inverse)',
      border: '1px solid var(--border-inverse)',
      color: 'var(--fx-navy-100)'
    }
  };
  const base = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  }[elevation];
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      borderRadius: 'var(--radius-card)',
      padding,
      boxShadow: interactive && hovered ? 'var(--shadow-lg)' : base,
      transform: interactive && hovered ? 'translateY(-3px)' : 'none',
      transition: 'var(--transition-card)',
      cursor: interactive ? 'pointer' : 'default',
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* FeexPay's product UI uses Material Design Icons (the live site ships mdi_* glyphs).
   Load the font once per page:
   <link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" rel="stylesheet"> */
function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  style,
  ...rest
}) {
  const px = typeof size === 'number' ? size + 'px' : 'var(--icon-' + size + ')';
  return /*#__PURE__*/React.createElement("i", _extends({
    className: 'mdi mdi-' + name,
    "aria-hidden": "true",
    style: {
      fontSize: px,
      lineHeight: 1,
      color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: px,
      height: px,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const S = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h-md)',
  lg: 'var(--control-h-lg)'
};
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const bg = {
    solid: hovered ? 'var(--action-primary-hover)' : 'var(--action-primary)',
    navy: hovered ? 'var(--action-secondary-hover)' : 'var(--action-secondary)',
    ghost: hovered ? 'var(--action-ghost-hover)' : 'transparent',
    outline: hovered ? 'var(--fx-navy-50)' : 'transparent'
  }[variant];
  const fg = variant === 'solid' || variant === 'navy' ? 'var(--fx-white)' : 'var(--text-strong)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: S[size],
      height: S[size],
      background: bg,
      color: fg,
      border: variant === 'outline' ? '1.5px solid var(--border-default)' : '1px solid transparent',
      borderRadius: shape === 'circle' ? 'var(--radius-circle)' : 'var(--radius-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), typeof icon === 'string' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 'sm' : 'md'
  }) : icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatCard({
  value,
  label,
  icon,
  tone = 'default',
  trend,
  style,
  ...rest
}) {
  const inverse = tone === 'inverse';
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    tone: tone,
    padding: "var(--space-6)",
    style: {
      minWidth: 200,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 'var(--space-3)',
      color: inverse ? 'var(--fx-orange-400)' : 'var(--fx-orange-600)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-h1)',
      color: inverse ? 'var(--fx-white)' : 'var(--text-strong)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-1)',
      font: 'var(--type-body-sm)',
      color: inverse ? 'var(--fx-navy-200)' : 'var(--text-muted)'
    }
  }, label), trend && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)',
      font: 'var(--type-label)',
      color: 'var(--status-success-fg)'
    }
  }, trend));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  icon,
  onRemove,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: selected ? 'var(--fx-navy-600)' : hovered && interactive ? 'var(--fx-gray-100)' : 'var(--surface-card)',
      color: selected ? 'var(--fx-white)' : 'var(--text-body)',
      border: '1px solid ' + (selected ? 'var(--fx-navy-600)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-chip)',
      font: 'var(--type-body-sm)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), icon, children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      cursor: 'pointer',
      opacity: 0.6,
      fontSize: 14,
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    bg: 'var(--status-info-bg)',
    fg: 'var(--status-info-fg)',
    icon: 'information'
  },
  success: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-fg)',
    icon: 'check-circle'
  },
  warning: {
    bg: 'var(--status-warning-bg)',
    fg: 'var(--status-warning-fg)',
    icon: 'alert'
  },
  danger: {
    bg: 'var(--status-danger-bg)',
    fg: 'var(--status-danger-fg)',
    icon: 'alert-circle'
  }
};
function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      background: t.bg,
      borderRadius: 'var(--radius-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: "md",
    color: t.fg,
    style: {
      flex: 'none',
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }
  }, title && /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--type-label)',
      color: t.fg
    }
  }, title), children && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-body)'
    }
  }, children)), onDismiss && /*#__PURE__*/React.createElement("span", {
    onClick: onDismiss,
    style: {
      cursor: 'pointer',
      color: t.fg,
      opacity: 0.7,
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dialog({
  open = true,
  title,
  description,
  children,
  footer,
  width = 480,
  onClose,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(11,27,48,.45)',
      backdropFilter: 'blur(3px)',
      padding: 'var(--space-6)',
      zIndex: 40
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-modal)',
      boxShadow: 'var(--shadow-xl)',
      padding: 'var(--space-8)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h3)',
      color: 'var(--text-strong)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-2)',
      font: 'var(--type-body-sm)',
      color: 'var(--text-muted)'
    }
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "close",
    label: "Fermer",
    onClick: onClose,
    size: "sm"
  })), children, footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-6)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  success: {
    fg: 'var(--status-success-fg)',
    icon: 'check-circle'
  },
  danger: {
    fg: 'var(--status-danger-fg)',
    icon: 'alert-circle'
  },
  info: {
    fg: 'var(--status-info-fg)',
    icon: 'information'
  }
};
function Toast({
  tone = 'success',
  title,
  description,
  onDismiss,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      minWidth: 300,
      maxWidth: 420,
      padding: 'var(--space-4)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: "md",
    color: t.fg,
    style: {
      flex: 'none',
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-strong)'
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, description)), onDismiss && /*#__PURE__*/React.createElement("span", {
    onClick: onDismiss,
    style: {
      cursor: 'pointer',
      color: 'var(--text-subtle)',
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  label,
  placement = 'top',
  children,
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === 'bottom' ? {
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)'
  } : {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false)
  }, rest), children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      padding: '6px 10px',
      background: 'var(--fx-navy-800)',
      color: 'var(--fx-white)',
      font: 'var(--type-caption)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)',
      whiteSpace: 'nowrap',
      zIndex: 30,
      pointerEvents: 'none'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!isOn);
    onChange && onChange(!isOn);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: toggle,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      font: 'var(--type-body-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-xs)',
      background: isOn ? 'var(--fx-orange-600)' : 'var(--surface-card)',
      border: '1.5px solid ' + (isOn ? 'var(--fx-orange-600)' : 'var(--border-default)'),
      transition: 'var(--transition-control)'
    }
  }, isOn && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6.2 4.6 8.8 10 3.4",
    stroke: "#fff",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-strong)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fx-orange-600)'
    }
  }, " *")), children, (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption)',
      color: error ? 'var(--status-danger-fg)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function shell(focused, invalid, disabled) {
  return {
    width: '100%',
    height: 'var(--control-h-md)',
    padding: '0 14px',
    font: 'var(--type-body)',
    color: 'var(--text-strong)',
    background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
    border: '1.5px solid ' + (invalid ? 'var(--fx-red-500)' : focused ? 'var(--fx-navy-400)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-control)',
    boxShadow: focused ? 'var(--ring-focus)' : 'none',
    outline: 'none',
    transition: 'var(--transition-control)'
  };
}
function Input({
  iconLeft,
  suffix,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const base = shell(focused, invalid, disabled);
  if (!iconLeft && !suffix) {
    return /*#__PURE__*/React.createElement("input", _extends({
      disabled: disabled,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      style: {
        ...base,
        ...style
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...base,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '0 14px',
      ...style
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      display: 'inline-flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-body)',
      color: 'var(--text-strong)'
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-muted)'
    }
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  label,
  checked = false,
  onChange,
  disabled = false,
  name,
  value,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: () => !disabled && onChange && onChange(value),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      font: 'var(--type-body-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      background: 'var(--surface-card)',
      border: '1.5px solid ' + (checked ? 'var(--fx-orange-600)' : 'var(--border-default)'),
      transition: 'var(--transition-control)'
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--fx-orange-600)'
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    readOnly: true,
    style: {
      display: 'none'
    }
  }), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function shell(focused, invalid, disabled) {
  return {
    width: '100%',
    height: 'var(--control-h-md)',
    padding: '0 14px',
    font: 'var(--type-body)',
    color: 'var(--text-strong)',
    background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
    border: '1.5px solid ' + (invalid ? 'var(--fx-red-500)' : focused ? 'var(--fx-navy-400)' : 'var(--border-default)'),
    borderRadius: 'var(--radius-control)',
    boxShadow: focused ? 'var(--ring-focus)' : 'none',
    outline: 'none',
    transition: 'var(--transition-control)'
  };
}
function Select({
  options = [],
  placeholder,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      ...shell(focused, invalid, disabled),
      appearance: 'none',
      paddingRight: '38px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => {
    const value = typeof o === 'string' ? o : o.value;
    const label = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, label);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-muted)',
      font: 'var(--fs-caption) var(--font-sans)'
    }
  }, "\u25BE"));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!isOn);
    onChange && onChange(!isOn);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: toggle,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      font: 'var(--type-body-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 24,
      flex: 'none',
      padding: 3,
      borderRadius: 'var(--radius-pill)',
      background: isOn ? 'var(--fx-orange-600)' : 'var(--fx-gray-300)',
      transition: 'background-color var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-xs)',
      transform: isOn ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Breadcrumb({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "fil d'ariane",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      font: 'var(--type-body-sm)',
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    const label = it.label || it;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-strong)',
        fontWeight: 'var(--fw-semibold)'
      }
    }, label) : /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      style: {
        color: 'var(--text-muted)'
      }
    }, label), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-subtle)'
      }
    }, "/"));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'underline',
  style,
  ...rest
}) {
  const active = value !== undefined ? value : items[0] && (items[0].value || items[0]);
  const pill = variant === 'pill';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: pill ? '4px' : 'var(--space-6)',
      padding: pill ? '4px' : 0,
      background: pill ? 'var(--surface-sunken)' : 'transparent',
      borderRadius: pill ? 'var(--radius-pill)' : 0,
      borderBottom: pill ? 'none' : '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), items.map(it => {
    const v = it.value || it;
    const label = it.label || it;
    const on = v === active;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(v),
      style: {
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        background: pill && on ? 'var(--surface-card)' : 'transparent',
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        font: on ? 'var(--type-label)' : 'var(--fw-medium) var(--fs-body-sm)/1.3 var(--font-sans)',
        padding: pill ? '8px 18px' : '0 0 12px',
        borderRadius: pill ? 'var(--radius-pill)' : 0,
        boxShadow: pill && on ? 'var(--shadow-xs)' : 'none',
        transition: 'var(--transition-control)'
      }
    }, label, !pill && on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 3,
        borderRadius: '2px 2px 0 0',
        background: 'var(--fx-orange-600)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/payments/LogoWall.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function LogoWall({
  logos = [],
  label,
  speed = 32,
  grayscale = true,
  style,
  ...rest
}) {
  const doubled = [...logos, ...logos];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      overflow: 'hidden',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      marginBottom: 'var(--space-6)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-16)',
      width: 'max-content',
      animation: 'fx-marquee ' + speed + 's linear infinite'
    }
  }, doubled.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 40,
      display: 'grid',
      placeItems: 'center',
      filter: grayscale ? 'grayscale(1)' : 'none',
      opacity: grayscale ? 0.6 : 1
    }
  }, typeof l === 'string' && /\.(png|jpg|svg|webp)/i.test(l) ? /*#__PURE__*/React.createElement("img", {
    src: l,
    alt: "",
    style: {
      maxHeight: 40,
      maxWidth: 140,
      objectFit: 'contain'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-h4)/1 var(--font-display)',
      color: 'var(--fx-navy-300)',
      whiteSpace: 'nowrap'
    }
  }, l)))));
}
Object.assign(__ds_scope, { LogoWall });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/payments/LogoWall.jsx", error: String((e && e.message) || e) }); }

// components/payments/PaymentMethodTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Operator artwork (MTN, Moov, Celtiis, Coris, Wave, Visa…) is NOT bundled with this design
   system — pass the file via `logo`. Without it the tile falls back to a typographic mark. */
function initials(name) {
  return String(name).split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function PaymentMethodTile({
  name,
  rate,
  logo,
  note,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-6) var(--space-4)',
      background: 'var(--surface-card)',
      border: '1px solid ' + (selected ? 'var(--fx-orange-600)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-card)',
      boxShadow: hovered && onClick ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      transform: hovered && onClick ? 'translateY(-2px)' : 'none',
      transition: 'var(--transition-card)',
      cursor: onClick ? 'pointer' : 'default',
      textAlign: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      display: 'grid',
      placeItems: 'center'
    }
  }, logo ? /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: name,
    style: {
      maxHeight: 44,
      maxWidth: 110,
      objectFit: 'contain'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-brand-soft)',
      font: 'var(--fw-extrabold) var(--fs-body)/1 var(--font-display)',
      color: 'var(--fx-navy-400)',
      letterSpacing: '0.02em'
    }
  }, initials(name))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-h4)',
      color: 'var(--text-strong)'
    }
  }, name), rate && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-extrabold) var(--fs-h3)/1 var(--font-display)',
      color: 'var(--fx-orange-600)'
    }
  }, rate), note && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, note));
}
Object.assign(__ds_scope, { PaymentMethodTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/payments/PaymentMethodTile.jsx", error: String((e && e.message) || e) }); }

// components/payments/SolutionCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SolutionCard({
  title,
  wordmark,
  description,
  action,
  media,
  tone = 'default',
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      padding: 'var(--space-8)',
      background: tone === 'soft' ? 'var(--surface-alt)' : 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transform: hovered ? 'translateY(-3px)' : 'none',
      transition: 'var(--transition-card)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), media && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-media)',
      overflow: 'hidden',
      background: 'var(--surface-sunken)'
    }
  }, media), wordmark ? /*#__PURE__*/React.createElement("img", {
    src: wordmark,
    alt: title,
    style: {
      height: 30,
      alignSelf: 'flex-start',
      objectFit: 'contain'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-extrabold) var(--fs-h3)/1.1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      flex: 1
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-accent)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, action, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      transform: hovered ? 'translateX(3px)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  }, "\u2192")));
}
Object.assign(__ds_scope, { SolutionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/payments/SolutionCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/HomeScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  StatCard,
  SolutionCard,
  LogoWall,
  Card
} = window.FeexPayDesignSystem_337cd4;
const SOLUTIONS = [{
  title: 'FeexLink',
  description: 'Générez des liens de paiement et partagez-les à vos clients via Facebook, WhatsApp, Messenger, Email et SMS.',
  action: 'Découvrir FeexLink',
  icon: 'link-variant'
}, {
  title: 'FeexCorporate',
  description: 'Facilitez vous la vie en effectuant des paiements en masse vers vos employés, clients, fournisseurs, etc.',
  action: 'Découvrir FeexCorporate',
  icon: 'account-group-outline'
}, {
  title: 'SEND',
  description: "Envoyer de l'argent d'un portefeuille FeexPay à un autre ou d'une boutique à une autre.",
  action: 'Découvrir Send',
  icon: 'send'
}];
const OPERATORS = ['MTN', 'MOOV', 'Airtel', 'Free', 'Wave', 'Celtiis', 'Orange', 'Coris', 'T-Money', 'VISA', 'Mastercard', 'American Express'];
const CLIENTS = ['AfricaKard', 'FA Event', 'COSNA', 'AGA', 'Sanlam', 'Croix-Rouge', 'iZiChange', 'Evently'];
function HomeScreen({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--gradient-hero)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-20) var(--gutter-inline)',
      display: 'grid',
      gridTemplateColumns: '1.05fr .95fr',
      gap: 'var(--space-16)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--type-display-2)',
      letterSpacing: 'var(--ls-display)',
      color: 'var(--text-strong)'
    }
  }, "L'agr\xE9gateur de paiement qui connecte votre business au monde !"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-6)',
      font: 'var(--type-body-lg)',
      color: 'var(--text-muted)',
      maxWidth: 520
    }
  }, "G\xE9rez plusieurs m\xE9thodes de paiement en un seul endroit, boostez vos ventes et offrez une exp\xE9rience client fluide avec FeexPay."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "Cr\xE9er un compte"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "outline"
  }, "Se connecter"))), /*#__PURE__*/React.createElement(MediaSlot, {
    label: "globe.gif \u2014 animation fournie par la marque",
    ratio: "1 / 1"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-inline)',
      transform: 'translateY(-40px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    value: "+2 400 000",
    label: "Transactions effectu\xE9es",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "swap-horizontal",
      size: "lg"
    }),
    elevation: "md"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "+7",
    label: "Pays d'implantation",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "earth",
      size: "lg"
    }),
    elevation: "md"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "+3 500",
    label: "Marchands enregistr\xE9s",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "storefront-outline",
      size: "lg"
    }),
    elevation: "md"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--gutter-inline) var(--space-20)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 'var(--space-6)'
    }
  }, SOLUTIONS.map(s => /*#__PURE__*/React.createElement(SolutionCard, {
    key: s.title,
    title: s.title,
    description: s.description,
    action: s.action,
    onClick: () => onNavigate('Solutions'),
    media: /*#__PURE__*/React.createElement("div", {
      style: {
        height: 150,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--surface-brand-soft)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: s.icon,
      size: 44,
      color: "var(--fx-navy-600)"
    }))
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-alt)',
      padding: 'var(--space-12) 0',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(LogoWall, {
    logos: OPERATORS,
    speed: 34
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--section-y) var(--gutter-inline)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-16)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h1)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, "Pourquoi choisir FeexPay ?"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-6)',
      font: 'var(--type-body-lg)',
      color: 'var(--text-muted)'
    }
  }, "Le d\xE9veloppement de la finance digitale est un catalyseur de la croissance des entreprises et par ricochet de l'\xE9mergence de nos nations. FeexPay est cet agr\xE9gateur de paiement qui vous accompagne dans le d\xE9veloppement de vos affaires \xE0 travers des solutions innovantes, s\xE9curis\xE9es, fiables et \xE0 fort impact \xE9conomique."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 'var(--space-6)'
    }
  }, [['flash', 'Rapidité'], ['shield-check', 'Sécurité'], ['check-decagram', 'Fiabilité']].map(([i, l]) => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--type-label)',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: "md",
    color: "var(--fx-orange-600)"
  }), l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Contactez-nous"))), /*#__PURE__*/React.createElement(MediaSlot, {
    label: "why_feexpay.gif \u2014 animation fournie par la marque"
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--space-16) 0 var(--space-20)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(LogoWall, {
    label: "Ils nous font confiance et parlent de nous.",
    logos: CLIENTS,
    speed: 28
  })), /*#__PURE__*/React.createElement(CtaBand, {
    onNavigate: onNavigate
  }));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/PricingScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  Tabs,
  PaymentMethodTile,
  Card,
  Badge
} = window.FeexPayDesignSystem_337cd4;
const COUNTRIES = ['Bénin', 'Burkina Faso', 'Congo Brazzaville', "Côte d'Ivoire", 'Mali', 'Sénégal', 'Togo'];
const PAYIN = {
  'Bénin': [['MTN Mobile Money', '1,7%'], ['MOOV Money', '1,7%'], ['Celtiis Money', '1,7%'], ['Coris Money', '1,7%']]
};
const PAYOUT = [['MTN Mobile Money', '1%'], ['MOOV Money', '1%'], ['SEND', '0,5%']];
function PricingScreen({
  onNavigate
}) {
  const [country, setCountry] = React.useState('Bénin');
  const payin = PAYIN[country] || PAYIN['Bénin'];
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--gradient-hero)',
      padding: 'var(--space-16) 0 var(--space-10)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '0 var(--gutter-inline)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--type-h1)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, "Tarification"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      font: 'var(--type-body-lg)',
      color: 'var(--text-muted)'
    }
  }, "Des commissions claires, par pays et par r\xE9seau. Aucun frais cach\xE9."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "pill",
    items: COUNTRIES,
    value: country,
    onChange: setCountry,
    style: {
      flexWrap: 'wrap'
    }
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-16) var(--gutter-inline) var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)'
    }
  }, "Payin"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-2)',
      font: 'var(--type-body)',
      color: 'var(--text-muted)'
    }
  }, "(Commission par r\xE9seau pour le client final)"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 'var(--space-4)'
    }
  }, payin.map(([n, r]) => /*#__PURE__*/React.createElement(PaymentMethodTile, {
    key: n,
    name: n,
    rate: r
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--gutter-inline)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)'
    }
  }, "Payout API"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-2)',
      font: 'var(--type-body)',
      color: 'var(--text-muted)'
    }
  }, "Commissions pour l'envoi de fonds via Payout API"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 'var(--space-4)'
    }
  }, PAYOUT.map(([n, r]) => /*#__PURE__*/React.createElement(PaymentMethodTile, {
    key: n,
    name: n,
    rate: r
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-12) var(--gutter-inline)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)'
    }
  }, "Reversements"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4)'
    }
  }, [['FeexPay vers Mobile Money', 'cellphone'], ['FeexPay vers compte bancaire', 'bank-outline']].map(([l, i]) => /*#__PURE__*/React.createElement(Card, {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-brand-soft)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: "lg",
    color: "var(--fx-navy-600)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--type-h4)',
      color: 'var(--text-strong)'
    }
  }, l), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "Gratuit")))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, "* Des frais peuvent s'appliquer pour les reversements vers compte bancaire vers des pays diff\xE9rents.")), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--gutter-inline) var(--space-20)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "inverse",
    padding: "var(--space-12)",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: 'var(--space-12)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)',
      color: 'var(--fx-white)'
    }
  }, "Installation personnalis\xE9e"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      font: 'var(--type-body-lg)',
      color: 'var(--fx-navy-200)'
    }
  }, "En ce qui concerne les moyennes entreprises et celles de grande taille, vous avez le choix de vous faire doter d'une installation personnalis\xE9e afin d'avoir un contr\xF4le sur votre syst\xE8me et vos installations."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "Contactez-nous"))), /*#__PURE__*/React.createElement(MediaSlot, {
    label: "contenu_fr.gif",
    tone: "navy"
  }))), /*#__PURE__*/React.createElement(CtaBand, {
    onNavigate: onNavigate
  }));
}
Object.assign(window, {
  PricingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/PricingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/SiteChrome.jsx
try { (() => {
const {
  Button,
  Icon,
  IconButton
} = window.FeexPayDesignSystem_337cd4;
const NAV = ['Accueil', 'Agréments', 'Solutions', 'Sécurité', 'Tarification', 'FeexPay Business', 'Développeur'];
function SiteHeader({
  active,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-inline)',
      height: 76,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-feexpay.png",
    alt: "FeexPay",
    style: {
      height: 30,
      cursor: 'pointer'
    },
    onClick: () => onNavigate('Accueil')
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      flex: 1
    }
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    onClick: () => onNavigate(n),
    style: {
      font: active === n ? 'var(--type-label)' : 'var(--fw-medium) var(--fs-body-sm)/1.3 var(--font-sans)',
      color: active === n ? 'var(--text-strong)' : 'var(--text-muted)',
      cursor: 'pointer',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      paddingBottom: 2,
      borderBottom: '2px solid ' + (active === n ? 'var(--fx-orange-600)' : 'transparent')
    }
  }, n))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--type-body-sm)',
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "translate",
    size: "sm"
  }), " FR"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, "Se connecter"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Cr\xE9er un compte"))));
}
function CtaBand({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--gradient-inverse)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-20) var(--gutter-inline)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h1)',
      color: 'var(--fx-white)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, "Pr\xEAt \xE0 d\xE9buter cette merveilleuse aventure ?"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      font: 'var(--type-body-lg)',
      color: 'var(--fx-navy-200)'
    }
  }, "Cr\xE9ez un compte d\xE8s maintenant ou posez une question \xE0 nos experts"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 'var(--space-4)',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "Cr\xE9er un compte"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "inverse"
  }, "Se connecter"))));
}
const FOOTER_LINKS = [['Produit', ['Solutions', 'Tarification', 'FeexPay Business', 'Développeur']], ['Entreprise', ['Blog', 'Entreprise', 'Agréments', 'FAQ']], ['Légal', ['Mentions légales', "Conditions Générales d'utilisation", 'Politique de Confidentialité']]];
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--surface-alt)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-16) var(--gutter-inline) var(--space-8)',
      display: 'grid',
      gridTemplateColumns: '1.3fr repeat(3, 1fr)',
      gap: 'var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-feexpay.png",
    alt: "FeexPay",
    style: {
      width: 170
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, ['linkedin', 'facebook', 'twitter', 'youtube'].map(s => /*#__PURE__*/React.createElement(IconButton, {
    key: s,
    icon: s,
    label: s,
    variant: "outline",
    size: "sm",
    shape: "circle"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-muted)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "contact@feexpay.me"), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "support@feexpay.me"))), FOOTER_LINKS.map(([title, links]) => /*#__PURE__*/React.createElement("div", {
    key: title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-strong)'
    }
  }, title), links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-inline) var(--space-10)',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 'var(--space-6)',
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 FeexPay. Tous droits r\xE9serv\xE9s."), /*#__PURE__*/React.createElement("span", null, "Fran\xE7ais \xB7 Anglais")));
}

/* Media the brand ships as animated GIFs on the live site (globe, why_feexpay, product demos).
   Those files were not supplied with the brand assets, so the kit reserves their footprint. */
function MediaSlot({
  label,
  ratio = '16 / 10',
  tone = 'soft',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: ratio,
      borderRadius: 'var(--radius-media)',
      background: tone === 'navy' ? 'var(--gradient-inverse)' : 'var(--surface-alt)',
      border: '1px dashed ' + (tone === 'navy' ? 'var(--border-inverse)' : 'var(--border-default)'),
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      padding: 'var(--space-6)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.png",
    alt: "",
    style: {
      width: 56,
      opacity: tone === 'navy' ? 0 : 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      font: 'var(--type-caption)',
      color: tone === 'navy' ? 'var(--fx-navy-200)' : 'var(--text-subtle)'
    }
  }, label)));
}
Object.assign(window, {
  SiteHeader,
  SiteFooter,
  CtaBand,
  MediaSlot,
  NAV
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/SiteChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/SolutionsScreen.jsx
try { (() => {
const {
  Button,
  Icon,
  Badge
} = window.FeexPayDesignSystem_337cd4;
const PRODUCTS = [{
  name: 'FeexLink',
  icon: 'link-variant',
  title: 'La solution de paiement en un clic',
  body: 'Générez des liens de paiement et partagez-les à vos clients via Facebook, WhatsApp, Messenger, Email et SMS.',
  cta: 'Essayer FeexLink'
}, {
  name: 'FeexCorporate',
  icon: 'account-group-outline',
  title: "La solution d'affaires et d'entreprise idéale pour payer vos clients, fournisseurs et salariés en un clic.",
  body: 'Facilitez vous la vie en effectuant des paiements en masse vers vos employés, clients, fournisseurs, etc.',
  cta: 'Essayer FeexCorporate'
}, {
  name: 'FeexPage',
  icon: 'storefront-outline',
  title: 'Personnalisez vos pages de paiement et offrez une meilleure expérience à vos clients.',
  body: "Bénéficiez d'un lien de paiement unique pour l'ensemble des produits de votre boutique et profitez d'une boutique en ligne directement.",
  cta: 'Essayer FeexPage'
}, {
  name: 'Payout API',
  icon: 'cash-fast',
  title: 'La solution pour planifier, automatiser et contrôler vos paiements en masse.',
  body: "Notre Payout API est un type spécifique d'API qui permet à des applications logicielles de traiter des paiements de façon autonome.",
  cta: 'Essayer Payout API'
}, {
  name: 'SEND',
  icon: 'send',
  title: 'SEND',
  body: "Envoyer de l'argent d'un portefeuille FeexPay à un autre ou d'une boutique à une autre.",
  cta: 'Essayer SEND'
}];
function SolutionsScreen({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--gradient-hero)',
      padding: 'var(--space-16) 0 var(--space-12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '0 var(--gutter-inline)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, "Solutions FeexPay"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 'var(--space-3)',
      font: 'var(--type-h1)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, "Cinq produits, un seul compte marchand"))), PRODUCTS.map((p, i) => /*#__PURE__*/React.createElement("section", {
    key: p.name,
    style: {
      background: i % 2 ? 'var(--surface-alt)' : 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-20) var(--gutter-inline)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-16)',
      alignItems: 'center',
      direction: i % 2 ? 'rtl' : 'ltr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      direction: 'ltr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-brand-soft)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: "lg",
    color: "var(--fx-navy-600)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-extrabold) var(--fs-h3)/1 var(--font-display)',
      color: 'var(--text-strong)'
    }
  }, p.name)), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)',
      letterSpacing: 'var(--ls-heading)'
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-5)',
      font: 'var(--type-body-lg)',
      color: 'var(--text-muted)'
    }
  }, p.body), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, p.cta), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: 'var(--type-label)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play-circle-outline",
    size: "md"
  }), " Vid\xE9o d\xE9mo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      direction: 'ltr'
    }
  }, /*#__PURE__*/React.createElement(MediaSlot, {
    label: p.name.toLowerCase().replace(' ', '_') + '_fr.gif — démo produit'
  }))))), /*#__PURE__*/React.createElement(CtaBand, {
    onNavigate: onNavigate
  }));
}
Object.assign(window, {
  SolutionsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/SolutionsScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.LogoWall = __ds_scope.LogoWall;

__ds_ns.PaymentMethodTile = __ds_scope.PaymentMethodTile;

__ds_ns.SolutionCard = __ds_scope.SolutionCard;

})();
