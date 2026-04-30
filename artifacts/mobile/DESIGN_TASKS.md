# Frontend Design Audit

## Mockup Differences

- Add Character mockup uses a watercolor background, elevated photo tile, clear photo-first gating, soft action buttons, and a disabled CTA until selfie plus name are present. The app was close visually, but the CTA allowed name-only saves and the page needed stronger depth and clearer helper copy.
- Create Story had the right workflow but read more like a plain form than the mockup language: fewer soft shadows, no supporting header copy, and no stable UI identifiers for backend-driven flows.
- Library used functional story rows, but the book covers were narrow and the empty/card states did not feel like the same warm storybook system.
- Book Reader already matched the dark cover direction from the screenshot, but the cover portrait, controls, and end page needed more polish and stable identifiers.

## Tasks

- [x] Keep character, story, library, and reader data IDs unchanged while adding stable `testID` and `nativeID` values to frontend elements.
- [x] Align Add Character with the mockup: photo-first CTA state, watercolor layers, elevated avatar, softer buttons, and clearer page copy.
- [x] Upgrade Create Story with a warmer studio header, stronger card depth, selected-state borders, disabled no-character CTA, and stable IDs.
- [x] Improve Library with shelf/card IDs, wider cover thumbnails, elevated story cards, and a calmer empty state.
- [x] Polish Book Reader with stable controls, larger cover portrait, stronger dark overlay, icon-only end treatment, and more legible navigation.
