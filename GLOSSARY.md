# Storefront

A single application that serves many independent online shops, each resolved from its domain and given its own look and catalog.

## Language

**Store**:
One shop on the platform, with its own domains, catalog, customers and look.
_Avoid_: Tenant (in product talk), site, shop instance

**Theme**:
The complete set of visual values a Store uses in light and dark mode: colours, fonts, radius and Style Switch choices.
_Avoid_: Skin, template, design

**Theme Preset**:
A named, reusable starting Theme that a Store can pick and then override.
_Avoid_: Template, variant, design

**Style Switch**:
A choice between a small, fixed set of layouts for one storefront section, such as the hero or the footer.
_Avoid_: Layout option, mode, variant

**Variant**:
One of the four competing storefront redesigns explored on separate branches; a historical source for Theme Presets, not something a Store uses.
_Avoid_: Theme, preset
