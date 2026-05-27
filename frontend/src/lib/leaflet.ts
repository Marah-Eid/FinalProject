// Leaflet bundling fix for Vite.
//
// Leaflet's default Icon URLs point at relative paths (leaflet/dist/images/...)
// that don't resolve through Vite's bundler. We import the PNGs as URL assets
// and override Icon.Default.
import L from 'leaflet'

// Vite resolves `?url` imports to a hashed asset URL at build time.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url'
import iconUrl       from 'leaflet/dist/images/marker-icon.png?url'
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png?url'

// Reset any prototype default that Leaflet auto-derived so our overrides win.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

export { L }
